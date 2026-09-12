"use client";

/**
 * Meldung im Kapitel „Heute“ (Prototyp begruessung()): „Finanzwort des Tages #N · Serie n Tage“,
 * ein Satz, Knopf „Spielen“ auf die Spielseite. Nummer vom Server, Serie aus dem Punktekonto.
 */
import { useFaden } from "@/components/faden/FadenProvider";
import { spielUrl } from "./spielUrl";

export default function FinanzwortMeldung({ slug, nr }: { slug: string; nr: number }) {
  const { serie } = useFaden();
  return (
    <div className="meldung" id="finanzwort-heute">
      <span className="kicker kicker--gruen">Finanzwort des Tages #{nr} · Serie {serie} Tage</span>
      <p>Ein Begriff aus dem Glossar, sechs Versuche, teilbar wie Wordle.</p>
      <div className="aktionen">
        <a className="textlink textlink--still" href={spielUrl(slug)} aria-label={`Finanzwort des Tages #${nr} spielen`}>Spielen</a>
      </div>
    </div>
  );
}
