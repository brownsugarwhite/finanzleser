"use client";

/**
 * Halbkreis-Tacho (Port aus dem Prototyp, 05-js-neu.html `tacho()`): Bogen füllt sich,
 * die Zahl zählt hoch — 1,1 s mit Ease-out (kubisch), Start nach `verzug` ms. Farbe nach
 * Anteil: unter 40 % Pink, unter 70 % Hellgrün, sonst Grün. Bei reduzierter Bewegung
 * steht der Endwert sofort. Wiederverwendbar (Score, Quote, Grad der Deckung …).
 */
import { useEffect, useRef } from "react";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

const R = 70;
const U = Math.PI * R;
const BOGEN = "M20 90 A70 70 0 0 1 160 90";

export default function Tacho({ wert, max = 100, label, einheit = "", farbe, verzug = 200 }: {
  wert: number;
  max?: number;
  /** Kleine Zeile unter der Zahl, z. B. „von 100“. */
  label: string;
  einheit?: string;
  farbe?: string;
  /** Verzögerung in ms, bis Bogen und Zahl loslaufen. */
  verzug?: number;
}) {
  const anteil = Math.max(0, Math.min(1, max > 0 ? wert / max : 0));
  const strich = farbe || (anteil < 0.4 ? "var(--pink)" : anteil < 0.7 ? "#9CCB86" : "var(--green)");
  const zahl = useRef<HTMLElement>(null);
  const bogen = useRef<SVGPathElement>(null);

  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const dauer = reduzierteBewegung() ? 1 : 1100;
    const lauf = (now: number) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / dauer);
      const e = 1 - Math.pow(1 - t, 3);
      if (zahl.current) zahl.current.textContent = Math.round(wert * e) + einheit;
      if (bogen.current) bogen.current.style.strokeDashoffset = String(U * (1 - anteil * e));
      if (t < 1) raf = requestAnimationFrame(lauf);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(lauf); }, verzug);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [wert, anteil, einheit, verzug]);

  return (
    <div className="tacho">
      <svg viewBox="0 0 180 100" role="img" aria-label={`${wert}${einheit} ${label}`}>
        <path d={BOGEN} fill="none" stroke="var(--rule)" strokeWidth={12} strokeLinecap="round" />
        <path ref={bogen} className="tacho__bogen" d={BOGEN} fill="none" stroke={strich} strokeWidth={12} strokeLinecap="round" strokeDasharray={U} strokeDashoffset={U} />
      </svg>
      <div className="tacho__wert"><b ref={zahl}>0</b><small>{label}</small></div>
    </div>
  );
}
