"use client";

/**
 * Die Hülle des lebenden Kapitels: Kopfzeile, Anzeigenplatz, Körper — und die Faltung,
 * die seit dem 17.09.2026 auch für das aktuellste Kapitel gilt.
 *
 * Warum hier und nicht in den drei Renderern (KetteKapitel, KartenKapitel, FadenLanding):
 * Die sind Server-Komponenten und dürfen `useFaden()` nicht anfassen. Sie reichen ihren
 * Inhalt als `children` herein; die Faltung entscheidet ausschließlich diese Datei.
 *
 * Der Anzeigenplatz klappt MIT — in der Vorlage („Faden A v2", kap-1) steht die Anzeige
 * innerhalb des Kapitels und verschwindet mit ihm. Er bekommt eine eigene Klappe, weil er
 * außerhalb von `.kapitel__inhalt` sitzt und dort auch bleiben muss: `greifen()` schneidet
 * den Schnappschuss genau an dieser Kante, und die Anzeige des eingefrorenen Kapitels
 * setzt Strom.tsx selbst.
 */
import type { ReactNode } from "react";
import { useFaden } from "./FadenProvider";
import KapitelKopf from "./KapitelKopf";
import KapitelInhalt from "./KapitelInhalt";
import Einschub from "./Einschub";

export default function LebendesKapitel({ pfad, children }: { pfad: string[]; children: ReactNode }) {
  const { liveZu, verlauf } = useFaden();
  return (
    <>
      <KapitelKopf pfad={pfad} />
      <KapitelInhalt offen={!liveZu} klasse="kapitel__anzeige">
        <Einschub format="leaderboard" variante={verlauf.length ? "feed" : "top"} nr={verlauf.length} />
      </KapitelInhalt>
      <KapitelInhalt offen={!liveZu} immer>{children}</KapitelInhalt>
    </>
  );
}
