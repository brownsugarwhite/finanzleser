"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface TOCItem {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  content: string;
}

const RING_SIZE = 40; // 30px badge + 2×5px gap
const BADGE_SIZE = 30;
const RING_BORDER_RADIUS = 17;
// Umfang eines Rounded Rect: 4 Geraden + 4 Viertelkreise
const RING_RECT_W = RING_SIZE - 2; // 38 (1px inset for stroke)
const RING_RECT_H = RING_SIZE - 2;
const RING_CIRCUMFERENCE =
  2 * (RING_RECT_W - 2 * RING_BORDER_RADIUS) +
  2 * (RING_RECT_H - 2 * RING_BORDER_RADIUS) +
  2 * Math.PI * RING_BORDER_RADIUS;

export default function TableOfContents({ content }: TableOfContentsProps) {
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

          // Calculate progress within this section
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

  return (
    <nav>
      <ol style={{ display: "flex", flexDirection: "column", gap: "20px", listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, idx) => {
          const isActive = activeId === item.id;
          const dashOffset = isActive
            ? RING_CIRCUMFERENCE * (1 - scrollProgress)
            : RING_CIRCUMFERENCE;

          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
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
                  {/* SVG Progress Ring */}
                  <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: "rotate(-90deg)",
                    }}
                  >
                    <rect
                      x="1"
                      y="1"
                      width={RING_RECT_W}
                      height={RING_RECT_H}
                      rx={RING_BORDER_RADIUS}
                      ry={RING_BORDER_RADIUS}
                      fill="none"
                      stroke={isActive ? "var(--color-brand)" : "transparent"}
                      strokeWidth="2"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.15s ease-out, stroke 0.2s ease" }}
                    />
                  </svg>
                  {/* Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: "5px",
                      left: "5px",
                      width: `${BADGE_SIZE}px`,
                      height: `${BADGE_SIZE}px`,
                      borderRadius: "13px",
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
                      transition: "color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
                    }}
                  >
                    <span style={{ transform: "skewX(-10deg)", display: "inline-block", color: isActive ? "#ffffff" : "var(--color-text-medium)" }}>
                      {idx + 1}
                    </span>
                  </span>
                </span>
                {/* Item-Text */}
                <span
                  style={{
                    fontFamily: "Merriweather, serif",
                    fontWeight: isActive ? 700 : 300,
                    fontStyle: isActive ? "normal" : "italic",
                    fontSize: "15px",
                    color: isActive ? "var(--color-brand)" : "var(--color-text-medium)",
                    lineHeight: "1.4",
                    transition: "color 0.2s ease",
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
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
