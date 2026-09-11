/**
 * Schaukasten: die dreizehn Statistik-Formen aus Design A v2, mit den Zahlen des Handoffs.
 *
 * Zweck ist die A/B-Abnahme. Das Original lässt sich daneben rendern — die `.dc.html` ist
 * Quellcode:
 *
 *   cd docs/design_handoff_finanzleser_faden && python3 -m http.server 8899
 *   → http://localhost:8899/Finanzleser%20Faden%20A%20v2%20-%20Zeitung.dc.html
 *
 * 🚨 Alle Zahlen hier sind Blindtext des Handoffs (siehe lib/statistik/handoffBeispiele.ts).
 *
 * Existiert nur mit SCHAUKASTEN_AKTIV (lib/faden/flag.ts) und trägt noindex.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SCHAUKASTEN_AKTIV } from "@/lib/faden/flag";
import { HANDOFF_BEISPIELE } from "@/lib/statistik/handoffBeispiele";
import { FORM_NAME, pruefeStatistik } from "@/lib/statistik/schema";
import Statistik from "@/components/statistik/Statistik";

export const metadata: Metadata = {
  title: "Schaukasten · Statistik-Formen",
  robots: { index: false, follow: false },
};

export default function SchaukastenStatistiken() {
  if (!SCHAUKASTEN_AKTIV) notFound();

  return (
    <main className="schaukasten-formen">
      <header>
        <span className="kicker">Schaukasten · Design A v2</span>
        <h1>Die dreizehn Statistik-Formen</h1>
        <p className="schaukasten-formen__warnung">
          Alle Zahlen auf dieser Seite sind der <b>Blindtext des Design-Handoffs</b> und keine
          recherchierten Werte. Die Seite dient dem Vergleich mit dem gerenderten Original.
        </p>
      </header>

      {HANDOFF_BEISPIELE.map((st, i) => {
        const befunde = pruefeStatistik(st);
        return (
          <section key={`${st.art}-${i}`} className="schaukasten-formen__block">
            <h2>
              <span>{i + 1}</span> {FORM_NAME[st.art]} <code>{st.art}</code>
            </h2>
            <Statistik st={st} />
            {befunde.length > 0 && (
              <ul className="schaukasten-formen__befunde">
                {befunde.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
