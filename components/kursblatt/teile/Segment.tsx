"use client";

/**
 * Segment-Umschalter — „Verwendung: Neuwagen · Gebrauchtwagen · Umschuldung“.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:78-82 und :408/:513.
 * Ein gleitender Tinte-Block fährt hinter das aktive Segment.
 *
 * 🚨 Der Block braucht gemessene Breiten. Die Spalten sind `auto` — „Gebrauchtwagen“ ist
 * doppelt so breit wie „Neuwagen“ —, gleich breite Spalten wären eine sichtbare
 * Abweichung. Vor der ersten Messung steht `data-gemessen="aus"`: der Block hat Breite 0
 * UND das aktive Segment bleibt in Tinte statt in Weiß. Sonst stünde nach dem Server-
 * Render eine Sekunde lang weiße Schrift auf hellem Papier.
 */
import { useEffect, useRef, useState } from "react";

export interface SegmentOption<T> {
  wert: T;
  label: string;
}

export default function Segment<T extends string | number>({
  optionen, wert, onWert, ariaLabel,
}: {
  optionen: SegmentOption<T>[];
  wert: T;
  onWert: (v: T) => void;
  ariaLabel: string;
}) {
  const wurzel = useRef<HTMLDivElement>(null);
  const [breiten, setBreiten] = useState<number[] | null>(null);

  useEffect(() => {
    const el = wurzel.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const messen = () => {
      const knoepfe = [...el.querySelectorAll<HTMLButtonElement>(".kb-segment__knopf")];
      const neu = knoepfe.map((k) => k.offsetWidth);
      setBreiten((alt) => (alt && alt.join() === neu.join() ? alt : neu));
    };
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, [optionen.length]);

  const i = Math.max(0, optionen.findIndex((o) => o.wert === wert));
  const links = breiten ? breiten.slice(0, i).reduce((a, b) => a + b, 0) : 0;
  const breite = breiten ? breiten[i] ?? 0 : 0;

  return (
    <div
      ref={wurzel}
      className="kb-segment"
      role="radiogroup"
      aria-label={ariaLabel}
      data-gemessen={breiten ? "an" : "aus"}
      style={{ "--kb-seg-links": `${links}px`, "--kb-seg-breite": `${breite}px`, "--kb-seg-spalten": optionen.length } as React.CSSProperties}
    >
      <i className="kb-segment__block" aria-hidden="true" />
      {optionen.map((o) => (
        <button
          key={String(o.wert)}
          type="button"
          role="radio"
          aria-checked={o.wert === wert}
          className="kb-segment__knopf"
          data-aktiv={o.wert === wert ? "an" : "aus"}
          onClick={() => onWert(o.wert)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
