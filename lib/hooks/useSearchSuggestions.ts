"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

export type Suggestion = { title: string; url: string };

/** Splits a title into [head, tail] where head includes everything up to and
 *  including the matched query, tail is the remainder (rendered bold). */
export function splitMatch(title: string, query: string): [string, string] {
  if (!query) return [title, ""];
  const lower = title.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return [title, ""];
  if (idx === 0) return [title.slice(0, q.length), title.slice(q.length)];
  return [title.slice(0, idx + q.length), title.slice(idx + q.length)];
}

/** Encapsulates suggestion state, debounced fetch, outside-click close,
 *  and dynamic max-height animation for the dropdown panel. */
export function useSearchSuggestions(
  value: string,
  wrapperRef: RefObject<HTMLElement | null>,
) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listWrapRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setHighlight(-1);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/search-suggest?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data: { suggestions: Suggestion[] } = await res.json();
        setSuggestions(data.suggestions ?? []);
        setHighlight(-1);
      } catch {
        // aborted or network error: ignore
      }
    }, 150);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  // Close on outside click (relative to the supplied wrapper)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const w = wrapperRef.current;
      if (!w) return;
      if (!w.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [wrapperRef]);

  const showDropdown =
    isOpen && suggestions.length > 0 && value.trim().length >= 2;

  // Animate dropdown to its actual content height
  useEffect(() => {
    const el = listWrapRef.current;
    if (!el) return;
    if (showDropdown) {
      el.style.maxHeight = el.scrollHeight + "px";
    } else {
      el.style.maxHeight = "0px";
    }
  }, [showDropdown, suggestions]);

  const matches = useMemo(
    () => suggestions.map((s) => ({ ...s, parts: splitMatch(s.title, value) })),
    [suggestions, value],
  );

  return {
    suggestions,
    matches,
    isOpen,
    setIsOpen,
    highlight,
    setHighlight,
    showDropdown,
    listWrapRef,
  };
}
