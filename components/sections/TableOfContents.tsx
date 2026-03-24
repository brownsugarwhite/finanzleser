"use client";

import { useEffect, useLayoutEffect, useState } from "react";
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
    // Versuche zu mehreren Zeitpunkten zu laden
    const timers = [
      100, 200, 300, 500, 700, 1000, 1500, 2000, 3000
    ].map(ms => setTimeout(loadTOC, ms));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  return (
    <nav className="hidden lg:block sticky top-24">
      <div className="text-sm">
        <h3 className="font-bold text-gray-900 mb-4">Inhaltsverzeichnis</h3>
        {items.length === 0 && (
          <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
            Keine Überschriften gefunden
          </div>
        )}
        <ol className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.id} className="flex gap-2">
              <span className="flex-shrink-0 text-gray-700">{idx + 1}.</span>
              <Link
                href={`#${item.id}`}
                className={`transition ${
                  activeId === item.id
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item.text}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
