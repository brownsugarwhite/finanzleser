"use client";

import { useEffect, useState } from "react";

// Default-Schwelle 767. Header-Chrome (Menü/Bookmark) nutzt 1000 (Punkt 4),
// Preview-Overlay bleibt bei 767.
export function useIsMobile(maxWidth = 767): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [maxWidth]);

  return isMobile;
}
