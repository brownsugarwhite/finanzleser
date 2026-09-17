/**
 * Solitär im Kapitel „Heute" — halbe Spalte, Anzeige LINKS.
 *
 * Die Schlange steht ein Stück darüber mit der Anzeige rechts; die beiden wechseln sich
 * also ab, wie die Rätselecke einer Zeitung über zwei Spalten läuft. Das Brett ist
 * annähernd quadratisch und füllt die freie Spalte ohne Stauchung.
 *
 * 🚨 In einer Insel, sonst ist das Spiel im eingefrorenen Kapitel ein Foto — dieselbe
 * Falle wie bei Schlange und Finanzwort (components/faden/kette/Insel.tsx).
 */
import Insel from "@/components/faden/kette/Insel";
import Einschub from "@/components/faden/Einschub";
import Solitaer from "./Solitaer";

export default function SolitaerKarte() {
  return (
    <section className="spiel-satz spiel-satz--anzeige-links spiel-satz--solitaer" id="spiel-solitaer-heute">
      <div className="spiel-satz__koerper">
        <Insel typ="solitaer"><Solitaer /></Insel>
      </div>
      <aside className="spiel-satz__rand">
        <Einschub format="rectangle" variante="neben" nr={2} />
        <p className="spiel-satz__notiz">Ein Brett, 32 Murmeln, ein Zug weniger je Sprung — und am Ende soll eine übrig sein.</p>
      </aside>
    </section>
  );
}
