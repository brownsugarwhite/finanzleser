"use client";

/**
 * „Häufige Fragen" am Artikelende — 1:1 nach Design A v2, Handoff 721–731.
 *
 * Zeile als Raster 28px/1fr/auto: zweistellige Nummer, Frage, Winkel. Aufgeklappt wird
 * über `grid-template-rows: 0fr → 1fr` mit einem `overflow: hidden`-Kind, genau wie im
 * Handoff — das ist die Technik, mit der sich eine unbekannte Höhe weich animieren lässt.
 *
 * 🚨 Die Antworten stehen dabei IMMER vollständig im HTML, auch zugeklappt. Daran hängen
 * die FAQPage-Daten der Seite und jeder Textauszug. Kein `hidden`, kein `display: none`,
 * kein Nachladen beim Klick.
 */
import { useState } from "react";

export default function FaqListe({ paare }: { paare: { q: string; a: string }[] }) {
  const [offen, setOffen] = useState<number | null>(null);

  return (
    <div className="faq">
      {paare.map((f, i) => {
        const auf = offen === i;
        return (
          <div key={i} className="faq__paar">
            <button
              type="button"
              className="faq__frage"
              aria-expanded={auf}
              aria-controls={`faq-antwort-${i}`}
              onClick={() => setOffen(auf ? null : i)}
            >
              <b className="faq__nr">{String(i + 1).padStart(2, "0")}</b>
              <span className="faq__text">{f.q}</span>
              <i className={"faq__winkel" + (auf ? " faq__winkel--auf" : "")} aria-hidden="true" />
            </button>
            <div className="faq__klappe" style={{ gridTemplateRows: auf ? "1fr" : "0fr" }}>
              <div>
                <div id={`faq-antwort-${i}`} className="faq__antwort prose" dangerouslySetInnerHTML={{ __html: f.a }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
