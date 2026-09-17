"use client";

/**
 * Verteiler für die Spielboxen IM FADEN.
 *
 * 🚨 Nicht zu verwechseln mit `components/gamification/GamificationEmbed.tsx`. Das ist die
 * Fassung der alten Beitragsseite und bleibt unverändert — ihr Kasten-Chassis
 * (1 px Rahmen in Teal, 38/31/36 Innenabstand, fieldset-artige Legende) widerspricht der
 * Vorgabe „Keine Kartenboxen mit Schatten im Faden" so grundlegend, dass Umstylen per CSS
 * nicht reicht: der Zeitungskopf braucht ein zweites Element für den Kursivhinweis, und die
 * Antwortzeile ist das Gegenteil eines Sägezahn-Tickets. Deshalb hier eigene Körper.
 *
 * `karte` und `rubbellos` kennt dieser Verteiler nicht — beide sind gestrichen. `test` ist
 * ein Altbestand der alten Seite und erscheint im Faden ebenfalls nicht.
 */
import MythosSpiel from "./MythosSpiel";
import QuizSpiel from "./QuizSpiel";
import SchaetzSpiel from "./SchaetzSpiel";
import GewusstSpiel from "./GewusstSpiel";

export default function FadenSpiel({ typ, felder }: { typ: string; felder: Record<string, string> }) {
  switch (typ) {
    case "mythos": return <MythosSpiel felder={felder} />;
    case "quiz": return <QuizSpiel felder={felder} />;
    case "schaetzen": return <SchaetzSpiel felder={felder} />;
    case "gewusst": return <GewusstSpiel felder={felder} />;
    default: return null;
  }
}
