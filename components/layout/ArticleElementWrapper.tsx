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
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Mobile: full bleed (no horizontal margin). Desktop: keep wide=80vw / centered=750px.
  const maxWidth = isMobile ? "100%" : variant === "wide" ? "80vw" : 750;
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const computeShift = () => {
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
        style={{
          width: "100%",
          maxWidth,
          transform: `translateX(${shift}px)`,
          transition: "transform 0.3s ease",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
