"use client";

/**
 * Kopfzeile des lebenden Kapitels: „Kapitel n · Pfad · Uhrzeit“. Nummer und Uhrzeit
 * kennt nur der Client (Verlauf, Zeit) — deshalb erst nach dem Einhängen füllen, der
 * Server rendert nur den Pfad (kein Hydration-Mismatch).
 *
 * Der Anzeigenplatz des Kapitels hängt hier mit dran und nicht im Strom davor: In der
 * Vorlage steht die Anzeige INNERHALB des Kapitels, unter seiner Kopfzeile (kap-1 der
 * Übergabe). Vorher stand der Kopf unter dem Banner, das Kapitel begann also mit fremder
 * Werbung. So gehört das erste, was der Leser im Faden liest, wieder ihm.
 */
import { useEffect, useState } from "react";
import { useFaden } from "./FadenProvider";
import Einschub from "./Einschub";

export default function KapitelKopf({ pfad }: { pfad: string[] }) {
  const { kapitelNr, verlauf } = useFaden();
  const [zeit, setZeit] = useState("");
  useEffect(() => {
    const d = new Date();
    setZeit(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }, []);
  return (
    <>
      <div className="kapitel__kopf kapitel__kopf--live">
        <div className="kapitel__kopf-mitte">
          <span className="kicker">
            {zeit ? `Kapitel ${kapitelNr}` : "Kapitel"}
            {pfad.length ? " · " + pfad.join(" › ") : ""}
            {zeit ? " · " + zeit : ""}
          </span>
        </div>
      </div>
      <Einschub format="leaderboard" variante={verlauf.length ? "feed" : "top"} nr={verlauf.length} />
    </>
  );
}
