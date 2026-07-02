"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sticky Werbe-Rails links + rechts neben dem Artikel.
 * - Beginnen oben im relativen Wrapper (auf Leaderboard-Höhe), innen sticky (top:100px).
 * - Breite per CSS-var --ad-rail-w: 300px ≥1760px, 160px ≥1440px, darunter aus.
 * - Beim Aufklappen des Sidebar-TOC wandern sie per translateX mit dem Content mit;
 *   linke Rail wird dabei ausgeblendet (kein Platz neben 430px-TOC).
 * - Der Sticky-Bereich ENDET beim ersten BREITEN Tool (`.article-finanztool--wide`
 *   = Vergleich/Dokumente): die Rail-Höhe wird bis dorthin begrenzt. Rechner/
 *   Checkliste/FAQ sind schmal (Body-Breite) → die Rails laufen daran vorbei nach
 *   unten und rücken erst ab dem ersten breiten Tool nach oben (statt es zu überlappen).
 */
// 30px enger als die TOC-Breite (430) — identisch zum Content-Shift (ArticleElementWrapper).
const CONTENT_CLEAR = 400;
const RAIL_TOP = 18;
// Klarer Abstand, damit die Rails sichtbar VOR der breiten Box (Vergleich/Dokumente)
// enden statt sie zu berühren.
const RAIL_BOTTOM_GAP = 40;

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
        !collapsed && leftOffset < CONTENT_CLEAR
          ? CONTENT_CLEAR - leftOffset
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
      // Nur BREITE Tools (Vergleich/Dokumente, .--wide) stoppen die Rails. Rechner/
      // Checkliste/FAQ sind jetzt schmal (Body-Breite) und kollidieren nicht → die Rails
      // laufen daran vorbei nach unten und rücken erst ab dem ersten breiten Tool hoch.
      const tool = region.querySelector(".article-finanztool--wide") as HTMLElement | null;
      if (!tool) {
        setHeight(null); // kein breites Tool → Rails über den ganzen Artikel
        return;
      }
      // Direktes Region-Kind (Unit-Wrapper) des Tools finden.
      let unit: HTMLElement = tool;
      while (unit.parentElement && unit.parentElement !== region) {
        unit = unit.parentElement;
      }
      // Grenze = Unterkante des Elements VOR dem Tool (= Ende der Vergleich-
      // Beschreibung); gibt es keins, fällt sie auf die Tool-Oberkante zurück.
      const prev = unit.previousElementSibling as HTMLElement | null;
      const regionTop = region.getBoundingClientRect().top;
      const boundary = prev
        ? prev.getBoundingClientRect().bottom - regionTop
        : unit.getBoundingClientRect().top - regionTop;
      // Rails enden klar VOR der Box (Beschreibungsende minus Sicherheits-Gap).
      setHeight(Math.max(0, boundary - RAIL_TOP - RAIL_BOTTOM_GAP));
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

  // Timing IDENTISCH zu Content-Shift (ArticleElementWrapper) + Sidebar-TOC.
  const TRANSITION = "transform 0.35s cubic-bezier(0.65, 0, 0.35, 1)";
  const heightStyle = height != null ? { height, bottom: "auto" as const } : {};

  // Rechte Rail: wandert NUR mit dem Content nach rechts (kein Scale, kein Wandern).
  const rightStyle = {
    ...heightStyle,
    transform: `translateX(${shift}px)`,
    transition: TRANSITION,
  };

  return (
    <>
      {/* Linke Rail: skaliert auf 0.9, ihr Inhalt slidet nach LINKS aus einem
          overflow-hidden-Clip heraus (nichts wird gequetscht). Der Clip sitzt
          INNERHALB des sticky-Elements, damit position:sticky nicht bricht. */}
      <div className="article-side-rail article-side-rail-left" style={heightStyle}>
        <div className="article-side-rail-sticky">
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                transform: collapsed ? "translateX(0) scale(1)" : "translateX(-115%) scale(0.9)",
                transformOrigin: "left center",
                transition: TRANSITION,
              }}
            >
              <div className="article-side-rail-box" data-slot-format="rail" />
            </div>
          </div>
        </div>
      </div>
      <div ref={rightRef} className="article-side-rail article-side-rail-right" style={rightStyle}>
        <div className="article-side-rail-sticky">
          <div className="article-side-rail-box" data-slot-format="rail" />
        </div>
      </div>
    </>
  );
}
