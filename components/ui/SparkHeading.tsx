"use client";

import { useRef, useLayoutEffect, useState } from "react";

function SmallSpark() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
    </svg>
  );
}

function LargeSpark() {
  return (
    <svg width="21" height="21" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
    </svg>
  );
}

interface SparkHeadingProps {
  title: string;
  as?: "h1" | "h2" | "h3";
  /** Beibehalten für API-Kompatibilität — das Heading ist jetzt statisch (kein Scroll-Fade mehr). */
  fadeSectionId?: string;
}

// Minimale sichtbare Linienlänge je Seite. 0 = die Linien dürfen ganz kollabieren,
// sodass die äußeren Sparks exakt bis zur (10px-)Padding-Kante laufen, BEVOR die
// Schrift zu skalieren beginnt — genau wie gefordert.
const MIN_LINE = 0;
// Absolute Untergrenze der Schriftgröße (Lesbarkeit).
const MIN_FONT = 20;

// Feste Spark-Gruppen-Geometrie (px, skaliert NICHT mit der Schriftgröße) — muss zur
// JSX unten passen. Voll = Small+gap+Large+Paddings; Compact = nur Small+Paddings.
const SPARK_SMALL = 14;
const SPARK_LARGE = 21;
const SPARK_GAP = 6;
const SPARK_PAD_OUTER = 10; // paddingLeft der linken / paddingRight der rechten Gruppe
const SPARK_PAD_INNER = 4;  // padding Richtung Titel
const GROUP_FULL = SPARK_PAD_OUTER + SPARK_SMALL + SPARK_GAP + SPARK_LARGE + SPARK_PAD_INNER;
const GROUP_COMPACT = SPARK_PAD_OUTER + SPARK_SMALL + SPARK_PAD_INNER;
const CHROME_FULL = 2 * GROUP_FULL;
const CHROME_COMPACT = 2 * GROUP_COMPACT;

/**
 * Heading mit Spark-/Linien-Deko. Scrollt normal mit dem Content. Die Schriftgröße
 * skaliert dynamisch mit der verfügbaren Breite: sobald die äußeren Sparks die
 * Padding-Kante (16px Bildschirmrand auf Mobile) erreichen würden, wird die Schrift
 * verkleinert, damit Titel + Sparks immer passen und der Abstand Titel↔Sparks (feste
 * px-Paddings) konstant bleibt.
 */
export default function SparkHeading({ title, as = "h2" }: SparkHeadingProps) {
  const Tag = as;
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  // compact = nur der kleine Spark je Seite (der große wird ausgeblendet), sobald der
  // Titel skaliert werden müsste → spart Chrome-Breite, der Text darf größer bleiben.
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const titleEl = titleRef.current;
    if (!stage || !titleEl) return;

    const measure = () => {
      // Design-Max je Breakpoint.
      const base = window.matchMedia("(max-width: 767px)").matches ? 40 : 48;

      // Titelbreite bei BASE-Größe via Offscreen-Span messen (skaliert linear mit Font).
      const probe = document.createElement("span");
      const cs = getComputedStyle(titleEl);
      probe.style.cssText =
        `position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;top:0;` +
        `font-family:${cs.fontFamily};font-weight:${cs.fontWeight};` +
        `font-style:${cs.fontStyle};letter-spacing:${cs.letterSpacing};` +
        `text-transform:${cs.textTransform};font-size:${base}px;`;
      probe.textContent = title;
      document.body.appendChild(probe);
      const titleAtBase = probe.offsetWidth;
      document.body.removeChild(probe);

      const avail = stage.clientWidth; // Stage = outer minus Padding (10px je Seite auf Mobile)

      // 1. Passt der Titel bei BASE mit BEIDEN Sparks? → volle Deko, keine Skalierung.
      const budgetFull = avail - 2 * MIN_LINE - CHROME_FULL;
      if (titleAtBase <= 0 || titleAtBase <= budgetFull) {
        setCompact(false);
        setFontSize(base);
        return;
      }

      // 2. Skalierung nötig → nur kleiner Spark (mehr Platz) und Font passend berechnen.
      const budgetCompact = avail - 2 * MIN_LINE - CHROME_COMPACT;
      let next = (base * budgetCompact) / titleAtBase;
      next = Math.max(MIN_FONT, Math.min(base, next));
      setCompact(true);
      setFontSize(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage); // Stage (nicht Container) → keine Mess-Endlosschleife
    window.addEventListener("resize", measure);
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [title]);

  return (
    <div className="spark-heading-outer">
      <div ref={stageRef} className="spark-heading-stage">
        <div
          ref={containerRef}
          className="scalable-landing spark-heading-container"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 0,
            boxSizing: "border-box",
            // JS überschreibt den CSS-clamp()-Fallback exakt pro Titel; vor der ersten
            // Messung greift der CSS-Wert (kein Layout-Shift-Flicker, clamp passt grob).
            ...(fontSize != null ? { fontSize } : null),
          }}
        >
          <div style={{ flex: 1, minWidth: MIN_LINE, height: 1, background: "var(--color-text-primary)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 10, paddingRight: 4 }}>
            <SmallSpark />
            {!compact && <LargeSpark />}
          </div>
          <Tag
            ref={titleRef}
            className="category-title"
            style={{
              fontFamily: "var(--font-heading, 'Merriweather', serif)",
              fontWeight: 700,
              fontStyle: "italic",
              // 1em statt expliziter Pixel — der Tag erbt damit 1:1 die Container-fontSize.
              fontSize: "1em",
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              margin: 0,
              padding: 0,
            }}
          >
            {title}
          </Tag>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4, paddingRight: 10 }}>
            {!compact && <LargeSpark />}
            <SmallSpark />
          </div>
          <div style={{ flex: 1, minWidth: MIN_LINE, height: 1, background: "var(--color-text-primary)" }} />
        </div>
      </div>
    </div>
  );
}
