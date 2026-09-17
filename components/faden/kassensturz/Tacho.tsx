"use client";

/**
 * Halbkreis-Tacho (Port aus dem Prototyp, 05-js-neu.html `tacho()`): Bogen füllt sich,
 * die Zahl zählt hoch — 1,1 s mit Ease-out (kubisch), Start nach `verzug` ms. Farbe nach
 * Anteil: unter 40 % Pink, unter 70 % Hellgrün, sonst Grün. Bei reduzierter Bewegung
 * steht der Endwert sofort. Wiederverwendbar (Score, Quote, Grad der Deckung …).
 */
import { useEffect, useRef } from "react";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

const R = 90;
const U = Math.PI * R;      // Halbkreis-Umfang: 282,74
const R_INNEN = 76;
const U_INNEN = Math.PI * R_INNEN;

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
  const bogen = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const dauer = reduzierteBewegung() ? 1 : 1100;
    const lauf = (now: number) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / dauer);
      const e = 1 - Math.pow(1 - t, 3);
      if (zahl.current) zahl.current.textContent = Math.round(wert * e) + einheit;
      if (bogen.current) bogen.current.style.strokeDasharray = `${U * anteil * e} ${U * 2}`;
      if (t < 1) raf = requestAnimationFrame(lauf);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(lauf); }, verzug);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [wert, anteil, einheit, verzug]);

  return (
    <div className="tacho">
      <svg viewBox="0 0 220 120" role="img" aria-label={`${wert}${einheit} ${label}`}>
        <circle cx={110} cy={110} r={R} fill="none" stroke="rgba(51,74,39,.1)" strokeWidth={14} strokeDasharray={`${U} ${U}`} transform="rotate(180 110 110)" />
        <circle cx={110} cy={110} r={R_INNEN} fill="none" stroke="var(--ink)" strokeWidth={1} strokeDasharray={`${U_INNEN} ${U_INNEN}`} transform="rotate(180 110 110)" />
        <circle ref={bogen} className="tacho__bogen" cx={110} cy={110} r={R} fill="none" stroke={strich} strokeWidth={14} strokeDasharray={`0 ${U * 2}`} transform="rotate(180 110 110)" />
      </svg>
      <div className="tacho__wert"><b ref={zahl}>0</b><small>{label}</small></div>
    </div>
  );
}
