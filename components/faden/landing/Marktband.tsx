"use client";

/**
 * Das Säulen-Marktband — ein Balken je Tarif, sortiert von gut nach schlecht.
 *
 * Übergabe „Finanzleser Heute“, Baustein 2: Die HÖHE zeigt nicht den Preis, sondern den
 * Vorsprung gegenüber dem schlechtesten Angebot — der Bestwert ragt heraus, das teuerste
 * Angebot bleibt ein Stummel. Dazu die gestrichelte Ø-Linie, die Grundlinie und ein
 * pulsierender Punkt über der Bestwertsäule.
 *
 * 🚨 Alle Höhen sind Prozente des Bandes, keine Pixel. Das Band steht im Teaser auf
 * 48 px und im Kursblatt auf 130 px (Baustein 2b) — dieselbe Rechnung, zwei Größen.
 * Die Zahlen kommen fertig aus `lib/faden/vergleichTeaser.ts`; hier wird nichts gerechnet.
 *
 * Die Säulen wachsen gestaffelt von links auf, sobald das Band im Bild steht — EIN
 * Beobachter je Band, nicht je Säule. Ohne ihn wäre die Bewegung vorbei, bevor jemand
 * hinsieht: die Teaser stehen weit unter der Faltung.
 */
import { useEffect, useState } from "react";
import type { TeaserSaeule } from "@/lib/faden/vergleichTeaser";

export default function Marktband({
  saeulen, schnitt, schnittText, bestFuss, randFuss,
}: {
  saeulen: TeaserSaeule[];
  schnitt: number;
  schnittText: string;
  bestFuss: string;
  randFuss: string;
}) {
  // 🚨 Der Knoten im STATE, nicht im Ref: React tauscht ihn beim Wiederbeleben einer
  // Insel aus, und ein Beobachter an einem abgehängten Knoten meldet nie wieder etwas
  // (dasselbe Muster wie in Flugfenster.tsx).
  const [band, setBand] = useState<HTMLSpanElement | null>(null);
  const [sicht, setSicht] = useState(false);

  useEffect(() => {
    if (!band) return;
    if (typeof IntersectionObserver !== "function") { setSicht(true); return; }
    const beobachter = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSicht(true); beobachter.disconnect(); } }, { threshold: 0.06, rootMargin: "0px 0px -8%" });
    beobachter.observe(band);
    return () => beobachter.disconnect();
  }, [band]);

  // Über vierzehn Tarifen rücken die Säulen enger zusammen, sonst stoßen sie aneinander.
  const dicht = saeulen.length > 14;
  return (
    <span className={"marktband" + (dicht ? " marktband--dicht" : "")} data-sicht={sicht ? "an" : undefined} ref={setBand}>
      <span className="marktband__feld">
        {saeulen.map((s, i) => (
          <i
            key={i}
            className={"marktband__saeule" + (s.best ? " ist-best" : "")}
            style={{ height: `${s.hoehe}%`, animationDelay: `calc(.2s + ${i} * .04s)` }}
            title={s.wert}
          >
            {/* Der Doppelschlag sitzt über der Bestwertsäule, nicht auf ihr. */}
            {s.best && <b className="marktband__punkt" aria-hidden="true" />}
          </i>
        ))}
        {/* Die Ø-Linie liegt auf derselben Skala wie die Säulen. */}
        <span className="marktband__schnitt" style={{ bottom: `${schnitt}%` }} aria-hidden="true">
          <em>{schnittText}</em>
        </span>
      </span>
      <i className="marktband__grund" aria-hidden="true" />
      <span className="marktband__fuss">
        <span className="marktband__best">{bestFuss}</span>
        <span>{randFuss}</span>
      </span>
    </span>
  );
}
