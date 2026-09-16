"use client";

/**
 * Fünf Fragen zum Weiterreden, am Ende der Startseite. Ein Klick stellt die Frage
 * wirklich: `fragen()` hängt sie als Kapitel an den Faden, Leo antwortet darin.
 *
 * 🚨 Nicht zu verwechseln mit den Chips unter der Eingabe (`#eingabeChips`). Die tragen
 * seit dem 12.09.2026 nur noch Sprünge — Kassensturz, Finanztools, Finanzwort —, damit
 * am Fadenende nicht zweimal dieselben Fragen übereinanderstehen.
 */
import { useFaden } from "@/components/faden/FadenProvider";

const FRAGEN = [
  "Wie viel Haftpflicht-Schutz brauche ich wirklich?",
  "Lohnt sich eine Berufsunfähigkeitsversicherung mit 35 noch?",
  "Wie viel Rente bleibt mir nach Steuern?",
  "Was kostet mich ein Kind im Monat?",
  "Wie lege ich 10.000 Euro sicher an?",
];

export default function WeiterredenChips() {
  const { fragen } = useFaden();
  return (
    <div className="landing-block weiterreden">
      <div className="landing-block__kopf">
        <span className="kicker kicker--gruen">Weiterreden mit Leo</span>
        <span className="landing-block__hinweis">Eine Frage antippen</span>
      </div>
      <div className="chips">
        {FRAGEN.map((f) => (
          <button key={f} type="button" className="chip" onClick={() => fragen(f)}>{f}</button>
        ))}
      </div>
    </div>
  );
}
