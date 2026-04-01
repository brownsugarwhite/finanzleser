"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

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
}

interface TOCToolItem {
  type: "rechner" | "vergleich" | "checkliste";
  label: string;
  title: string;
  color: string;
}

interface TableOfContentsProps {
  content: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const RING_SIZE = 38;
const BADGE_SIZE = 30;

const toolPlaceholders: TOCToolItem[] = [
  { type: "rechner", label: "Rechner", title: "Steuerrechner 2026", color: "var(--color-tool-rechner)" },
  { type: "vergleich", label: "Vergleich", title: "Festgeldvergleich", color: "var(--color-tool-vergleiche)" },
  { type: "checkliste", label: "Checkliste", title: "Steuererklärung Checkliste", color: "var(--color-tool-checklisten)" },
];

type MergedItem =
  | { kind: "heading"; item: TOCItem; number: number }
  | { kind: "tool"; tool: TOCToolItem; number: number };

export default function TableOfContents({ content, collapsed = false, onToggleCollapsed }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const headingsRef = useRef<HTMLElement[]>([]);
  const articleRef = useRef<HTMLElement | null>(null);

  const loadTOC = () => {
    const article = document.querySelector("article");
    if (!article) return;
    articleRef.current = article;

    const headings = Array.from(article.querySelectorAll("h2"));
    if (headings.length === 0) return;
    headingsRef.current = headings;

    const tocItems: TOCItem[] = [];

    headings.forEach((heading, idx) => {
      const id = `heading-${idx}`;
      if (!heading.id) {
        heading.id = id;
      }

      const text = heading.textContent || "";
      if (text.trim()) {
        tocItems.push({
          id: heading.id,
          text,
        });
      }
    });

    setItems(tocItems);

    const handleScroll = () => {
      let currentId = "";
      let progress = 0;

      for (let i = 0; i < headings.length; i++) {
        const rect = headings[i].getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = headings[i].id || "";

          const start = headings[i].getBoundingClientRect().top + window.scrollY;
          const end =
            i < headings.length - 1
              ? headings[i + 1].getBoundingClientRect().top + window.scrollY
              : article.getBoundingClientRect().bottom + window.scrollY;
          const scrollPos = window.scrollY + 100;
          progress = Math.min(1, Math.max(0, (scrollPos - start) / (end - start)));
        }
      }

      setActiveId(currentId);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  };

  useEffect(() => {
    const timers = [
      100, 200, 300, 500, 700, 1000, 1500, 2000, 3000,
    ].map((ms) => setTimeout(loadTOC, ms));

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  if (items.length === 0) return null;

  // Merge headings + tool placeholders at fixed positions
  const merged: MergedItem[] = [];
  let num = 0;

  for (let i = 0; i < items.length; i++) {
    num++;
    merged.push({ kind: "heading", item: items[i], number: num });

    // After 3rd heading (index 2) → Rechner
    if (i === 2) {
      num++;
      merged.push({ kind: "tool", tool: toolPlaceholders[0], number: num });
    }
    // After 5th heading (index 4) → Vergleich
    if (i === 4) {
      num++;
      merged.push({ kind: "tool", tool: toolPlaceholders[1], number: num });
    }
  }
  // Checkliste always at end
  num++;
  merged.push({ kind: "tool", tool: toolPlaceholders[2], number: num });

  return (
    <nav style={{ maxWidth: collapsed ? "none" : "300px" }}>
      <style>{tocHoverStyles}</style>
      <h3
        style={{
          fontFamily: "Merriweather, serif",
          fontSize: collapsed ? "14px" : "18px",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: "0 0 " + (collapsed ? "12px" : "23px") + " 0",
          textAlign: collapsed ? "center" : "left",
        }}
      >
        {collapsed ? "Inhalt" : "Inhaltsverzeichnis"}
      </h3>
      <ol style={{ display: "flex", flexDirection: "column", gap: collapsed ? "10px" : "20px", listStyle: "none", margin: 0, padding: 0 }}>
        {merged.map((entry, idx) => {
          if (entry.kind === "tool") {
            const { tool } = entry;
            return (
              <li key={`tool-${tool.type}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {/* Badge mit farbigem Dot */}
                  <span
                    style={{
                      position: "relative",
                      width: `${RING_SIZE}px`,
                      height: `${RING_SIZE}px`,
                      minWidth: `${RING_SIZE}px`,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        width: `${BADGE_SIZE}px`,
                        height: `${BADGE_SIZE}px`,
                        borderRadius: "13px",
                        border: "1px solid var(--color-text-medium)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Merriweather, serif",
                        fontWeight: 300,
                        fontStyle: "italic",
                        fontSize: "17px",
                        lineHeight: 1,
                        color: "var(--color-text-medium)",
                      }}
                    >
                      <span style={{ transform: "skewX(-10deg)", display: "inline-block" }}>
                        {entry.number}
                      </span>
                    </span>
                    {/* Farbiger Dot */}
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: "4px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: tool.color,
                      }}
                    />
                  </span>
                  {/* Label + Titel */}
                  <span style={{ display: collapsed ? "none" : "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        alignSelf: "flex-start",
                        backgroundColor: tool.color,
                        color: "#ffffff",
                        fontFamily: "var(--font-body), sans-serif",
                        fontSize: "12px",
                        fontWeight: 600,
                        lineHeight: 1,
                        padding: "5px 8px",
                        borderRadius: "0px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {tool.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "Merriweather, serif",
                        fontWeight: 300,
                        fontStyle: "italic",
                        fontSize: "15px",
                        color: "var(--color-text-medium)",
                        lineHeight: "1.4",
                      }}
                    >
                      {tool.title}
                    </span>
                  </span>
                </div>
              </li>
            );
          }

          // Regular heading item
          const { item } = entry;
          const isActive = activeId === item.id;

          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                className={`toc-item${isActive ? " toc-active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* Nummer-Badge mit Progress Ring */}
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
                      border: `2px solid ${isActive ? "var(--color-brand)" : "transparent"}`,
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
                      border: `1px solid ${isActive ? "var(--color-brand)" : "var(--color-text-medium)"}`,
                      backgroundColor: isActive ? "var(--color-brand)" : "transparent",
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
                      {entry.number}
                    </span>
                  </span>
                </span>
                {/* Item-Text */}
                {!collapsed && (
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
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
