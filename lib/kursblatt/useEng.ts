"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Containerbreite als Boolean — für die wenigen Entscheidungen, die CSS nicht treffen kann.
 *
 * README des Kursblatt-Handoffs, „Breakpoints“: „Containerbreite (ResizeObserver auf dem
 * Wurzel-Element, nicht Viewport): eng = Breite < 560 px“.
 *
 * 🚨 Fast alles davon ist in kursblatt.css eine `@container kb (max-width: 559px)`-Regel
 * und braucht dieses Hook NICHT. Ein `useState(false)`, das auf dem Server immer falsch
 * ist und nach dem ersten Effekt umspringt, erzeugt auf jedem Telefon einen sichtbaren
 * Umbruch. Hier bleiben nur vier Fälle, in denen ein Wert nach JavaScript verlangt und
 * die erst nach einer Berührung sichtbar werden:
 *   1. gleitender Block des Segment-Umschalters (gemessene Knopfbreiten)
 *   2. Tooltip des Zinsbands (Versatz klemmen)
 *   3. Achsenbeschriftung der Zinskurve („3 Monate“ / „3 M.“)
 *   4. Hinweistext des Scrubbers (Maus / Berührung)
 */
export function useEng<T extends HTMLElement>(grenze = 560) {
  const ref = useRef<T | null>(null);
  const [eng, setEng] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const messen = () => setEng(el.clientWidth > 0 && el.clientWidth < grenze);
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grenze]);

  return [ref, eng] as const;
}
