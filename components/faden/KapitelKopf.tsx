"use client";

/**
 * Kopfzeile eines Kapitels: zwei Haarlinien, dazwischen „Kapitel n · Pfad · Uhrzeit"
 * und ein Funke. Die Linien zeichnen sich von der Mitte nach außen, der Funke springt
 * hinterher — der Auftritt kommt aus lib/faden/erscheinen.ts über `data-erscheint="kopf"`.
 *
 * Nummer und Uhrzeit kennt nur der Client (Verlauf, Zeit), deshalb werden sie erst nach
 * dem Einhängen gefüllt — der Server rendert nur den Pfad, sonst gäbe es beim Hydrieren
 * einen Unterschied.
 */
import { useEffect, useState } from "react";
import { useFaden } from "./FadenProvider";

export default function KapitelKopf({ pfad }: { pfad: string[] }) {
  const { kapitelNr } = useFaden();
  const [zeit, setZeit] = useState("");
  useEffect(() => {
    const d = new Date();
    setZeit(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }, []);
  return (
    <div className="kapitel__kopf kapitel__kopf--live" data-erscheint="kopf">
      <i className="kapitel__linie" data-linie="" aria-hidden="true" />
      <span className="kapitel__marke">
        <span className="kicker">
          {zeit ? `Kapitel ${kapitelNr}` : "Kapitel"}
          {pfad.length ? " · " + pfad.join(" › ") : ""}
          {zeit ? " · " + zeit : ""}
        </span>
        <img className="kapitel__spark" data-spark="" src="/icons/nav-spark-green.svg" alt="" aria-hidden="true" />
      </span>
      <i className="kapitel__linie" data-linie="" aria-hidden="true" />
    </div>
  );
}
