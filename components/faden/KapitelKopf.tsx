"use client";

/**
 * Kopfzeile des lebenden Kapitels: „Kapitel n · Pfad · Uhrzeit“. Nummer und Uhrzeit
 * kennt nur der Client (Verlauf, Zeit) — deshalb erst nach dem Einhängen füllen, der
 * Server rendert nur den Pfad (kein Hydration-Mismatch).
 *
 * Seit 17.09.2026 ist die Kopfzeile zugleich der Klappgriff: Auch das aktuellste Kapitel
 * lässt sich zusammenfalten, genau wie die eingefrorenen darüber (Vorlage „Faden A v2",
 * Zeile 333–338). Der Griff ist ein eigener Knopf; die Kopfzeile darum reagiert ebenfalls
 * auf den Klick, wie bei den eingefrorenen Kapiteln.
 *
 * 🚨 EINZEILIG. Die Vorlage setzt unter den Kicker noch einen kursiven Halbsatz
 * („Zusammengefaltet · antippen zum Aufschlagen"); der stand hier kurz und ist am
 * 17.09.2026 wieder raus — er bricht die Kopfzeile auf zwei Zeilen und damit aus der
 * Linie, in der sie liegt. Was der Zustand ist, sagt der Griff selbst.
 *
 * Der Anzeigenplatz des Kapitels steht weiterhin unter dieser Kopfzeile (Vorlage kap-1:
 * die Anzeige liegt INNERHALB des Kapitels) — er wird nur nicht mehr von hier gerendert,
 * sondern von LebendesKapitel.tsx, weil er mit dem Kapitel zusammen klappen muss.
 */
import { useEffect, useState } from "react";
import { useFaden } from "./FadenProvider";

/** `still` ist die Fassung des Skeletts: gleiche Kopfzeile, aber kein Klappgriff — was
 *  noch lädt, lässt sich nicht zusammenfalten. */
export default function KapitelKopf({ pfad, still = false }: { pfad: string[]; still?: boolean }) {
  const { kapitelNr, liveZu, liveUmschalten } = useFaden();
  const [zeit, setZeit] = useState("");
  useEffect(() => {
    const d = new Date();
    setZeit(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }, []);
  return (
    <>
      <div className="kapitel__kopf kapitel__kopf--live" onClick={() => { if (liveZu && !still) liveUmschalten(); }}>
        <div className="kapitel__kopf-mitte">
          <span className="kicker">
            {zeit ? `Kapitel ${kapitelNr}` : "Kapitel"}
            {pfad.length ? " · " + pfad.join(" › ") : ""}
            {zeit ? " · " + zeit : ""}
          </span>
          {!still && (
            <button
              type="button" className="toggle-k"
              aria-expanded={!liveZu} aria-controls="kapitel-live"
              onClick={(e) => { e.stopPropagation(); liveUmschalten(); }}
            >
              {liveZu ? "aufklappen ▾" : "einklappen ▴"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
