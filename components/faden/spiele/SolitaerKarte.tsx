/**
 * Solitär im Kapitel „Heute" — über die volle Satzbreite.
 *
 * 🚨 Keine Anzeige daneben, anders als bei Schlange und Finanzwort. Die Vorlage
 * (`docs/design_handoff_finanzleser_solitaer`) bringt ihren eigenen zweispaltigen Satz mit:
 * Brett links, Kennzahlen und Schale rechts in 210 px. In einer halben Satzbreite fiele
 * dieser Satz auf eine Spalte zusammen (unter 560 px), das Brett stünde dann über seiner
 * eigenen Seitenspalte — und daneben noch eine Anzeige. Das wären drei Spalten Inhalt in
 * zwei Spalten Platz.
 *
 * Die gelbe 3-px-Einhängerlinie kommt aus `.spiel-satz--solitaer > .spiel-satz__koerper`
 * (app/spiele.css) — dieselbe Regel wie bei Schlange und Finanzwort. Sie gehört dem
 * SPIEL, nicht dem Satz, deshalb sitzt sie am Körper und nicht an der Sektion.
 *
 * 🚨 In einer Insel, sonst ist das Spiel im eingefrorenen Kapitel ein Foto — dieselbe
 * Falle wie bei Schlange und Finanzwort (components/faden/kette/Insel.tsx).
 */
import Insel from "@/components/faden/kette/Insel";
import Solitaer from "./Solitaer";

export default function SolitaerKarte() {
  return (
    <section className="spiel-satz spiel-satz--solitaer" id="spiel-solitaer-heute">
      <div className="spiel-satz__koerper">
        <Insel typ="solitaer"><Solitaer /></Insel>
      </div>
    </section>
  );
}
