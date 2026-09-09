"use client";

/**
 * Das Skelett, das im Moment des Klicks an den Faden gehängt wird — Port von
 * `ladeDann` aus dem Prototyp (`docs/prototype/src/05-js-neu.html:246-247`).
 *
 * Der Prototyp hatte alle Inhalte inline und trotzdem ein Skelett: Er zeigt zuerst
 * einen Platzhalter und springt dorthin, dann kommt der Inhalt. Genau diese Reihenfolge
 * fehlte im Port — dort passierte bis zur RSC-Antwort gar nichts. Der Platzhalter ist
 * deshalb kein Schmuck, sondern der Anker, auf den der Sprung sofort zielen kann.
 *
 * Zeilenbreiten und Maße sind die des Prototyps (38/82/74/Bild/90/64 %), damit der
 * Platzhalter dieselbe Silhouette hat wie ein beginnender Beitrag.
 */
import { useLayoutEffect, useRef } from "react";
import { merkeKnoten, zeigeAnfang } from "@/lib/faden/scrollen";

export default function SkelettKapitel() {
  const node = useRef<HTMLElement>(null);

  // Sofort nach dem Einfügen dorthin springen (Prototyp: `anhaengen` + `zeigeAnfang`).
  // `immer`, weil der Sprung vom Leser ausgelöst ist — die Lesestelle hat `navigieren`
  // vorher gemerkt.
  useLayoutEffect(() => {
    merkeKnoten(node.current);
    zeigeAnfang(node.current, true);
  }, []);

  return (
    <section className="kapitel kapitel--skelett" ref={node} aria-busy="true">
      <div className="kapitel__inhalt">
        <div className="skelett">
          <span className="kicker">Kette wird geladen</span>
          <i style={{ width: "38%" }} />
          <i style={{ width: "82%" }} />
          <i style={{ width: "74%" }} />
          <i className="skelett__bild" />
          <i style={{ width: "90%" }} />
          <i style={{ width: "64%" }} />
        </div>
      </div>
    </section>
  );
}
