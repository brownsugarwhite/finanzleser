/**
 * Der Kiosk: vier Ausgaben nebeneinander, wie die Titelseiten am Zeitungsstand.
 *
 * Kapitel 1 der Vorlage (Design A v2, „Aus dem Kiosk · vier Ausgaben"). Alle Maße sind
 * am laufenden Prototyp abgelesen, nicht aus der Beschreibung abgeleitet:
 *
 *   Raster    4 × 153 px, Abstand 24/36, Innenabstand 8/0/12
 *   Karte     Flex-Spalte, Innenabstand 14/0/6
 *   Kicker    700 9.5px/1.3 Open Sans, .14em gesperrt, Versalien, grau —
 *             zweite Zeile („84 Ratgeber") in Green-dark
 *   Ikon      34 × 34, dreht beim Zeigen
 *   Titel     900 clamp(20px, 1.7vw, 23px)/1.1 Merriweather, −0.015em, `hyphens: auto`
 *   Lead      italic 300 13px/1.45 Merriweather, grau, min-height 57px
 *   Inhalt    Zeilen mit Haarlinie oben, Titel gekappt, Punktführung,
 *             Zahl 600 10.5px Open Sans mit Tabellenziffern
 *   Fuß       500 13px Open Sans in Green-dark mit wachsendem Strich
 *
 * Die Rahmen-Linien beim Zeigen (Striche, die von den Funken aus wachsen) sind der
 * ListHoverBox-Effekt des Designs und stehen in app/kiosk.css.
 */
import type { SpaltenRubrik } from "@/lib/faden/spalten";

/**
 * Der kursive Einstieg je Ausgabe. Redaktioneller Text — er steht bewusst hier und nicht
 * im CMS: vier Sätze, die sich selten ändern, wären dort ein Feld, das niemand pflegt.
 */
const LEAD: Record<string, string> = {
  versicherungen: "Was Bedingungen wirklich leisten – Haftpflicht bis Berufsunfähigkeit.",
  finanzen: "Kredit, Zins und Vorsorge – gerechnet statt geraten.",
  steuern: "Die Erklärung ohne Angst: Pauschalen, Fristen, Erstattung.",
  recht: "Miete, Arbeit, Familie – was Ihnen zusteht.",
};

export default function Kiosk({ rubriken }: { rubriken: SpaltenRubrik[] }) {
  if (!rubriken.length) return null;
  const gesamt = rubriken.reduce((n, r) => n + r.zahl, 0);
  return (
    <section className="kiosk" data-erscheint="stufen" aria-label="Aus dem Kiosk">
      <div className="kiosk__kopf">
        <span className="kicker">Aus dem Kiosk · {rubriken.length === 4 ? "vier" : rubriken.length} Ausgaben · {gesamt} Ratgeber</span>
        <em>Eine Ausgabe antippen</em>
      </div>
      <div className="kiosk__raster">
        {rubriken.map((r, i) => (
          <a key={r.key} className="kiosk__karte" href={r.href}>
            {/* Der Rahmen, dessen Linien beim Zeigen von den Funken aus wachsen. */}
            <span className="kiosk__rahmen" aria-hidden="true">
              <i className="kiosk__lo" /><i className="kiosk__lu" />
              <i className="kiosk__lm1" /><i className="kiosk__lm2" />
              <img className="kiosk__funke kiosk__funke--links" src="/icons/nav-spark-green.svg" alt="" />
              <i className="kiosk__ro" /><i className="kiosk__ru" />
              <i className="kiosk__rm1" /><i className="kiosk__rm2" />
              <img className="kiosk__funke kiosk__funke--rechts" src="/icons/nav-spark-green.svg" alt="" />
            </span>

            <span className="kiosk__zeile">
              <span className="kiosk__ausgabe">
                <span>Ausgabe {i + 1}</span>
                <span className="kiosk__zahl">{r.zahl} Ratgeber</span>
              </span>
              {r.icon && <img className="kiosk__ikon" src={r.icon} alt="" />}
            </span>

            <b className="kiosk__titel" lang="de">{r.titel}</b>
            <span className="kiosk__lead">{LEAD[r.key] || ""}</span>

            <span className="kiosk__inhalt">
              {r.themen.slice(0, 3).map((t) => (
                <span key={t.key} className="kiosk__thema">
                  <span>{t.name}</span>
                  <i className="fuehrung" aria-hidden="true" />
                  <small className="ziffern">{t.zahl}</small>
                </span>
              ))}
            </span>

            <span className="kiosk__auf">Ausgabe aufschlagen<i /></span>
          </a>
        ))}
      </div>
    </section>
  );
}
