"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sticky Werbe-Rails links + rechts neben dem Artikel.
 * - Beginnen oben im relativen Wrapper (auf Leaderboard-Höhe), innen sticky (top:100px).
 * - Breite per CSS-var --ad-rail-w: 300px ≥1760px, 160px ≥1440px, darunter aus.
 * - Beim Aufklappen des Sidebar-TOC wandern sie per translateX mit dem Content mit;
 *   linke Rail wird dabei ausgeblendet (kein Platz neben 430px-TOC).
 * - Der Sticky-Bereich ENDET beim ersten Finanztool (`.article-finanztool`): die
 *   Rail-Höhe wird bis dorthin begrenzt, sodass die Rails ab den Finanztools nach
 *   oben mitscrollen (statt die breiten Tools zu überlappen).
 */
const TOC_EXPANDED_WIDTH = 430;
const RAIL_TOP = 18;

export default function ArticleAdRails({
  collapsed,
  show,
}: {
  collapsed: boolean;
  show: boolean;
}) {
  const [shift, setShift] = useState(0);
  const [height, setHeight] = useState<number | null>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Content-Shift bei aufgeklapptem TOC (gleiche Formel wie ArticleElementWrapper).
  useEffect(() => {
    const compute = () => {
      if (window.matchMedia("(max-width: 1440px)").matches) {
        setShift(0);
        return;
      }
      const vw = window.innerWidth;
      const leftOffset = (vw - Math.min(vw, 750)) / 2;
      setShift(
        !collapsed && leftOffset < TOC_EXPANDED_WIDTH
          ? TOC_EXPANDED_WIDTH - leftOffset
          : 0
      );
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [collapsed]);

  // Sticky-Höhe bis zum ersten Finanztool begrenzen.
  useEffect(() => {
    if (!show) return;
    const region = rightRef.current?.closest(".article-body-region") as HTMLElement | null;
    if (!region) return;
    const compute = () => {
      const tool = region.querySelector(".article-finanztool") as HTMLElement | null;
      if (!tool) {
        setHeight(null); // kein Tool → Rails über den ganzen Artikel
        return;
      }
      // Direktes Region-Kind (Unit-Wrapper) des Tools finden.
      let unit: HTMLElement = tool;
      while (unit.parentElement && unit.parentElement !== region) {
        unit = unit.parentElement;
      }
      // Grenze = Unterkante des Elements VOR dem Tool (= Ende des Fazit-Texts);
      // gibt es keins, fällt sie auf die Tool-Oberkante zurück.
      const prev = unit.previousElementSibling as HTMLElement | null;
      const regionTop = region.getBoundingClientRect().top;
      const boundary = prev
        ? prev.getBoundingClientRect().bottom - regionTop
        : unit.getBoundingClientRect().top - regionTop;
      setHeight(Math.max(0, boundary - RAIL_TOP));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(region);
    window.addEventListener("resize", compute);
    // Tools laden asynchron (dynamic import) → nachmessen.
    const t1 = setTimeout(compute, 600);
    const t2 = setTimeout(compute, 1600);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [show]);

  if (!show) return null;

  const railStyle = {
    transform: `translateX(${shift}px)`,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ...(height != null ? { height, bottom: "auto" as const } : {}),
  };

  return (
    <>
      {collapsed && (
        <div className="article-ad-rail article-ad-rail-left" style={railStyle}>
          <div className="article-ad-rail-sticky">
            <div className="article-ad-rail-box" data-ad-format="rail" aria-label="Werbung" />
          </div>
        </div>
      )}
      <div ref={rightRef} className="article-ad-rail article-ad-rail-right" style={railStyle}>
        <div className="article-ad-rail-sticky">
          <div className="article-ad-rail-box" data-ad-format="rail" aria-label="Werbung" />
        </div>
      </div>
    </>
  );
}
