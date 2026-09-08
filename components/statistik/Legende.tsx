"use client";

import type { Segment } from "./StatistikKarte";
import { formatWert } from "@/lib/statistik/formeln";

/** Legende: antippen blendet einen Wert aus, überfahren hebt ihn im Diagramm hervor. */
export default function Legende({ segmente, einheit, onHover, onToggle }: { segmente: Segment[]; einheit?: string; onHover: (l: string | null) => void; onToggle: (l: string) => void }) {
  return (
    <ul className="legende">
      {segmente.map((s) => (
        <li key={s.label} className={(s.aus ? "aus" : "") + (s.hervor ? " hervor" : "") + (s.ihr ? " ihr" : "")}>
          <button type="button" aria-pressed={!s.aus} onMouseEnter={() => onHover(s.ihr ? "__ihr" : s.label)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(s.ihr ? "__ihr" : s.label)} onBlur={() => onHover(null)} onClick={() => { if (!s.ihr) onToggle(s.label); }}>
            <i style={{ background: s.farbe }} /><span>{s.label}</span><b>{formatWert(s.wert, einheit)}</b>
          </button>
        </li>
      ))}
    </ul>
  );
}
