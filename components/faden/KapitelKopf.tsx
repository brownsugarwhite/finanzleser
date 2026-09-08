"use client";

/**
 * Kopfzeile des lebenden Kapitels: „Kapitel n · Pfad · Uhrzeit“. Nummer und Uhrzeit
 * kennt nur der Client (Verlauf, Zeit) — deshalb erst nach dem Einhängen füllen, der
 * Server rendert nur den Pfad (kein Hydration-Mismatch).
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
    <div className="kapitel__kopf kapitel__kopf--live">
      <span className="kicker">
        {zeit ? `Kapitel ${kapitelNr}` : "Kapitel"}
        {pfad.length ? " · " + pfad.join(" › ") : ""}
        {zeit ? " · " + zeit : ""}
      </span>
    </div>
  );
}
