"use client";

import { useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

interface TOCItem {
  id: string;
  text: string;
  toolType?: string; // "rechner" | "checkliste" | "vergleich" — oder undefined für normale Überschriften
}

interface ArticleTableOfContentsProps {
  content: string;
}

// Tool-Farben für farbigen Punkt im TOC
const TOOL_COLORS: Record<string, string> = {
  rechner: "var(--color-tool-rechner)",
  checkliste: "var(--color-tool-checklisten)",
  vergleich: "var(--color-tool-vergleiche)",
};

function NumberBadge({ number, color }: { number: number; color?: string }) {
  return (
    <span style={{
      position: "relative",
      width: 32,
      height: 32,
      flexShrink: 0,
    }}>
      <span style={{
        width: 32,
        height: 32,
        borderRadius: 13,
        border: "1px solid var(--color-text-medium)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 19,
        fontFamily: "var(--font-heading, 'Merriweather', serif)",
        fontStyle: "italic",
        fontWeight: 300,
        color: "var(--color-text-medium)",
      }}>
        <span style={{ transform: "skewX(-10deg)", display: "inline-block" }}>
          {number}
        </span>
      </span>
      {color && (
        <span style={{
          position: "absolute",
          top: -1,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }} />
      )}
    </span>
  );
}

function ArrowLine() {
  return (
    <>
      <span style={{
        width: 36,
        height: 0,
        borderTop: "1px solid var(--color-text-medium)",
        flexShrink: 0,
      }} />
      <svg width="8" height="8" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ flexShrink: 0, marginLeft: -4, transform: "rotate(180deg)" }}>
        <polyline points="16.95 15.27 8.27 8.11 16.95 .5" stroke="var(--color-text-medium)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
}

export default function ArticleTableOfContents({ content }: ArticleTableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    gsap.to(window, {
      scrollTo: { y: el, offsetY: 90 },
      duration: 0.8,
      ease: "power2.inOut",
    });
  }, []);

  const loadTOC = () => {
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(article.querySelectorAll("h2"));
    if (headings.length === 0) return;

    const tocItems: TOCItem[] = [];

    headings.forEach((heading) => {
      // Tool-H2 erkennen (hat Klasse article-tool-label)
      const isTool = heading.classList.contains("article-tool-label");
      let toolType: string | undefined;
      let text: string;

      if (isTool) {
        // Badge-Element enthält den Tool-Typ-Text ("Rechner", "Checkliste", etc.)
        const badge = heading.querySelector(".article-tool-badge");
        const titleEl = heading.querySelector(".article-tool-title");
        const badgeText = badge?.textContent?.trim().toLowerCase() || "";
        // Tool-Typ aus Badge-Text ableiten
        if (badgeText.includes("rechner")) toolType = "rechner";
        else if (badgeText.includes("checkliste")) toolType = "checkliste";
        else if (badgeText.includes("vergleich")) toolType = "vergleich";
        // Nur den Titel-Text verwenden (ohne Badge)
        text = titleEl?.textContent?.trim() || heading.textContent?.trim() || "";
      } else {
        text = heading.textContent || "";
      }

      if (text.trim()) {
        tocItems.push({ id: heading.id, text, toolType });
      }
    });

    setItems(tocItems);
  };

  useEffect(() => {
    const timers = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000].map((ms) =>
      setTimeout(loadTOC, ms)
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <p style={{ fontSize: "27px", fontWeight: 600, fontFamily: "var(--font-heading, 'Merriweather', serif)", marginBottom: "23px", color: "var(--color-text-primary)", margin: "0 0 36px 0" }}>
        Inhaltsverzeichnis
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((item, idx) => {
          const number = idx + 1;
          const toolColor = item.toolType ? TOOL_COLORS[item.toolType] : undefined;
          const toolLabel = item.toolType
            ? item.toolType.charAt(0).toUpperCase() + item.toolType.slice(1)
            : undefined;

          return (
            <a
              key={item.id}
              onClick={(e) => { e.preventDefault(); scrollToId(item.id); }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
                textDecoration: "none",
                cursor: "pointer",
              }}
              className="hover:opacity-80 transition"
            >
              <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <NumberBadge number={number} color={toolColor} />
                <ArrowLine />
              </span>
              {toolLabel ? (
                <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-block",
                    backgroundColor: toolColor,
                    color: "#ffffff",
                    fontFamily: "var(--font-body), sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1,
                    padding: "8px 12px",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}>
                    {toolLabel}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: 17,
                    color: "var(--color-text-medium)",
                    lineHeight: 1.4,
                  }}>
                    {item.text}
                  </span>
                </span>
              ) : (
                <span style={{
                  fontSize: 17,
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  color: "var(--color-text-medium)",
                }}>
                  {item.text}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
