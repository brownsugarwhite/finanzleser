/**
 * Kasten „Schlange" im Kapitel „Heute" — steht direkt über dem Finanzwort des Tages.
 * Das Spiel braucht keine Inhalte aus dem CMS, deshalb ist hier nur die Hülle; alles
 * Weitere in `Schlange.tsx` (Spiel) und `lib/faden/schlange.ts` (Aussehen).
 *
 * 🚨 Die Klasse `kasten--schlange` ist der Haken, an dem `Begruessung.tsx` das Spiel
 * während Leos Tippen versteckt hält. Wer sie umbenennt, muss dort nachziehen.
 */
import Schlange from "./Schlange";

export default function SchlangeKarte() {
  return (
    <article className="kasten kasten--schlange" id="kasten-schlange">
      <Schlange />
    </article>
  );
}
