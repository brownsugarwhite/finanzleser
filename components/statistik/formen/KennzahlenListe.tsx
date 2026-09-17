"use client";

/**
 * Kennzahlen-Liste mit Punktführung — Design A v2, Handoff Zeile 927–932, Logik 2039.
 *
 * Name links, Wert rechts, dazwischen die gepunktete Führung — dasselbe Idiom wie im
 * Inhaltsverzeichnis. Werte in Tabellenziffern, damit die rechte Kante steht.
 */
import type { StatKennzahlenListe } from "@/lib/statistik/schema";

export default function KennzahlenListe({ st }: { st: StatKennzahlenListe }) {
  return (
    <div className="st-kennzahlen">
      {st.zeilen.map((z) => (
        <span key={z.name} className="st-kennzahlen__zeile">
          <span>{z.name}</span>
          <i />
          <b>{z.wert}</b>
        </span>
      ))}
    </div>
  );
}
