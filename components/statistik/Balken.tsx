"use client";

import type { Segment } from "./StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";

/** Balkendiagramm (lange Beschriftungen, bis 8 Werte): Breite relativ zum größten Wert. */
export default function Balken({ segmente, einheit, onHover, onToggle }: { segmente: Segment[]; einheit?: string; onHover: (l: string | null) => void; onToggle: (l: string) => void }) {
  const max = Math.max(...segmente.filter((s) => !s.aus).map((s) => s.wert), 0) || 1;
  const hatHervor = segmente.some((s) => s.hervor);
  return (
    <div className="balken" role="img" aria-label={segmente.map((s) => `${s.label}: ${formatWert(s.wert, einheit)}`).join(", ")}>
      {segmente.map((s) => {
        const b = s.aus ? 0 : Math.max(0, Math.min(100, (s.wert / max) * 100));
        return (
          <button key={s.label} type="button" className={"balken__zeile" + (s.aus ? " aus" : "") + (s.ihr ? " balken__zeile--ihr" : "") + (s.hervor ? " hervor" : "") + (hatHervor && !s.hervor ? " gedimmt" : "")} aria-pressed={!s.aus} onMouseEnter={() => onHover(s.ihr ? "__ihr" : s.label)} onMouseLeave={() => onHover(null)} onClick={() => { if (!s.ihr) onToggle(s.label); }}>
            <span className="balken__label">{s.label}</span>
            <span className="balken__stab"><i style={{ width: `${b}%`, background: s.farbe }} data-stueck="" /></span>
            <b className="balken__wert" data-zahl={s.wert} data-einheit={einheit || ""}>{formatWert(s.wert, einheit)}</b>
          </button>
        );
      })}
    </div>
  );
}
