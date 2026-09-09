"use client";

/**
 * Mobiles Menü (unter 900 px): der Zeitungskopf im Kleinen — Datum, Doppellinie,
 * Register mit Initialen, darunter die Wege in Verlauf, Glossar und Plus.
 *
 * 🚨 Kein zweiter Datenpfad. Die Register öffnen dasselbe Registerblatt wie auf dem
 * Desktop (`kopf/Blatt.tsx`), das unter 900 px vollflächig aufschlägt. Ein eigener
 * mobiler Baum aus Rubriken, Themen, Werkzeugen und Anbietern hieße, jede dieser Listen
 * zweimal zu holen — und das WordPress verträgt keine Auffächerung
 * (Memory `feedback_mess_disziplin_ionos.md`, höchstens drei parallele Abfragen).
 *
 * Die Klappe fällt nach vorn (`fl-kippen`), wie eine aufgeschlagene Seite.
 */
import { useFaden, type BlattZustand } from "@/components/faden/FadenProvider";

const REGISTER: { key: BlattZustand["key"]; label: string; unter: string }[] = [
  { key: "ratgeber", label: "Ratgeber", unter: "Vier Rubriken" },
  { key: "finanztools", label: "Finanztools", unter: "Rechner · Vergleiche · Checklisten" },
  { key: "service", label: "Service", unter: "Anbieter · Dokumente · Glossar" },
  { key: "plus", label: "Finanzleser Plus", unter: "Punkte, Koffer und Wächter" },
];

/** „Mittwoch, 9. September 2026" — auch die kleine Ausgabe nennt ihr Datum. */
function heute(): string {
  return new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function Menue({ offen, onZu, onRand }: { offen: boolean; onZu: () => void; onRand: (seite: "links" | "rechts") => void }) {
  const { blattOeffnen } = useFaden();
  if (!offen) return null;

  const oeffnen = (key: BlattZustand["key"]) => {
    onZu();
    window.scrollTo({ top: 0 });
    blattOeffnen(key);
  };

  return (
    <div className="menue offen" aria-label="Menü" role="dialog">
      <div className="menue__kopf">
        <img src="/icons/fl_logo.svg" alt="finanzleser" />
        <button type="button" className="menue__zu" onClick={onZu}>Schließen <i /></button>
      </div>

      <span className="kicker">{heute()} · Ausgabe 1</span>
      <i className="doppellinie" aria-hidden="true" />

      <ul className="menue__register">
        {REGISTER.map((e, i) => (
          <li key={e.key} style={{ "--i": i } as React.CSSProperties}>
            <button type="button" className="menue__zeile" onClick={() => oeffnen(e.key)}>
              <span className="menue__initial" aria-hidden="true">{e.label.charAt(0)}</span>
              <span className="menue__text"><b>{e.label}</b><em>{e.unter}</em></span>
              <span className="rubrik__pfeil" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="menue__wege">
        <button type="button" onClick={() => { onZu(); onRand("links"); }}><i className="dot dot--checkliste" />Verlauf und Inhalt</button>
        <button type="button" onClick={() => { onZu(); onRand("rechts"); }}><i className="dot dot--vergleich" />Glossar der Sitzung</button>
      </div>

      <span className="menue__fuss">Zum Schließen antippen oder Esc</span>
    </div>
  );
}
