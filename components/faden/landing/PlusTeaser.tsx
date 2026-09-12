/**
 * Finanzleser Plus im Zeitungssatz. Texte 1:1 aus Design A v2 (Übergabe Zeile 223 und
 * 270), die Preis-Pille ebenso: doppelte Kontur, grüner Block mit dem Strichpaar.
 *
 * Ein gewöhnliches `<a href>` genügt — der Klick-Abfänger im FadenProvider macht daraus
 * eine Faden-Navigation, wie bei jedem internen Link.
 */
export default function PlusTeaser() {
  return (
    <section className="landing-block plus-teaser" aria-labelledby="plus-titel">
      <div className="landing-block__kopf">
        <span className="kicker kicker--gruen">Finanzleser Plus</span>
        <span className="landing-block__hinweis">Werbefrei lesen</span>
      </div>
      <span className="doppellinie" aria-hidden="true" />
      <h3 id="plus-titel" className="landing-block__schlag">Leo merkt sich Ihre Zahlen. Der Faden reißt nie ab.</h3>
      <p className="landing-block__vorspann">Aktenkoffer ohne Limit, Wächter für alle Verträge, Ausgaben als PDF – werbefrei.</p>
      <ul className="plus-teaser__punkte">
        <li><span>Aktenkoffer ohne Limit</span><i className="inhalt__linie" aria-hidden="true" /><a className="textlink" href="/plus/aktenkoffer">ansehen</a></li>
        <li><span>Wächter für alle Verträge</span><i className="inhalt__linie" aria-hidden="true" /><a className="textlink" href="/plus/waechter">ansehen</a></li>
        <li><span>Ausgaben als PDF</span><i className="inhalt__linie" aria-hidden="true" /><span className="quelle">in Vorbereitung</span></li>
      </ul>
      <a className="plus-teaser__preis" href="/plus">
        <span>4,90 € im Monat</span>
        {/* Der Doppelstrich ist die Hausmarke — derselbe Pfad wie in RechnerButton.tsx. */}
        <i aria-hidden="true">
          <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
            <path d="M1.5 1.5L11.5 1.5" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d="M1.5 9.5L11.5 9.5" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </i>
      </a>
    </section>
  );
}
