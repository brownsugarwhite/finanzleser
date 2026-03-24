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
    // Try to load at multiple times
    const timers = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000].map((ms) =>
      setTimeout(loadTOC, ms)
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  if (items.length === 0 && (!tools || tools.length === 0)) {
    return null;
  }

  return (
    <div className="mb-12 pt-8 border-t border-gray-200">
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "1em", color: "var(--color-text-primary)" }}>
        Inhaltsverzeichnis
      </h3>

      <div className="space-y-6">
        {/* Headings */}
        {items.length > 0 && (
          <ol style={{ paddingLeft: "1.5em", lineHeight: "1.6" }}>
            {items.map((item, idx) => (
              <li key={item.id} style={{ marginBottom: "0.5em" }}>
                <Link
                  href={`#${item.id}`}
                  style={{
                    color: "var(--color-brand)",
                    textDecoration: "none",
                    fontSize: "15px",
                  }}
                  className="hover:opacity-80 transition"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ol>
        )}

        {/* Tools */}
        {tools && tools.length > 0 && (
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "0.75em", color: "var(--color-text-medium)" }}>
              Finanztools in diesem Artikel
            </h4>
            <ul style={{ paddingLeft: "1.5em", lineHeight: "1.6" }}>
              {tools.map((tool) => (
                <li key={tool.id} style={{ marginBottom: "0.5em" }}>
                  <Link
                    href={`/finanztools/rechner/${tool.slug}`}
                    style={{
                      color: "var(--color-brand)",
                      textDecoration: "none",
                      fontSize: "15px",
                    }}
                    className="hover:opacity-80 transition"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
