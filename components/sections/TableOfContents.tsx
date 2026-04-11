"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const tocHoverStyles = `
  .toc-item:not(.toc-active):hover .toc-badge {
    border-color: var(--color-text-primary) !important;
    background-color: transparent !important;
  }
  .toc-item:not(.toc-active):hover .toc-badge .toc-number {
    color: var(--color-text-primary) !important;
  }
  .toc-item:not(.toc-active):hover .toc-text {
    color: var(--color-text-primary) !important;
  }
`;

interface TOCItem {
  id: string;
  text: string;
  toolType?: string; // "rechner" | "checkliste" | "vergleich"
}

interface TableOfContentsProps {
  content: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const RING_SIZE = 38;
const BADGE_SIZE = 30;

const TOOL_COLORS: Record<string, string> = {
  rechner: "var(--color-tool-rechner)",
  checkliste: "var(--color-tool-checklisten)",
  vergleich: "var(--color-tool-vergleiche)",
};

export default function TableOfContents({ content, collapsed = false, onToggleCollapsed }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  const isScrollingRef = useRef(false);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    isScrollingRef.current = true;
    gsap.to(window, {
      scrollTo: { y: el, offsetY: 90 },
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => { isScrollingRef.current = false; },
    });
  }, []);
  const [scrollProgress, setScrollProgress] = useState(0);
  const headingsRef = useRef<HTMLElement[]>([]);
  const articleRef = useRef<HTMLElement | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);

  const loadTOC = () => {
    const article = document.querySelector("article");
    if (!article) return;
    articleRef.current = article;

    const headings = Array.from(article.querySelectorAll("h2"));
    if (headings.length === 0) return;
    headingsRef.current = headings;

    const tocItems: TOCItem[] = [];

    headings.forEach((heading) => {
      if (heading.hasAttribute("data-toc-exclude")) return;
      const isTool = heading.classList.contains("article-tool-label");
      let toolType: string | undefined;
      let text: string;

      if (isTool) {
        const badge = heading.querySelector(".article-tool-badge");
        const titleEl = heading.querySelector(".article-tool-title");
        const badgeText = badge?.textContent?.trim().toLowerCase() || "";
        if (badgeText.includes("rechner")) toolType = "rechner";
        else if (badgeText.includes("checkliste")) toolType = "checkliste";
        else if (badgeText.includes("vergleich")) toolType = "vergleich";
        text = titleEl?.textContent?.trim() || heading.textContent?.trim() || "";
      } else {
        text = heading.textContent || "";
      }

      if (text.trim()) {
        tocItems.push({ id: heading.id, text, toolType });
      }
    });

    setItems(tocItems);

    // Scroll-Handler nur einmal registrieren
    if (!scrollCleanupRef.current) {
      const handleScroll = () => {
        const art = document.querySelector("article");
        if (!art) return;
        const h2s = Array.from(art.querySelectorAll("h2:not([data-toc-exclude])"));
        if (h2s.length === 0) return;

        let currentId = "";
        let progress = 0;

        for (let i = 0; i < h2s.length; i++) {
          const rect = h2s[i].getBoundingClientRect();
          if (rect.top <= 91) {
            currentId = h2s[i].id || "";

            const start = h2s[i].getBoundingClientRect().top + window.scrollY;
            const end =
              i < h2s.length - 1
                ? h2s[i + 1].getBoundingClientRect().top + window.scrollY
                : art.getBoundingClientRect().bottom + window.scrollY;
            const scrollPos = window.scrollY + 91;
            progress = Math.min(1, Math.max(0, (scrollPos - start) / (end - start)));
          }
        }

        setActiveId(currentId);
        setScrollProgress(progress);
      };

      window.addEventListener("scroll", handleScroll);
      scrollCleanupRef.current = () => window.removeEventListener("scroll", handleScroll);
    }
  };

  // Initial load mit Timers (wartet auf dynamische Inhalte wie Tool-Titel)
  useEffect(() => {
    const timers = [
      100, 200, 300, 500, 700, 1000, 1500, 2000, 3000,
    ].map((ms) => setTimeout(loadTOC, ms));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      if (scrollCleanupRef.current) {
        scrollCleanupRef.current();
      }
    };
  }, []);


  if (items.length === 0) return null;

  return (
    <nav style={{ maxWidth: collapsed ? "none" : "300px" }}>
      <style>{tocHoverStyles}</style>
      <ol style={{ display: "flex", flexDirection: "column", gap: collapsed ? "10px" : "20px", listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, idx) => {
          const number = idx + 1;
          const isActive = activeId === item.id;
          const toolColor = item.toolType ? TOOL_COLORS[item.toolType] : undefined;
          const activeColor = toolColor || "var(--color-brand)";
          const toolLabel = item.toolType
            ? item.toolType.charAt(0).toUpperCase() + item.toolType.slice(1)
            : undefined;

          return (
            <li key={item.id}>
              <a
                onClick={(e) => { e.preventDefault(); scrollToId(item.id); }}
                className={`toc-item${isActive ? " toc-active" : ""}`}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* Nummer-Badge mit Progress Ring + optionalem Tool-Dot */}
                <span
                  style={{
                    position: "relative",
                    width: `${RING_SIZE}px`,
                    height: `${RING_SIZE}px`,
                    minWidth: `${RING_SIZE}px`,
                  }}
                >
                  {/* Progress Ring via CSS */}
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${RING_SIZE}px`,
                      height: `${RING_SIZE}px`,
                      borderRadius: "40%",
                      border: `2px solid ${isActive ? activeColor : "transparent"}`,
                      maskImage: isActive
                        ? `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`
                        : "none",
                      WebkitMaskImage: isActive
                        ? `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`
                        : "none",
                      transition: "border-color 0.2s ease",
                      boxSizing: "border-box",
                    }}
                  />
                  {/* Badge */}
                  <span
                    className="toc-badge"
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      width: `${BADGE_SIZE}px`,
                      height: `${BADGE_SIZE}px`,
                      borderRadius: "12px",
                      border: `1px solid ${isActive ? activeColor : "var(--color-text-medium)"}`,
                      backgroundColor: isActive ? activeColor : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Merriweather, serif",
                      fontWeight: 300,
                      fontStyle: "italic",
                      fontSize: "17px",
                      lineHeight: 1,
                      color: isActive ? "#ffffff" : "var(--color-text-medium)",
                      transition: "none",
                    }}
                  >
                    <span className="toc-number" style={{ transform: "skewX(-10deg)", display: "inline-block", color: isActive ? "#ffffff" : "var(--color-text-medium)" }}>
                      {number}
                    </span>
                  </span>
                  {/* Farbiger Dot für Tools – fadet aus wenn aktiv */}
                  {toolColor && (
                    <span
                      style={{
                        position: "absolute",
                        top: "3.5px",
                        left: "3.5px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: toolColor,
                        opacity: isActive ? 0 : 1,
                      }}
                    />
                  )}
                </span>
                {/* Text: Tool mit Label + Titel, oder normaler Heading-Text */}
                {!collapsed && toolLabel ? (
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        alignSelf: "flex-start",
                        backgroundColor: toolColor,
                        color: "#ffffff",
                        fontFamily: "var(--font-body), sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        lineHeight: 1,
                        padding: "5px 8px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {toolLabel}
                    </span>
                    <span
                      className="toc-text"
                      style={{
                        fontFamily: "Merriweather, serif",
                        fontWeight: isActive ? 700 : 300,
                        fontStyle: isActive ? "normal" : "italic",
                        fontSize: "15px",
                        color: isActive ? activeColor : "var(--color-text-medium)",
                        lineHeight: "1.4",
                        transition: "none",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.text}
                    </span>
                  </span>
                ) : !collapsed ? (
                  <span
                    className="toc-text"
                    style={{
                      fontFamily: "Merriweather, serif",
                      fontWeight: isActive ? 700 : 300,
                      fontStyle: isActive ? "normal" : "italic",
                      fontSize: "15px",
                      color: isActive ? "var(--color-brand)" : "var(--color-text-medium)",
                      lineHeight: "1.4",
                      transition: "none",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {item.text}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
