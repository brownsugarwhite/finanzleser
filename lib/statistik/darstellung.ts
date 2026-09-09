/**
 * Welche Darstellung bekommt ein Statistik-Datensatz?
 *
 * Das Design zeigt mehr Formen, als das Schema Arten kennt (`torte | saeulen | balken`).
 * Zwei davon — Anteilsleiste und Linienchart — sind keine neuen Daten, sondern eine
 * andere Lesart derselben: Prozentwerte, die auf 100 aufgehen, sind ein Streifen; eine
 * Reihe mit Jahres-Beschriftungen ist eine Linie. Diese Funktion entscheidet das
 * einmal, an einer Stelle, ohne Schema-, Backend- oder Recherche-Änderung.
 *
 * 🚨 Gemessen wird an `st.reihen[0].werte`, NICHT an den `segmente` aus StatistikKarte.
 * Dort hängt bei aktivem Regler ein Pseudosegment „Ihr Wert" mit dran — das zerstörte
 * jede Prozentsumme und jede Jahresachse.
 */
import type { FadenStatistik } from "@/lib/types";

export type Darstellung = "kreis" | "saeulen" | "balken" | "anteile" | "linie";

/** Jahreszahl oder Zeitraum: „2026", „2025/26". */
const JAHR = /^(19|20)\d{2}(\/\d{2})?$/;
/** Einheiten, in denen eine Summe von 100 tatsächlich „alles" bedeutet. */
const PROZENT = /^(%|prozent)$/i;

/**
 * Notausgang ohne Schemaänderung: Schlüssel ist `<abschnitt>|<titel>`.
 * Steht hier nichts, entscheiden allein die Regeln unten.
 */
const AUSNAHMEN: Record<string, Darstellung> = {};

export function darstellungFuer(st: FadenStatistik): Darstellung {
  const ausnahme = AUSNAHMEN[`${st.abschnitt}|${st.titel}`];
  if (ausnahme) return ausnahme;

  // 🚨 Immer aus Reihe 0. Bei mehreren Reihen (Umschalter) muss die Form stehen
  // bleiben — sonst spränge der Diagrammtyp beim Umschalten.
  const werte = st.reihen[0]?.werte || [];
  if (!werte.length) return st.art === "torte" ? "kreis" : st.art;

  if (st.art === "torte") {
    const summe = werte.reduce((s, w) => s + (Number(w.wert) || 0), 0);
    const vollstaendig = PROZENT.test((st.einheit || "").trim()) && Math.abs(summe - 100) <= 1.5;
    // Als Streifen nur, wenn er wirklich ein Ganzes teilt und die Stücke lesbar bleiben.
    return vollstaendig && werte.length >= 3 && werte.length <= 6 ? "anteile" : "kreis";
  }

  if (st.art === "saeulen") {
    const jahre = werte.every((w) => JAHR.test(String(w.label).trim()));
    const aufsteigend = werte.every((w, i) => i === 0 || parseInt(String(w.label), 10) >= parseInt(String(werte[i - 1].label), 10));
    // Eine Linie braucht eine Achse, auf der die Abstände etwas bedeuten — und genug
    // Punkte, damit ein Verlauf überhaupt sichtbar wird.
    return jahre && aufsteigend && werte.length >= 4 ? "linie" : "saeulen";
  }

  return "balken";
}
