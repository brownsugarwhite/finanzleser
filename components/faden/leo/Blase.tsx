/**
 * Der Wortwechsel mit Leo — zwei ungleiche Hälften:
 *
 *   FrageBlase — die Frage des Lesers bleibt eine Sprechblase: gefüllt in der dunklen
 *                Überschriftenfarbe (--ink), Text weiß, Schwanz rechts unten, „Ihre
 *                Frage“ rechts oben in der Blase. Form und Maße wie im Leo-Chat der
 *                Live-Seite (app/components.css).
 *   LeoRede    — Leo spricht OHNE Blase, so wie in der Übergabe A v2 (Zeile 343–347):
 *                sein Kopf steht links in der Gasse, Kicker und Text stehen frei auf
 *                dem Papier. Der Zeitungssatz kennt keine Kästen für Fließtext.
 *
 * 🚨 Der große Satz ist ein ZITAT-Satz, kein Lesesatz. Er trägt eine kurze, gesetzte
 * Antwort und eine kurze Frage — bei einem langen Absatz wird er zur Zumutung. Deshalb
 * bestimmt die Textlänge die Größe: `text` mitgeben, dann stuft sich die Blase bzw.
 * Leos Absatz selbst herunter. Ohne `text` bleibt es beim großen Satz (kurze Fälle).
 *
 * 🚨 Der Schwanz der Frageblase besteht aus ZWEI deckungsgleichen SVGs: der hintere
 * (mit Strich) setzt die Kontur fort, der vordere (Füllung = Blasenfarbe) deckt die
 * Konturlinie dort ab, wo der Schwanz ansetzt. Ein einzelner Schwanz ergibt entweder
 * eine durchgestrichene Blase oder einen Schwanz ohne Kontur.
 */
import type { ReactNode, Ref } from "react";
import BubbleSpike from "@/components/ui/BubbleSpike";

/** Ab so vielen Zeichen wird die Frage kleiner gesetzt — erst eine Stufe, dann zwei. */
const FRAGE_MITTEL = 62;
const FRAGE_KLEIN = 118;
/** Ab so vielen Zeichen ist Leos Antwort kein Zitat mehr, sondern Fließtext. */
const ANTWORT_FLIESS = 200;

export function FrageBlase({ children, text, blaseRef }: { children: ReactNode; text?: string; blaseRef?: Ref<HTMLDivElement> }) {
  const n = text?.length ?? 0;
  const mass = n > FRAGE_KLEIN ? " blase--klein" : n > FRAGE_MITTEL ? " blase--mittel" : "";
  return (
    <div className="blase-huelle">
      <div className={"blase blase--frage" + mass} ref={blaseRef}>
        <span className="blase__kicker">Ihre Frage</span>
        {children}
        <BubbleSpike className="blase__spike" />
      </div>
    </div>
  );
}

export function LeoRede({ children, fehler = false, text }: { children: ReactNode; fehler?: boolean; text?: string }) {
  const fliess = (text?.length ?? 0) > ANTWORT_FLIESS;
  return (
    <div className={"leo-rede" + (fehler ? " leo-rede--fehler" : "") + (fliess ? " leo-rede--fliess" : "")}>
      <img src="/assets/leo.svg" alt="Leo" className="wort__avatar" />
      {children}
    </div>
  );
}
