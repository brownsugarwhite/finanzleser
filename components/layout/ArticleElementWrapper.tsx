"use client";

import { useEffect, useState } from "react";

type Variant = "wide" | "centered" | "hero" | "tool";

const TOC_EXPANDED_WIDTH = 430;
const AD_RAIL_GAP = 40;
// Beim expandierten TOC rückt der Content 30px näher an den linken Rand (Gap war zu groß).
const CONTENT_CLEAR = TOC_EXPANDED_WIDTH - 30;

// Geteiltes Timing für Content-Shift / Tool-Reflow / Ad-Rails — IDENTISCH zum
// Sidebar-TOC (ArticleSidebar: 0.35s cubic-bezier(0.65,0,0.35,1)), damit
// Content-Verschiebung und TOC-Öffnen exakt gleich laufen.
const SHIFT_TRANSITION = "transform 0.35s cubic-bezier(0.65, 0, 0.35, 1)";

// Breite der "hero"-Variante: exakt die Außenspanne Rail+Gap+750+Gap+Rail —
// fluchtet mit den Rail-Außenkanten. Muss zu den CSS-Vars --ad-rail-* +
// Breakpoint (1760px) in components.css passen.
function heroWidthPx(vw: number): number {
  const railW = vw >= 1760 ? 300 : 160;
  return Math.min(vw, 750 + 2 * (AD_RAIL_GAP + railW));
}

export default function ArticleElementWrapper({
  variant,
  collapsed,
  noShift = false,
  children,
}: {
  variant: Variant;
  collapsed: boolean;
  /** Heading: niemals horizontal verschieben (TOC liegt darunter, kein Overlap). */
  noShift?: boolean;
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // ── Content-Shift (hero/centered/wide) beim Aufklappen des TOC ──
  const [shift, setShift] = useState(0);
  useEffect(() => {
    if (variant === "tool" || noShift) {
      setShift(0);
      return;
    }
    const computeShift = () => {
      // ≤1024: kein Text-Shift — Desktop-TOC ist ausgeblendet (Mobile-Overlay).
      if (window.matchMedia("(max-width: 1024px)").matches) {
        setShift(0);
        return;
      }
      const vw = window.innerWidth;
      // "wide" (Top-Leaderboard) shiftet IDENTISCH zum zentrierten Text (750) —
      // verschiebt also nur mit dem Text, statt nach seiner eigenen 80vw-Breite.
      const elementWidth = variant === "hero" ? heroWidthPx(vw) : Math.min(vw, 750);
      const leftOffset = (vw - elementWidth) / 2;
      const next = !collapsed && leftOffset < CONTENT_CLEAR ? CONTENT_CLEAR - leftOffset : 0;
      setShift(next);
    };

    computeShift();
    window.addEventListener("resize", computeShift);
    return () => window.removeEventListener("resize", computeShift);
  }, [variant, collapsed, noShift]);

  // Tool (Vergleich/Dokumente): rein CSS-getrieben (min/max gegen 100% des Containers)
  // → folgt dem Viewport kontinuierlich OHNE JS-Resize-Lag. --toc-min = linker
  // Mindestabstand (TOC-Breite + 20px); expanded 30px enger. Toggle animiert via
  // CSS-Transition auf width/margin-left (siehe .article-tool-wrapper).
  if (variant === "tool") {
    const tocMin = collapsed ? "120px" : "420px"; // collapsed 100+20 ; expanded 400+20 (30px enger)
    return (
      <div style={{ width: "100%" }}>
        <div
          className="article-element-wrapper article-tool-wrapper"
          style={{ ["--toc-min" as string]: tocMin }}
        >
          {children}
        </div>
      </div>
    );
  }

  // Centered (Artikeltext) immer auf 750 begrenzt — auch ≤1024, damit der Text
  // beim Unterschreiten von 1024 nicht breiter wird als im Desktop. Wide (Tools)
  // geht ≤1024 auf volle Breite, Desktop 80vw.
  const maxWidth =
    variant === "hero"
      ? isMobile
        ? "100%"
        // +160px breiter, damit das neue 80px-Seiten-Padding (border-box) die
        // Innenbreite nicht verkleinert (Rail-Flucht bleibt erhalten).
        : "calc(750px + 2 * (var(--ad-rail-gap) + var(--ad-rail-w)) + 160px)"
      : variant === "wide"
        ? isMobile
          ? "100%"
          : "80vw"
        : 750;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        className={`article-element-wrapper article-element-wrapper--${variant}`}
        style={{
          width: "100%",
          maxWidth,
          transform: `translateX(${shift}px)`,
          transition: SHIFT_TRANSITION,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
