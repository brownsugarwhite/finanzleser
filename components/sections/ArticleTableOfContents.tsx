"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Rechner } from "@/lib/types";

interface TOCItem {
  id: string;
  text: string;
}

interface ArticleTableOfContentsProps {
  content: string;
  tools?: Rechner[];
}

interface TOCToolItem {
  type: "rechner" | "vergleich" | "checkliste";
  label: string;
  title: string;
  color: string;
}

const toolPlaceholders: TOCToolItem[] = [
  { type: "rechner", label: "Rechner", title: "Steuerrechner 2026", color: "var(--color-tool-rechner)" },
  { type: "vergleich", label: "Vergleich", title: "Festgeldvergleich", color: "var(--color-tool-vergleiche)" },
  { type: "checkliste", label: "Checkliste", title: "Steuererklärung Checkliste", color: "var(--color-tool-checklisten)" },
];

type MergedItem =
  | { kind: "heading"; item: TOCItem; number: number }
  | { kind: "tool"; tool: TOCToolItem; number: number };

function NumberBadge({ number, color }: { number: number; color?: string }) {
  return (
    <span style={{
      position: "relative",
      width: 36,
      height: 36,
      flexShrink: 0,
    }}>
      <span style={{
        width: 36,
        height: 36,
        borderRadius: 15,
        border: "1px solid var(--color-text-medium)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
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
          top: 0,
          left: 1,
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

export default function ArticleTableOfContents({ content, tools }: ArticleTableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);

  const loadTOC = () => {
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(article.querySelectorAll("h2"));
    if (headings.length === 0) return;

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
  };

  useEffect(() => {
    const timers = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000].map((ms) =>
      setTimeout(loadTOC, ms)
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  if (items.length === 0 && (!tools || tools.length === 0)) {
    return null;
  }

  // Merge headings + tool placeholders at fixed positions
  const merged: MergedItem[] = [];
  let num = 0;

  for (let i = 0; i < items.length; i++) {
    num++;
    merged.push({ kind: "heading", item: items[i], number: num });

    // After 3rd heading → Rechner
    if (i === 2) {
      num++;
      merged.push({ kind: "tool", tool: toolPlaceholders[0], number: num });
    }
    // After 5th heading → Vergleich
    if (i === 4) {
      num++;
      merged.push({ kind: "tool", tool: toolPlaceholders[1], number: num });
    }
  }
  // Checkliste at end
  num++;
  merged.push({ kind: "tool", tool: toolPlaceholders[2], number: num });

  return (
    <div className="mb-12">
      <p style={{ fontSize: "24px", fontWeight: 600, fontFamily: "var(--font-heading, 'Merriweather', serif)", marginBottom: "23px", color: "var(--color-text-primary)", margin: "0 0 36px 0" }}>
        Inhaltsverzeichnis
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
        {merged.map((entry) => {
          if (entry.kind === "tool") {
            const { tool } = entry;
            return (
              <div
                key={`tool-${tool.type}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <NumberBadge number={entry.number} color={tool.color} />
                  <ArrowLine />
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-block",
                    backgroundColor: tool.color,
                    color: "#ffffff",
                    fontFamily: "var(--font-body), sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1,
                    padding: "8px 12px",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                  }}>
                    {tool.label}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: 17,
                    color: "var(--color-text-medium)",
                    lineHeight: 1.4,
                  }}>
                    {tool.title}
                  </span>
                </span>
              </div>
            );
          }

          const { item } = entry;
          return (
            <Link
              key={item.id}
              href={`#${item.id}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
                textDecoration: "none",
              }}
              className="hover:opacity-80 transition"
            >
              <span style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
                <NumberBadge number={entry.number} />
                <ArrowLine />
              </span>
              <span style={{
                fontSize: 17,
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--color-text-medium)",
              }}>
                {item.text}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
