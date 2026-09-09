/**
 * Kasten „Snake" — die Hülle um das Spiel, nach dem Muster von FinanzwortKarte.
 *
 * Anders als das Finanzwort ist Snake **kein CMS-Spiel**: es hat kein Datum, keine
 * Redaktionsfelder und keine Nummer. Es steht immer bereit. Deshalb bekommt es auch
 * keinen Eintrag in `Spiel["typ"]` (lib/types.ts) — die Aufzählung beschreibt, was
 * Redakteure anlegen können.
 */
import Snake from "./Snake";

export default function SnakeKarte() {
  return (
    <article className="kasten kasten--gruen" id="kasten-snake" data-erscheint="gleiten">
      <span className="kicker kicker--tool kicker--gruen"><i className="dot dot--checkliste" />Spiel · immer offen</span>
      <h3>Snake</h3>
      <Snake />
    </article>
  );
}
