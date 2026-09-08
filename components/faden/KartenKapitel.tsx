/**
 * Lebendes Kapitel für alles, was kein Ratgeber ist: Rechner, Checkliste, Vergleich,
 * Dokument, Anbieter, Textseite. Kopfzeile, Krumen, h1 (SEO wie die alte Seite:
 * kleine kursive Zeile darüber, große Zeile = Titel), Beschreibung, dann die Karte.
 */
import type { ReactNode } from "react";
import KapitelKopf from "./KapitelKopf";
import Aktionen from "./kette/Aktionen";

export interface Krume { name: string; href: string }

export default function KartenKapitel({
  schluessel, titel, titelZusatz, kicker, beschreibung, krumen, url, children,
}: {
  schluessel: string;
  titel: string;
  /** Steht mit im h1 (z. B. „Kontakt“ bei Anbietern — die Seiten ranken auf „<Firma> Kontakt“). */
  titelZusatz?: string;
  kicker?: string;
  beschreibung?: string;
  krumen: Krume[];
  url: string;
  children: ReactNode;
}) {
  const pfad = krumen.map((k) => k.name);
  const id = "karte-" + schluessel.replace(/[^a-z0-9-]/gi, "-");
  return (
    <section className="kapitel kapitel--live" id="kapitel-live" data-key={schluessel} data-titel={titel} data-pfad={pfad.join(" › ")}>
      <KapitelKopf pfad={pfad} />
      <div className="kapitel__inhalt">
        <article className="artikel artikel--karte" id={id}>
          <nav className="krumen" aria-label="Sie lesen">
            {krumen.map((x, i) => (
              <span key={x.href + i}>{i > 0 && <span className="krumen__trenner">›</span>}<a href={x.href}>{x.name}</a></span>
            ))}
          </nav>
          {kicker && <p className="artikel__titel">{kicker}</p>}
          <h1 className="artikel__untertitel">
            {titel}
            {titelZusatz && <span className="artikel__zusatz"> {titelZusatz}</span>}
          </h1>
          {beschreibung && <p className="vorspann">{beschreibung}</p>}
          {children}
          <Aktionen titel={titel} url={url} artikelId={id} />
        </article>
      </div>
    </section>
  );
}
