"use client";

import type { Segment } from "./StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";
import Legende from "./Legende";

/** Säulendiagramm (Zeitreihen, bis 8 Werte): Höhe relativ zum größten Wert, Wert über der Säule. */
export default function Saeulen({ segmente, einheit, onHover, onToggle }: { segmente: Segment[]; einheit?: string; onHover: (l: string | null) => void; onToggle: (l: string) => void }) {
  const sichtbar = segmente.filter((s) => !s.aus);
  const max = Math.max(...sichtbar.map((s) => s.wert), 0) || 1;
  const hatHervor = segmente.some((s) => s.hervor);
  return (
    <div className="saeulen">
      <div className="saeulen__reihe" role="img" aria-label={segmente.map((s) => `${s.label}: ${formatWert(s.wert, einheit)}`).join(", ")}>
        {sichtbar.map((s) => {
          const h = Math.max(0, Math.min(100, (s.wert / max) * 100));
          return (
            <div key={s.label} className={"saeule" + (s.wert === 0 ? " saeule--null" : "") + (s.ihr ? " saeule--ihr" : "") + (s.hervor ? " hervor" : "") + (hatHervor && !s.hervor ? " gedimmt" : "")} onMouseEnter={() => onHover(s.ihr ? "__ihr" : s.label)} onMouseLeave={() => onHover(null)}>
              <div className="saeule__stab">
                <b className="saeule__wert" style={{ bottom: `${h}%` }} data-zahl={s.wert} data-einheit={einheit || ""}>{formatWert(s.wert, einheit)}</b>
                <i style={{ height: `${h}%`, background: s.farbe }} data-stueck="" />
              </div>
              <span className="saeule__label">{s.label}</span>
            </div>
          );
        })}
      </div>
      {segmente.some((s) => s.aus) ? <Legende segmente={segmente} einheit={einheit} onHover={onHover} onToggle={onToggle} /> : null}
    </div>
  );
}
