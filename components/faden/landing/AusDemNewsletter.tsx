/**
 * „Aus unserem Newsletter" — die Auslese der Woche im Zeitungssatz: drei Ratgeber, ein
 * Vergleich, eine Checkliste, ein Rechner. Zeilen mit Punktführung wie die Themenlisten
 * der Kioskkarten in Design A v2 (Übergabe Zeile 375–379).
 *
 * 🚨 Kein `.kasten`: Der Block steht direkt auf dem Papier. `ListenKarte` wäre naheliegend,
 * bringt aber `kasten--still` mit — also Rahmen und weißen Grund.
 *
 * Die Einträge kommen fertig aus `lib/faden/landing.ts` und tragen nur, was sie zeigen.
 * Ganze Post-Objekte gehören hier nicht hinein: Props der Landing wandern über
 * `lib/faden/schnappschuss.ts` in jedes eingefrorene Kapitel im sessionStorage.
 */
import type { AusleseEintrag } from "@/lib/faden/landing";

export default function AusDemNewsletter({ eintraege }: { eintraege: AusleseEintrag[] }) {
  if (!eintraege.length) return null;
  return (
    <section className="landing-block auslese" aria-labelledby="auslese-titel">
      <div className="landing-block__kopf">
        <span className="kicker">Aus unserem Newsletter</span>
        <span className="landing-block__hinweis">Donnerstags, ein Feld, kein Formular</span>
      </div>
      <span className="doppellinie" aria-hidden="true" />
      <h3 id="auslese-titel" className="landing-block__schlag">Was diese Woche im Wochenbrief steht</h3>
      <ul className="auslese__liste">
        {eintraege.map((e) => (
          <li key={e.href}>
            <a className="auslese__eintrag" href={e.href}>
              <span className="kicker">{e.label}</span>
              <span className="auslese__titel">{e.titel}</span>
              <i className="inhalt__linie" aria-hidden="true" />
              {e.dot && <span className={`dot dot--${e.dot}`} aria-hidden="true" />}
            </a>
          </li>
        ))}
      </ul>
      <a className="pfeil-link" href="#wochenbrief-heute">Den Wochenbrief abonnieren<i /></a>
    </section>
  );
}
