"use client";

import { useEffect } from "react";

/** Smooth-scrolls to #search-results whenever the query changes. */
export default function ScrollToResults({ query }: { query: string }) {
  useEffect(() => {
    if (!query) return;
    const id = window.requestAnimationFrame(() => {
      const el = document.getElementById("search-results");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [query]);

  return null;
}
