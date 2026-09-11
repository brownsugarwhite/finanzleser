"use client";

/**
 * Kennzahlen „Auf einen Blick“ — Design A v2, Handoff Zeile 889–894, Logik 1916.
 *
 * Drei oder vier Kacheln zwischen Doppellinie oben und Haarlinie unten. Die Zahl zählt beim
 * Eintritt ins Bild in 1,3 s hoch; Einheit und Erläuterung stehen fest daneben.
 */
import type { StatKennzahlenVierer } from "@/lib/statistik/schema";
import { useZeichnen, useZaehlwerk, type Zeichenstand } from "@/lib/statistik/useZeichnen";

function Kachel({ k, stand }: { k: StatKennzahlenVierer["kacheln"][number]; stand: Zeichenstand }) {
  const wert = useZaehlwerk(k.zahl, stand);
  const nachkomma = Number.isInteger(k.zahl) ? 0 : 1;
  return (
    <div className="st-vierer__kachel">
      <span className="kicker">{k.label}</span>
      <div className="st-vierer__zahl">
        <b style={{ color: k.farbe || "var(--ink)" }}>{wert.toLocaleString("de-DE", { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma })}</b>
        {k.einheit && <span style={{ color: k.farbe || "var(--ink)" }}>{k.einheit}</span>}
      </div>
      {k.text && <span className="st-vierer__text">{k.text}</span>}
    </div>
  );
}

export default function KennzahlenVierer({ st }: { st: StatKennzahlenVierer }) {
  const [wurzel, , stand] = useZeichnen<HTMLDivElement>();
  return (
    <div className="st-vierer" ref={wurzel} data-spalten={st.kacheln.length}>
      {st.kacheln.map((k) => <Kachel key={k.label} k={k} stand={stand} />)}
    </div>
  );
}
