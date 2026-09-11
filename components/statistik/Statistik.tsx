"use client";

/**
 * Verteiler für alle Statistik-Formen aus Design A v2.
 *
 * Setzt den gemeinsamen Rahmen — Kicker „«Form» · «Titel»“, kursive Beizeile, Hinweis und
 * Quellenangabe — und wählt die Form. Der Rahmen ist nicht überall gleich, weil er es im
 * Handoff auch nicht ist: die Diagramme des Setzkastens stehen ohne Linie, die Formen im
 * Fließtext haben eine Oberlinie, Leos Listen eine Unterlinie am Kicker. Siehe RAHMEN.
 *
 * Keine Kästen, keine Rundungen, keine Schatten — Design A v2, README „Linien & Flächen“:
 * „Keine Kartenboxen mit Schatten im Faden.“
 */
import type { Statistik as StatistikDaten, StatistikArt } from "@/lib/statistik/schema";
import { FORM_NAME } from "@/lib/statistik/schema";
import { useZeichnen } from "@/lib/statistik/useZeichnen";

import Kreis from "./formen/Kreis";
import Saeulen from "./formen/Saeulen";
import Spannen from "./formen/Spannen";
import Anteilsleiste from "./formen/Anteilsleiste";
import BalkenBlock from "./formen/BalkenBlock";
import Linien from "./formen/Linien";
import Zeitstrahl from "./formen/Zeitstrahl";
import Tabelle from "./formen/Tabelle";
import KennzahlenVierer from "./formen/KennzahlenVierer";
import KennzahlenListe from "./formen/KennzahlenListe";
import Schrittfolge from "./formen/Schrittfolge";
import Abwaegung from "./formen/Abwaegung";
import Begriffe from "./formen/Begriffe";
import Vergleichsrechner from "./formen/Vergleichsrechner";

/**
 * „blank“      Kicker ohne Linie, Beizeile darunter      — Kreis, Säulen, Spannen (Setzkasten)
 * „oben“       Oberlinie, Kicker und Beizeile in einer Zeile — Anteilsleiste, Linien (im Fließtext)
 * „kopfzeile“  Kicker und Beizeile in einer Zeile, Form zieht ihre eigene Doppellinie — Tabelle
 * „unterlinie“ Kicker mit Unterlinie                     — Leos Listen
 * „ohne“       Form bringt ihren Kopf selbst mit         — Kennzahlen-Vierer, Vergleichsrechner
 */
const RAHMEN: Record<StatistikArt, "blank" | "oben" | "kopfzeile" | "unterlinie" | "ohne"> = {
  kreis: "blank",
  saeulen: "blank",
  spannen: "blank",
  anteilsleiste: "oben",
  balken: "oben",
  linien: "oben",
  tabelle: "kopfzeile",
  zeitstrahl: "unterlinie",
  "kennzahlen-liste": "unterlinie",
  schrittfolge: "unterlinie",
  abwaegung: "unterlinie",
  begriffe: "unterlinie",
  "kennzahlen-vierer": "ohne",
  vergleichsrechner: "ohne",
};

function Form({ st }: { st: StatistikDaten }) {
  switch (st.art) {
    case "kreis": return <Kreis st={st} />;
    case "saeulen": return <Saeulen st={st} />;
    case "spannen": return <Spannen st={st} />;
    case "anteilsleiste": return <Anteilsleiste st={st} />;
    case "balken": return <BalkenBlock st={st} />;
    case "linien": return <Linien st={st} />;
    case "zeitstrahl": return <Zeitstrahl st={st} />;
    case "tabelle": return <Tabelle st={st} />;
    case "kennzahlen-vierer": return <KennzahlenVierer st={st} />;
    case "kennzahlen-liste": return <KennzahlenListe st={st} />;
    case "schrittfolge": return <Schrittfolge st={st} />;
    case "abwaegung": return <Abwaegung st={st} />;
    case "begriffe": return <Begriffe st={st} />;
    case "vergleichsrechner": return <Vergleichsrechner st={st} />;
  }
}

export default function Statistik({ st }: { st: StatistikDaten }) {
  const [wurzel, , stand] = useZeichnen<HTMLElement>();
  const rahmen = RAHMEN[st.art];
  const kicker = `${st.kicker || FORM_NAME[st.art]} · ${st.titel}`;
  const q = st.quelle;

  return (
    <section ref={wurzel} className={`st st--${st.art} st--rahmen-${rahmen}`} data-stand={stand} aria-label={kicker}>
      {rahmen !== "ohne" && (
        <div className="st__kopf">
          <span className="kicker">{kicker}</span>
          {st.untertitel && <p className="st__unter">{st.untertitel}</p>}
        </div>
      )}
      <Form st={st} />
      {st.hinweis && <p className="st__hinweis">{st.hinweis}</p>}
      {q?.name && (
        <p className="st__quelle">
          Quelle: {q.url ? <a href={q.url} target="_blank" rel="noopener noreferrer" data-faden-aus="">{q.name}</a> : q.name}
          {q.stand ? `, Stand ${q.stand}` : ""}
          {q.sekundaer ? " (Sekundärquelle)" : ""}
        </p>
      )}
    </section>
  );
}
