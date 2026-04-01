"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TOCItem {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

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

    const handleScroll = () => {
      let currentId = "";
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = heading.id || "";
        }
      });
      setActiveId(currentId);
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

  const truncate = (text: string, max = 100) =>
    text.length > max ? text.substring(0, max) + "…" : text;

  if (items.length === 0) return null;

  return (
    <nav>
      <ol style={{ display: "flex", flexDirection: "column", gap: "14px", listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, idx) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  textDecoration: "none",
                }}
              >
                {/* Nummer-Badge */}
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    minWidth: "30px",
                    borderRadius: "13px",
                    border: `1px solid ${isActive ? "var(--color-brand)" : "var(--color-text-medium)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Merriweather, serif",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: "19px",
                    lineHeight: 1,
                    transform: "skewX(-5deg)",
                    color: isActive ? "var(--color-brand)" : "var(--color-text-medium)",
                    transition: "color 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  {idx + 1}
                </span>
                {/* Item-Text */}
                <span
                  style={{
                    fontFamily: "Merriweather, serif",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: "15px",
                    color: isActive ? "var(--color-brand)" : "var(--color-text-primary)",
                    lineHeight: "1.4",
                    transition: "color 0.2s ease",
                  }}
                >
                  {truncate(item.text)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
