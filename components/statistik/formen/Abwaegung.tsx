"use client";

/**
 * Abwägung — Design A v2, Handoff Zeile 904–914, Logik 2037.
 *
 * Zwei Spalten mit senkrechter Trennlinie: Dafür in Grün mit „+“, Dagegen in Magenta mit „–“.
 * Keine Kästen, keine Häkchen-Grafik — nur Satzzeichen und Haarlinien.
 */
import type { StatAbwaegung } from "@/lib/statistik/schema";

export default function Abwaegung({ st }: { st: StatAbwaegung }) {
  return (
    <div className="st-abwaegung">
      <div className="st-abwaegung__spalte st-abwaegung__spalte--pro">
        <b>Dafür</b>
        {st.pro.map((p) => <span key={p}><b>+</b><span>{p}</span></span>)}
      </div>
      <div className="st-abwaegung__spalte st-abwaegung__spalte--contra">
        <b>Dagegen</b>
        {st.contra.map((c) => <span key={c}><b>–</b><span>{c}</span></span>)}
      </div>
    </div>
  );
}
