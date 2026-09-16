"use client";

/**
 * Die Messlatte — der eigene Wert neben dem Durchschnitt, als SÄULEN.
 *
 * Ersetzt `components/rechner/ui/RechnerBenchmark.tsx` (5 Rechner).
 *
 * Vorlage: Handoff Runde 2, Punkt 6 („Ergebnis: Ring und Säulen im alten Stil"):
 *
 *   pro Zeile Grid `minmax(0,1fr) 84px`; Balken 36 px hoch, VOLLFARBE (Magenta = Ihr
 *   Wert, Türkis = bestes Angebot, Tinte = Ø), Grundlinie 1 px in Balkenfarbe unter dem
 *   Balken, Label `500 13px` WEISS IM BALKEN wenn Breite > 55 %, sonst in Tinte rechts
 *   neben dem Balkenende; Wert `700 18px Merriweather` in Balkenfarbe rechtsbündig in
 *   der festen 84-px-Spalte (kein Überlappen mehr). Breite animiert 1,1 s aus 0.
 *
 * 🚨 Bis zum 16.09.2026 war das ein 8-px-Strich mit dem Namen links daneben und dem Wert
 * rechts — drei Spalten, drei Größen, und der lange Name („Bestes Angebot im Autokredit-
 * Vergleich") drückte den Balken zusammen. Der Name gehört IN den Balken; dann hat der
 * Balken die ganze Breite und die Zeile eine Höhe statt dreier.
 */
import { fmtDe } from "@/lib/kursblatt/zahl";

export interface MesslatteZeile {
  label: string;
  wert: number;
  /** magenta = der eigene Wert · tuerkis = das beste Angebot · ink = der Durchschnitt. */
  ton?: "magenta" | "tuerkis" | "ink";
}

export interface MesslatteProps {
  titel?: string;
  wert: number;
  schnitt: number;
  einheit?: string;
  wertLabel?: string;
  schnittLabel?: string;
  /** Eine dritte Säule, wo es eine gibt (Bestwert aus dem Vergleich). */
  weitere?: MesslatteZeile[];
}

/** Ab dieser Breite steht das Label weiß IM Balken — darunter rechts daneben in Tinte. */
const IM_BALKEN = 55;

export default function Messlatte({
  titel, wert, schnitt, einheit = " €", wertLabel = "Ihr Wert", schnittLabel = "Ø Deutschland", weitere = [],
}: MesslatteProps) {
  const zeilen: MesslatteZeile[] = [
    { label: wertLabel, wert, ton: "magenta" },
    ...weitere,
    { label: schnittLabel, wert: schnitt, ton: "ink" },
  ];
  const max = Math.max(...zeilen.map((z) => z.wert), 1);

  return (
    <div className="kb-messlatte">
      {titel && <b className="kb-messlatte__titel">{titel}</b>}
      {zeilen.map((z) => {
        const anteil = Math.max(4, (z.wert / max) * 100);
        const innen = anteil > IM_BALKEN;
        return (
          <div key={z.label} className="kb-messlatte__zeile" data-ton={z.ton ?? "ink"}>
            <div className="kb-messlatte__spur">
              <i className="kb-messlatte__balken" style={{ width: `${anteil.toFixed(1)}%` }} aria-hidden="true" />
              <span className="kb-messlatte__name" data-innen={innen ? "an" : "aus"} style={innen ? undefined : { left: `calc(${anteil.toFixed(1)}% + 10px)` }}>
                {z.label}
              </span>
            </div>
            <b className="kb-messlatte__wert">{fmtDe(z.wert)}{einheit}</b>
          </div>
        );
      })}
    </div>
  );
}
