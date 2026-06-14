"use client";

import { Fragment, useCallback, useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "@/lib/gsapConfig";
import Spark from "@/components/ui/Spark";

export interface RechnerPreset {
  label: string;
  values: Record<string, number>;
}

interface Props {
  presets: RechnerPreset[];
  onApply: (values: Record<string, number>) => void;
}

const NONE_LABEL = "keine Auswahl";
const EDGE = 18; // Abstand der Rand-Sparks zum ersten/letzten Chip einer Reihe

/**
 * Auswahl-Chips wie der Category-Slider im Button-Mode:
 * - dunkle eckige Pill (text-primary) mit ZWEI dünnen Linien darüber,
 * - weißes „Lens"-Overlay (Klon der Chips) mit Magnifier (scale 1.1) für die aktive Schrift,
 * - Bloom bei Reihenwechsel, Slide innerhalb einer Reihe,
 * - „keine Auswahl" = erster Chip, initial aktiv (Rechner behält Default).
 * Sparks liegen ABSOLUT (nicht im Flow) → genau EIN Spark zwischen Chips und je
 * ein Spark am Anfang+Ende JEDER Reihe, egal wie es umbricht.
 */
export default function RechnerPresets({ presets, onApply }: Props) {
  const chips = [{ label: NONE_LABEL }, ...presets.map((p) => ({ label: p.label }))];

  const [active, setActive] = useState(0);
  const [sparks, setSparks] = useState<{ x: number; y: number }[]>([]);
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pillRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const lastTop = useRef<number | null>(null);
  const activeRef = useRef(0);
  activeRef.current = active;

  // Sparks pro Reihe berechnen (absolut platziert → kein Reflow, kein Doppel-Spark).
  const computeSparks = useCallback(() => {
    const els = chipRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (!els.length) { setSparks([]); return; }
    const rows = new Map<number, HTMLButtonElement[]>();
    els.forEach((el) => {
      const t = Math.round(el.offsetTop);
      if (!rows.has(t)) rows.set(t, []);
      rows.get(t)!.push(el);
    });
    const pts: { x: number; y: number }[] = [];
    rows.forEach((rowEls) => {
      rowEls.sort((a, b) => a.offsetLeft - b.offsetLeft);
      const cy = rowEls[0].offsetTop + rowEls[0].offsetHeight / 2;
      pts.push({ x: rowEls[0].offsetLeft - EDGE, y: cy }); // Reihen-Anfang
      rowEls.forEach((el, i) => {
        const right = el.offsetLeft + el.offsetWidth;
        if (i < rowEls.length - 1) {
          pts.push({ x: (right + rowEls[i + 1].offsetLeft) / 2, y: cy }); // zwischen Chips
        } else {
          pts.push({ x: right + EDGE, y: cy }); // Reihen-Ende
        }
      });
    });
    setSparks(pts);
  }, []);

  const placeLines = (x: number, y: number, w: number, bloom: boolean) => {
    const l1 = line1Ref.current, l3 = line3Ref.current;
    const l1y = y - 10, l3y = y - 6;
    if (l1) {
      gsap.killTweensOf(l1);
      if (bloom) {
        gsap.set(l1, { x, y: l1y, width: w, autoAlpha: 0, scale: 0.5, transformOrigin: "center center" });
        gsap.to(l1, { autoAlpha: 1, scale: 1, duration: 0.5, delay: 0.08, ease: "back.out(2.2)" });
      } else {
        gsap.to(l1, { x, y: l1y, width: w, autoAlpha: 1, scale: 1, duration: 0.53, ease: "back.out(1.3)" });
      }
    }
    if (l3) {
      gsap.killTweensOf(l3);
      if (bloom) {
        gsap.set(l3, { x, y: l3y, width: w, autoAlpha: 0, scale: 0.5, transformOrigin: "center center" });
        gsap.to(l3, { autoAlpha: 1, scale: 1, duration: 0.5, delay: 0.04, ease: "back.out(2.2)" });
      } else {
        gsap.to(l3, { x, y: l3y, width: w, autoAlpha: 1, scale: 1, duration: 0.49, ease: "back.out(1.3)" });
      }
    }
  };

  // mode: "bloom" = Aufploppen (erstes Mal / Reihenwechsel), "slide" = gleiten
  // (innerhalb einer Reihe), "snap" = ohne Animation neu setzen (resize/settle).
  const place = (mode: "bloom" | "slide" | "snap") => {
    const pill = pillRef.current, lens = lensRef.current, row = rowRef.current;
    if (!pill || !lens || !row) return;
    const chip = chipRefs.current[activeRef.current];
    if (!chip) return;
    const x = chip.offsetLeft, y = chip.offsetTop, w = chip.offsetWidth, h = chip.offsetHeight;
    lens.style.width = `${row.clientWidth}px`;
    // Magnifier: Lens 1.1× um die aktive Chip-Mitte (wie Category-Slider / TopNav).
    const origin = `${x + w / 2}px ${y + h / 2}px`;

    gsap.killTweensOf(pill);
    gsap.killTweensOf(lens);
    if (mode === "snap") {
      gsap.set(pill, { x, y, width: w, height: h, autoAlpha: 1, scale: 1, transformOrigin: "center center" });
      gsap.set(lens, { x: -x, y: -y, scale: 1.1, transformOrigin: origin });
      gsap.set(line1Ref.current, { x, y: y - 10, width: w, autoAlpha: 1, scale: 1 });
      gsap.set(line3Ref.current, { x, y: y - 6, width: w, autoAlpha: 1, scale: 1 });
    } else if (mode === "bloom") {
      gsap.set(pill, { x, y, width: w, height: h, autoAlpha: 0, scale: 0.5, transformOrigin: "center center" });
      gsap.set(lens, { x: -x, y: -y, scale: 1.1, transformOrigin: origin });
      gsap.to(pill, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" });
      placeLines(x, y, w, true);
    } else {
      const dur = 0.45;
      gsap.to(pill, { x, y, width: w, height: h, autoAlpha: 1, scale: 1, duration: dur, ease: "back.out(1.3)" });
      gsap.to(lens, { x: -x, y: -y, scale: 1.1, transformOrigin: origin, duration: dur, ease: "back.out(1.3)" });
      placeLines(x, y, w, false);
    }
    shown.current = true;
    lastTop.current = y;
  };

  // Auswahl-Wechsel: gleiten (gleiche Reihe) oder bloomen (erstes Mal / Reihenwechsel).
  useLayoutEffect(() => {
    const chip = chipRefs.current[active];
    const crossRow = !!chip && lastTop.current !== null && lastTop.current !== chip.offsetTop;
    place(!shown.current || crossRow ? "bloom" : "slide");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Mount/Resize: Sparks + Pill-Position NUR neu setzen (kein erneutes Bloomen).
  useEffect(() => {
    computeSparks();
    const onResize = () => { computeSparks(); place("snap"); };
    window.addEventListener("resize", onResize);
    const t = setTimeout(() => { computeSparks(); place("snap"); }, 250); // Font/Layout-Settle
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (i: number) => {
    setActive(i);
    if (i > 0) onApply(presets[i - 1].values); // 0 = „keine Auswahl" → Defaults behalten
  };

  if (!presets.length) return null;

  return (
    <>
      <div className="rechner-presets-heading">Vorauswahl (optional)</div>
      <div className="rechner-presets-box">
        <div className="rechner-presets" ref={rowRef} role="group" aria-label="Voreinstellungen">
          {chips.map((c, i) => (
            <button
              key={c.label}
              type="button"
              ref={(el) => { chipRefs.current[i] = el; }}
              className="rechner-preset-chip"
              aria-pressed={active === i}
              onClick={() => select(i)}
            >
              {c.label}
            </button>
          ))}

          {/* Sparks absolut (Anfang+Ende jeder Reihe + einer zwischen Chips) */}
          {sparks.map((s, i) => (
            <span
              key={`sp-${i}`}
              className="rechner-preset-spark"
              style={{ position: "absolute", left: s.x, top: s.y, transform: "translate(-50%, -50%)" }}
              aria-hidden
            >
              <Spark />
            </span>
          ))}

          {/* Zwei dünne Linien über der Pill */}
          <div className="rechner-preset-line rechner-preset-line1" ref={line1Ref} aria-hidden />
          <div className="rechner-preset-line rechner-preset-line3" ref={line3Ref} aria-hidden />

          {/* Pill mit weißem Lens-Klon (nur Chips, gleiche Geometrie → Magnifier sitzt) */}
          <div className="rechner-preset-pill" ref={pillRef} aria-hidden>
            <div className="rechner-preset-lens" ref={lensRef}>
              {chips.map((c) => (
                <Fragment key={c.label}>
                  <span className="rechner-preset-chip rechner-preset-chip--lens">{c.label}</span>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
