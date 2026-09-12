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
 */
export default function SpielKopf({ kicker, hinweis, ton }: { kicker: string; hinweis?: string; ton?: "gruen" | "pink" }) {
  return (
    <div className="spiel-kopf">
      <span className={"kicker" + (ton ? ` kicker--${ton}` : "")}>{kicker}</span>
      {hinweis && <span className="spiel-kopf__hinweis">{hinweis}</span>}
    </div>
  );
}
