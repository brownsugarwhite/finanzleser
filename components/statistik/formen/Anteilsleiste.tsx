"use client";

/**
 * Anteilsleiste — Design A v2, Handoff Zeile 624–631, Logik 1895–1896.
 *
 * Ein gestapelter Balken über die volle Breite; die Beschriftungen hängen an abwechselnd
 * kurzen und langen Fallstrichen darunter, damit sie sich nicht überlagern. Überfahren
 * dimmt die übrigen Segmente.
 */
import { useState } from "react";
import type { StatAnteilsleiste } from "@/lib/statistik/schema";
import { PALETTE } from "@/lib/statistik/schema";
import { formatWert } from "@/lib/statistik/formeln";

export default function Anteilsleiste({ st }: { st: StatAnteilsleiste }) {
  const [aktiv, setAktiv] = useState(-1);
  const einheit = st.einheit ?? "%";

  let lauf = 0;
  const stuecke = st.stuecke.map((s, i) => {
    const mitte = lauf + s.wert / 2;
    lauf += s.wert;
    // Ab 82 % kippt die Beschriftung nach links, sonst liefe sie aus dem Satzspiegel.
    const rechts = mitte > 82;
    return {
      ...s,
      farbe: s.farbe || PALETTE[i % PALETTE.length],
      breite: `${s.wert}%`,
      mitte: `${mitte}%`,
      linieH: `${i % 2 ? 58 : 22}px`,
      ausr: rechts ? "flex-end" : "flex-start",
      schub: rechts ? "-100%" : "0",
      linieM: rechts ? "0 0 0 auto" : "0",
      op: aktiv === -1 || aktiv === i ? 1 : 0.3,
      i,
    };
  });

  return (
    <div className="st-anteile">
      {/* Die Leiste trägt keine eigene Beschriftung: Wert und Name stehen direkt darunter
          als Text und werden ohnehin vorgelesen. */}
      <div className="st-anteile__leiste" aria-hidden="true">
        {stuecke.map((s) => (
          <i key={s.label} style={{ width: s.breite, background: s.farbe, opacity: s.op }} onMouseEnter={() => setAktiv(s.i)} onMouseLeave={() => setAktiv(-1)} />
        ))}
      </div>
      {stuecke.map((s) => (
        <div key={s.label} className="st-anteile__marke" style={{ left: s.mitte, alignItems: s.ausr, transform: `translateX(${s.schub})`, opacity: s.op }}>
          <i style={{ height: s.linieH, margin: s.linieM }} />
          <span><b style={{ color: s.farbe }}>{formatWert(s.wert, einheit)}</b><span>{s.label}</span></span>
        </div>
      ))}
    </div>
  );
}
