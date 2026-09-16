"use client";

/**
 * Die Messlatte — der eigene Wert neben dem Durchschnitt.
 *
 * Ersetzt `components/rechner/ui/RechnerBenchmark.tsx` (5 Rechner). Zwei Balken auf
 * derselben Achse, der eigene in der Werkzeugfarbe, der Durchschnitt in Tinte — dieselbe
 * Bauart wie die Balken der Angebotsliste (K:195), damit Rechner und Vergleich dieselbe
 * Sprache sprechen.
 */
import { fmtDe } from "@/lib/kursblatt/zahl";

export interface MesslatteProps {
  titel?: string;
  wert: number;
  schnitt: number;
  einheit?: string;
  wertLabel?: string;
  schnittLabel?: string;
}

export default function Messlatte({
  titel, wert, schnitt, einheit = " €", wertLabel = "Ihr Wert", schnittLabel = "Ø Deutschland",
}: MesslatteProps) {
  const max = Math.max(wert, schnitt, 1);
  const balken = (v: number) => `${Math.max(2, (v / max) * 100).toFixed(1)}%`;

  return (
    <div className="kb-messlatte">
      {titel && <span className="kb__kicker">{titel}</span>}
      {[
        { label: wertLabel, v: wert, ist: true },
        { label: schnittLabel, v: schnitt, ist: false },
      ].map((z) => (
        <div key={z.label} className="kb-messlatte__zeile" data-ist={z.ist ? "an" : "aus"}>
          <span className="kb-messlatte__name">{z.label}</span>
          <i className="kb-messlatte__balken" style={{ width: balken(z.v) }} aria-hidden="true" />
          <b className="kb-messlatte__wert">{fmtDe(z.v)}{einheit}</b>
        </div>
      ))}
    </div>
  );
}
