"use client";

/**
 * Die erste Zeile im Faden: „Ihr Faden · Ausgabe n" links, das Datum rechts, darunter
 * die Doppellinie (Design-Übergabe „Die Zeitung", Abschnitt „Der Faden").
 *
 * Das Datum setzt erst der Client. Die Seiten liegen bis zu 24 h im ISR-Cache
 * (CONTENT_REVALIDATE), ein serverseitig gerendertes Datum wäre also über Stunden das
 * von gestern. Darum dieselbe Bauart wie in KapitelKopf: der Server rendert die Zeile
 * ohne Datum, der Client trägt es nach dem Einhängen nach — kein Hydration-Mismatch.
 */
import { useEffect, useState } from "react";

const DATUM = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function Zeitungskopf({ ausgabe = 1 }: { ausgabe?: number }) {
  const [datum, setDatum] = useState("");
  useEffect(() => { setDatum(DATUM.format(new Date())); }, []);
  return (
    <div className="zeitungskopf">
      <div className="zeitungskopf__zeile">
        <span className="kicker">Ihr Faden · Ausgabe {ausgabe}</span>
        <span className="kicker">{datum}</span>
      </div>
      <i className="doppellinie" />
    </div>
  );
}
