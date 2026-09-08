"use client";

import type { Segment } from "./StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";
import Legende from "./Legende";

const CX = 100, CY = 100, R = 86;

function bogen(a0: number, a1: number): string {
  const x0 = CX + R * Math.cos(a0), y0 = CY + R * Math.sin(a0), x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
  const gross = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${gross} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

/** Kreisdiagramm: Stücke ab 12 Uhr im Uhrzeigersinn; die Mitte zeigt das hervorgehobene (sonst größte) Stück. */
export default function Torte({ segmente, einheit, onHover, onToggle }: { segmente: Segment[]; einheit?: string; onHover: (l: string | null) => void; onToggle: (l: string) => void }) {
  const aktiv = segmente.filter((s) => !s.aus && s.wert > 0);
  const summe = aktiv.reduce((n, s) => n + s.wert, 0) || 1;
  let a = -Math.PI / 2;
  const stuecke = aktiv.map((s) => { const a0 = a; const a1 = a + 2 * Math.PI * (s.wert / summe); a = a1; return { s, d: aktiv.length === 1 ? `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R} Z` : bogen(a0, Math.min(a1, a0 + 2 * Math.PI - 0.0001)) }; });
  const mitte = segmente.find((s) => s.hervor && !s.aus) || aktiv.reduce<Segment | null>((m, s) => (m == null || s.wert > m.wert ? s : m), null);
  return (
    <div className="torte">
      <div className="torte__bild">
        <svg viewBox="0 0 200 200" role="img" aria-label={segmente.map((s) => `${s.label}: ${formatWert(s.wert, einheit)}`).join(", ")}>
          {stuecke.map(({ s, d }) => (
            <path key={s.label} d={d} className={"torte__stueck" + (s.hervor ? " hervor" : "") + (segmente.some((x) => x.hervor) && !s.hervor ? " gedimmt" : "")} fill={s.farbe} data-stueck="" onMouseEnter={() => onHover(s.label)} onMouseLeave={() => onHover(null)} onClick={() => onToggle(s.label)} />
          ))}
          <circle cx={CX} cy={CY} r={52} fill="var(--white)" />
          {mitte && (
            <>
              <text x={CX} y={CY - 2} textAnchor="middle" className="torte__wert" data-zahl={mitte.wert} data-einheit={einheit || ""}>{formatWert(mitte.wert, einheit)}</text>
              <text x={CX} y={CY + 16} textAnchor="middle" className="torte__label">{mitte.label.length > 22 ? mitte.label.slice(0, 20) + "…" : mitte.label}</text>
            </>
          )}
        </svg>
      </div>
      <Legende segmente={segmente} einheit={einheit} onHover={onHover} onToggle={onToggle} />
    </div>
  );
}
