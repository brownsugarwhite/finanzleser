"use client";

/**
 * Schrittfolge — Design A v2, Handoff Zeile 897–903, Logik 1917.
 *
 * Große grüne Ziffer links, darunter läuft die Verbindungslinie zum nächsten Schritt weiter;
 * beim letzten Schritt bricht sie ab. Titel und Erläuterung stehen rechts auf Haarlinie.
 */
import type { StatSchrittfolge } from "@/lib/statistik/schema";

export default function Schrittfolge({ st }: { st: StatSchrittfolge }) {
  return (
    <div className="st-schritte">
      {st.schritte.map((s, i) => (
        <div key={s.titel} className="st-schritte__schritt">
          <span className="st-schritte__nr">
            <b>{i + 1}</b>
            <i style={{ background: i < st.schritte.length - 1 ? "rgba(51,74,39,.3)" : "transparent" }} />
          </span>
          <div className="st-schritte__text">
            <b>{s.titel}</b>
            {s.text && <span>{s.text}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
