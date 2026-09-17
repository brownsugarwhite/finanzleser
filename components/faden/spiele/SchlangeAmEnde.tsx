/**
 * Die Schlange als Belohnung am Ende eines Ratgebers — halbe Spalte, Anzeige daneben.
 * Aufbau nach Handoff 1113–1115: Oberkante in doppelter Tinte, darunter das Raster.
 *
 * 🚨 Nicht `SchlangeKarte` wiederverwenden. Deren Klasse `kasten--schlange` ist der Haken,
 * an dem `components/faden/Begruessung.tsx` das Landing-Spiel während Leos Tippen verbirgt
 * und an dem `app/schlange.css` es entkastet. Beide sollen weiterhin NUR die Landing
 * treffen. Aus demselben Grund eine eigene ID: Landing und Artikel können gleichzeitig im
 * Strom stehen, `kasten-schlange` darf nicht doppelt vorkommen.
 *
 * Beide Fassungen teilen sich `localStorage["fl-schlange-beste"]` — ein gemeinsamer
 * Bestwert ist richtig so; sie gleichen sich nur nicht live ab.
 */
import Insel from "@/components/faden/kette/Insel";
import Einschub from "@/components/faden/Einschub";
import Schlange from "./Schlange";

export default function SchlangeAmEnde() {
  return (
    <section className="spiel-satz spiel-satz--anzeige-rechts spiel-satz--schlange" id="spiel-schlange">
      <div className="spiel-satz__koerper">
        <Insel typ="schlange"><Schlange /></Insel>
      </div>
      <aside className="spiel-satz__rand">
        <Einschub format="rectangle" variante="neben" nr={3} />
        <p className="spiel-satz__notiz">Geschafft. Der Klassiker vom Tastenhandy — gesetzt in Tinte auf Papier.</p>
      </aside>
    </section>
  );
}
