/**
 * Die Kopfzeile jedes Spiels im Faden — der eine Baustein, aus dem Design A v2 seine
 * Rätselseite baut. Im Handoff steht er wortgleich an vier Stellen (Zeilen 1046, 1072,
 * 1090, 1100):
 *
 *   Kicker links · Kursivzeile rechts · darunter eine Tintenlinie
 *
 * 🚨 Mehr ist da nicht. Kein Rahmen, kein Hintergrund, keine Rundung, kein Schatten —
 * README der Übergabe, „Linien & Flächen": „Keine Kartenboxen mit Schatten im Faden."
 * Die Spiele stehen direkt auf dem Papier, so wie die Statistiken.
 *
 * 🚨 Der Kicker bleibt GRAU. Die Schlange trug ihn bis zum 16.09.2026 in Grün und stand
 * damit als einziges Spiel anders da als die vier daneben — eine Kopfzeile, die sich je
 * Spiel anders färbt, ist keine Kopfzeile mehr, sondern Dekor. Die Spielfarbe (Ocker)
 * trägt die 3-px-Linie des Kastens, nicht die Schrift. `ton` bleibt für den Sonderfall.
 *
 * Gibt es einen Erklärtext, steht er DARUNTER — `erklaerung`, direkt unter der Linie und
 * vor dem Spielkörper. Nicht dazwischen und nicht darunter ans Ende.
 */
export default function SpielKopf({
  kicker, hinweis, ton, erklaerung,
}: { kicker: string; hinweis?: string; ton?: "gruen" | "pink" | "spiel"; erklaerung?: React.ReactNode }) {
  return (
    <>
      <div className="spiel-kopf">
        <span className={"kicker" + (ton ? ` kicker--${ton}` : "")}>{kicker}</span>
        {hinweis && <span className="spiel-kopf__hinweis">{hinweis}</span>}
      </div>
      {erklaerung && <p className="spiel-kopf__erklaerung">{erklaerung}</p>}
    </>
  );
}
