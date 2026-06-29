"use client";

import { useEffect } from "react";

/** Smooth-scrolls to #search-results whenever the query changes. */
export default function ScrollToResults({ query }: { query: string }) {
  useEffect(() => {
    if (!query) return;
    const doScroll = () => {
      const el = document.getElementById("search-results");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    // rAF für den Sofort-Fall + ein verzögerter Versuch, falls die Seiten-Transition
    // (navigate) den Scroll zunächst zurücksetzt oder die Ergebnisse später mounten.
    const id = window.requestAnimationFrame(doScroll);
    const t = window.setTimeout(doScroll, 450);
    return () => { window.cancelAnimationFrame(id); window.clearTimeout(t); };
  }, [query]);

  return null;
}
