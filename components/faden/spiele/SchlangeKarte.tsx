/**
 * Die Schlange im Kapitel „Heute" — halbe Spalte, Anzeige daneben (Wunsch vom
 * 12.09.2026). Bis dahin war sie ein Kasten über die volle Breite und stand direkt über
 * dem Finanzwort; jetzt steht sie weit hinten, zwischen dem Plus-Teaser und Leos
 * Empfehlungen, im Satzraster aus Design A v2.
 *
 * 🚨 Eigene ID: `spiel-schlange` gehört `SchlangeAmEnde` im Ratgeber, und Landing und
 * Artikel können gleichzeitig im Strom stehen.
 *
 * 🚨 `Insel` ist neu und heilt einen Fehler: Ohne sie war das Spiel im eingefrorenen
 * Kapitel tot — `InselnBeleben` fand keinen Marker.
 *
 * Das Spiel selbst steht in `Schlange.tsx`, sein Aussehen in `lib/faden/schlange.ts`.
 */
import Insel from "@/components/faden/kette/Insel";
import Einschub from "@/components/faden/Einschub";
import Schlange from "./Schlange";

export default function SchlangeKarte() {
  return (
    <section className="spiel-satz spiel-satz--anzeige-rechts spiel-satz--schlange" id="spiel-schlange-heute">
      <div className="spiel-satz__koerper">
        <Insel typ="schlange"><Schlange /></Insel>
      </div>
      <aside className="spiel-satz__rand">
        <Einschub format="rectangle" variante="neben" nr={1} />
        <p className="spiel-satz__notiz">Anzeigen finanzieren die Redaktion · Plus liest werbefrei</p>
      </aside>
    </section>
  );
}
