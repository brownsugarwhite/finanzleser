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

  useEffect(() => {
    // Extract only H2 headings from HTML content using regex
    const tocItems: TOCItem[] = [];
    const h2Pattern = /<h2[^>]*>([^<]+)<\/h2>/gi;

    let match;
    while ((match = h2Pattern.exec(content)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, "").trim();
      tocItems.push({
        id: `heading-${tocItems.length}`,
        text,
      });
    }

    setItems(tocItems);

    // Add IDs to H2 headings in the DOM
    setTimeout(() => {
      const article = document.querySelector("article");
      if (article) {
        const headings = article.querySelectorAll("h2");
        headings.forEach((heading, idx) => {
          if (!heading.id) {
            heading.id = `heading-${idx}`;
          }
        });
      }

      // Handle scroll to track active heading
      const handleScroll = () => {
        const article = document.querySelector("article");
        if (!article) return;

        const headings = Array.from(article.querySelectorAll("h2"));
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
    }, 0);
  }, [content]);

  if (items.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-24">
      <div className="text-sm">
        <h3 className="font-bold text-gray-900 mb-4">Inhaltsverzeichnis</h3>
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
