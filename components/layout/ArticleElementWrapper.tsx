"use client";

import { useEffect, useState } from "react";

type Variant = "wide" | "centered";

const TOC_EXPANDED_WIDTH = 430;

export default function ArticleElementWrapper({
  variant,
  collapsed,
  children,
}: {
  variant: Variant;
  collapsed: boolean;
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

  // Centered (Artikeltext) immer auf 750 begrenzt — auch ≤1024, damit der Text
  // beim Unterschreiten von 1024 nicht breiter wird als im Desktop. Wide (Tools)
  // geht ≤1024 auf volle Breite, Desktop 80vw.
  const maxWidth = variant === "wide" ? (isMobile ? "100%" : "80vw") : 750;
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const computeShift = () => {
      // ≤1024: kein Text-Shift — Desktop-TOC ist ausgeblendet (Mobile-Overlay).
      if (window.matchMedia("(max-width: 1024px)").matches) { setShift(0); return; }
      const vw = window.innerWidth;
      const elementWidth = variant === "wide" ? vw * 0.8 : Math.min(vw, 750);
      const leftOffset = (vw - elementWidth) / 2;
      const next = !collapsed && leftOffset < TOC_EXPANDED_WIDTH
        ? TOC_EXPANDED_WIDTH - leftOffset
        : 0;
      setShift(next);
    };

    computeShift();
    window.addEventListener("resize", computeShift);
    return () => window.removeEventListener("resize", computeShift);
  }, [variant, collapsed]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        className="article-element-wrapper"
        style={{
          width: "100%",
          maxWidth,
          transform: `translateX(${shift}px)`,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
