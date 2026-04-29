"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface AlphaListItem {
  label: string;
  href: string;
}

interface AlphaListProps {
  items: AlphaListItem[];
  emptyLabel?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function firstLetter(label: string): string {
  const trimmed = label.trim().toUpperCase();
  const ch = trimmed.charAt(0);
  if (/[A-Z]/.test(ch)) return ch;
  // Umlaute / Sonderzeichen normalisieren
  if (ch === "Ä") return "A";
  if (ch === "Ö") return "O";
  if (ch === "Ü") return "U";
  return "#";
}

export default function AlphaList({ items, emptyLabel = "Keine Einträge" }: AlphaListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, AlphaListItem[]>();
    for (const item of items) {
      const letter = firstLetter(item.label);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.label.localeCompare(b.label, "de"));
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
    return sortedKeys.map((letter) => ({ letter, list: map.get(letter)! }));
  }, [items]);

  const availableLetters = useMemo(
    () => new Set(grouped.map((g) => g.letter)),
    [grouped]
  );

  // Scrollspy: track active letter via IntersectionObserver
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const letter = (visible[0].target as HTMLElement).dataset.letter;
          if (letter) setActiveLetter(letter);
        }
      },
      { root, rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [grouped]);

  const scrollToLetter = (letter: string) => {
    const el = sectionRefs.current.get(letter);
    const root = scrollRef.current;
    if (!el || !root) return;
    const top = el.offsetTop - 8;
    root.scrollTo({ top, behavior: "smooth" });
  };

  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-text-secondary)]">{emptyLabel}</p>;
  }

  return (
    <div className="relative h-full">
      {/* Scrollable list */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto pr-8"
        style={{ scrollBehavior: "smooth" }}
      >
        {grouped.map(({ letter, list }) => (
          <div
            key={letter}
            data-letter={letter}
            ref={(el) => {
              if (el) sectionRefs.current.set(letter, el);
              else sectionRefs.current.delete(letter);
            }}
            className="mb-4"
          >
            <div className="sticky top-0 z-10 bg-[var(--color-bg-surface)]/95 backdrop-blur-sm py-1 text-sm font-bold text-[var(--color-brand)]">
              {letter}
            </div>
            <ul className="space-y-1 mt-1">
              {list.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-1.5 text-[var(--color-text-primary)] hover:text-[var(--color-brand)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sticky ABC indicator */}
      <nav
        className="absolute right-0 top-0 h-full flex flex-col items-center justify-center gap-[2px] py-2 select-none"
        aria-label="Alphabet-Navigation"
      >
        {LETTERS.map((letter) => {
          const enabled = availableLetters.has(letter);
          const isActive = activeLetter === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => enabled && scrollToLetter(letter)}
              disabled={!enabled}
              className={cn(
                "w-5 h-4 text-[10px] font-semibold leading-none flex items-center justify-center rounded",
                enabled ? "cursor-pointer" : "cursor-default opacity-30",
                isActive
                  ? "bg-[var(--color-brand)] text-white"
                  : enabled
                  ? "text-[var(--color-text-medium)] hover:text-[var(--color-brand)]"
                  : "text-[var(--color-text-secondary)]"
              )}
              aria-label={`Zu ${letter} springen`}
            >
              {letter}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
