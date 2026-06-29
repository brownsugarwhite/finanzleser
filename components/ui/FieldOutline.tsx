"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";

/**
 * Animierte Feld-Outline: ein SVG-Pfad (gerundetes Rechteck) ETWAS GRÖSSER als das
 * Feld (gleichmäßiger `gap`-Abstand, exakt zentriert; Größe gemessen). Der Strich
 * wird per GSAP ein-/ausgezeichnet — IMMER im Uhrzeigersinn: beim Ein- wie beim
 * Ausblenden wandert der Startpunkt zusätzlich 25% im Uhrzeigersinn weiter.
 *
 * `radius` = Border-Radius des Feldes; Outline-Radius = radius + gap.
 * Focus-Farbe via CSS-Var `--field-focus-color` (Default brand; Rechner secondary).
 */
export default function FieldOutline({ radius = 19, gap = 4 }: { radius?: number; gap?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Aktueller Dash-Zustand (tail = Startparameter 0..∞ CW, len = Strichlänge 0..100).
  const cur = useRef({ tail: 0, len: 0 });
  const drawn = useRef(false);
  const tween = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const svg = ref.current;
    const parent = svg?.parentElement;
    if (!parent) return;
    const measure = () => {
      const r = parent.getBoundingClientRect();
      // KEIN Runden → keine 0.5px-Asymmetrie. Die SVG-Box selbst wird per CSS-Insets
      // (-gap rundum) exakt aufgespannt; w/h dienen nur der viewBox (Eckenradius).
      setBox({ w: r.width + gap * 2, h: r.height + gap * 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    // Schriften können die Feldhöhe nachträglich ändern → nachmessen.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => ro.disconnect();
  }, [gap]);

  useEffect(() => {
    const path = pathRef.current;
    const svg = ref.current;
    const parent = svg?.parentElement;
    if (!path || !parent) return;

    const apply = () => {
      // Dash + Lücke = 100 (= pathLength) → Periode trifft die geschlossene Pfadlänge
      // exakt: bei len=100 ist die Lücke 0 (durchgehende Linie, schließt IMMER),
      // dazwischen ein rotierender Bogen (Startpunkt via Offset).
      const len = cur.current.len;
      path.style.strokeDasharray = `${len} ${100 - len}`;
      path.style.strokeDashoffset = `${-cur.current.tail}`;
    };
    apply();

    const setDrawn = (next: boolean) => {
      if (next === drawn.current) return;
      drawn.current = next;
      tween.current?.kill();
      // Immer im Uhrzeigersinn:
      //  - Einzeichnen: Tail +25 (Start wandert 25% CW), Länge → 100.
      //  - Ausblenden: Tail +125 (Tail jagt den Kopf eine volle Runde CW ein + 25%
      //    Versatz), Länge → 0 → die Linie verschwindet im Uhrzeigersinn.
      tween.current = gsap.to(cur.current, {
        tail: cur.current.tail + (next ? 25 : 125),
        len: next ? 100 : 0,
        duration: 1,
        ease: "power2.out",
        onUpdate: apply,
      });
    };

    const onEnter = () => setDrawn(true);
    const onLeave = () => { if (!parent.matches(":focus-within")) setDrawn(false); };
    const onFocus = () => setDrawn(true);
    const onBlur = () => { if (!parent.matches(":hover")) setDrawn(false); };
    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mouseleave", onLeave);
    parent.addEventListener("focusin", onFocus);
    parent.addEventListener("focusout", onBlur);
    return () => {
      tween.current?.kill();
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mouseleave", onLeave);
      parent.removeEventListener("focusin", onFocus);
      parent.removeEventListener("focusout", onBlur);
    };
  }, [box]);

  const { w, h } = box;
  const r = Math.max(0, Math.min(radius + gap, w / 2, h / 2));
  // Start UNTEN-LINKS (linke Kante über der Ecke) → im Uhrzeigersinn.
  const d = w > 0 && h > 0
    ? `M 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} Z`
    : "";

  return (
    <svg
      ref={ref}
      className="field-outline"
      aria-hidden
      viewBox={w > 0 && h > 0 ? `0 0 ${w} ${h}` : undefined}
      preserveAspectRatio="none"
      // Box exakt via Insets (kein width/height-Attribut, kein Runden, kein Timing-
      // Versatz): SVG = Feld + 2×gap rundum.
      style={{ top: -gap, right: -gap, bottom: -gap, left: -gap }}
    >
      {d && <path ref={pathRef} d={d} pathLength={100} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
