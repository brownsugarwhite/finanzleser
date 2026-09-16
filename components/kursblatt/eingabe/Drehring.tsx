"use client";

/**
 * Drehring — kleine Skalen mit festen Schritten: Laufzeit, Alter, Wochenstunden.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:258-271 (Markup),
 * :432-435 (Zeigen) und :496-498 (Skala). Bogen von −135° bis +135°, Radius 64 in einem
 * 180er-Feld, gerendert auf 190 px.
 *
 * 🚨 Die Beschriftungen stehen als echte `<text>` im SVG, nicht als HTML-Overlay. Der
 * Prototyp musste ausweichen (README: „SVG-`<text>` mit Platzhaltern rendert im Prototyp
 * nicht“); im Produkt ist der Umweg eine Wartungslast und für Vorlesesoftware unsichtbar.
 *
 * Kein Malen ins DOM während des Ziehens (anders als RechnerInput.tsx:139-154): der Wert
 * rastet auf ganze Schritte, es gibt also nur eine Handvoll Zustandswechsel je Drehung.
 */

import { useRef, useState } from "react";
import { bogen, polar } from "@/lib/kursblatt/formen";
import { klemme } from "@/lib/kursblatt/zahl";
import type { Werkzeug } from "./Lineal";

export interface DrehringProps {
  wert: number;
  onWert: (v: number) => void;
  min: number;
  max: number;
  schritt: number;
  /** Großer Teilstrich alle `gross × schritt` — im Kreditrechner alle 12 Monate. */
  gross?: number;
  /** Welche Werte tragen eine Zahl. */
  beschriftet?: number[];
  einheit: string;
  /** Zeile unter der Einheit, z. B. „= 5 Jahre“. */
  unter?: (v: number) => string;
  werkzeug?: Werkzeug;
  ariaLabel: string;
}

const FARBE: Record<Werkzeug, string> = {
  tuerkis: "var(--tuerkis)",
  magenta: "var(--pink)",
  gruen: "var(--green)",
  ink: "var(--ink)",
};

const MITTE = 90;
const R_BOGEN = 64;
const VON = -135;
const BIS = 135;

export default function Drehring({
  wert, onWert, min, max, schritt, gross = 2, beschriftet = [],
  einheit, unter, werkzeug = "magenta", ariaLabel,
}: DrehringProps) {
  const [zieht, setZieht] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  const spanne = max - min;
  const anteil = spanne ? (wert - min) / spanne : 0;
  const winkel = VON + (BIS - VON) * anteil;
  const [gx, gy] = polar(MITTE, MITTE, R_BOGEN, winkel);

  const setzen = (roh: number) => {
    const neu = klemme(Math.round(roh / schritt) * schritt, min, max);
    if (neu !== wert) onWert(neu);
  };
  const ausZeiger = (e: React.PointerEvent) => {
    const el = svg.current;
    if (!el) return;
    const k = el.getBoundingClientRect();
    const dx = e.clientX - (k.left + k.width / 2);
    const dy = e.clientY - (k.top + k.height / 2);
    const a = klemme((Math.atan2(dx, -dy) * 180) / Math.PI, VON, BIS);
    setzen(min + ((a - VON) / (BIS - VON)) * spanne);
  };

  const striche: { x1: number; y1: number; x2: number; y2: number; stark: boolean; erreicht: boolean }[] = [];
  for (let v = min; v <= max + 1e-9; v += schritt) {
    const a = VON + (BIS - VON) * ((v - min) / spanne);
    const stark = Math.round((v - min) / schritt) % gross === 0;
    const [x1, y1] = polar(MITTE, MITTE, 72, a);
    const [x2, y2] = polar(MITTE, MITTE, stark ? 80 : 76, a);
    striche.push({ x1, y1, x2, y2, stark, erreicht: v <= wert });
  }
  const schilder = beschriftet.map((v) => {
    const a = VON + (BIS - VON) * ((v - min) / spanne);
    const [x, y] = polar(MITTE, MITTE, 89, a);
    return { v, x, y };
  });

  return (
    <div className="kb-drehring" style={{ "--kb-feld-farbe": FARBE[werkzeug] } as React.CSSProperties}>
      <svg
        ref={svg}
        viewBox="0 0 180 180"
        width="190"
        height="190"
        className="kb-drehring__scheibe"
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={wert}
        aria-valuetext={`${wert} ${einheit}`}
        data-zieht={zieht ? "an" : "aus"}
        onPointerDown={(e) => { (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); setZieht(true); ausZeiger(e); }}
        onPointerMove={(e) => { if (zieht) ausZeiger(e); }}
        onPointerUp={() => setZieht(false)}
        onPointerCancel={() => setZieht(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setzen(wert + schritt); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setzen(wert - schritt); }
        }}
      >
        <path d={bogen(MITTE, MITTE, R_BOGEN, VON, BIS)} fill="none" stroke="var(--ink-20)" strokeWidth={1.5} />
        {striche.map((s, i) => (
          <line
            key={i}
            x1={s.x1.toFixed(1)} y1={s.y1.toFixed(1)} x2={s.x2.toFixed(1)} y2={s.y2.toFixed(1)}
            stroke={s.erreicht ? "var(--ink)" : "var(--ink-30)"}
            strokeWidth={s.stark ? 1.5 : 1}
            className="kb-drehring__strich"
          />
        ))}
        {schilder.map((s) => (
          <text key={s.v} x={s.x.toFixed(1)} y={s.y.toFixed(1)} className="kb-drehring__schild" textAnchor="middle" dominantBaseline="middle">
            {s.v}
          </text>
        ))}
        {anteil > 0.001 && (
          <path d={bogen(MITTE, MITTE, R_BOGEN, VON, winkel)} fill="none" stroke="var(--kb-feld-farbe)" strokeWidth={3} strokeLinecap="round" className="kb-drehring__bogen" />
        )}
        <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={zieht ? 12 : 9} fill="var(--auf-tinte)" stroke="var(--ink)" strokeWidth={3} className="kb-drehring__griff" />
      </svg>
      <div className="kb-drehring__mitte" aria-hidden="true">
        <b>{wert}</b>
        <span className="kb-drehring__einheit">{einheit}</span>
        {unter && <span className="kb-drehring__unter">{unter(wert)}</span>}
      </div>
    </div>
  );
}
