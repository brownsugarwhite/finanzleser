/**
 * Finanzleser Plus — plakativ, mit Grafik (Wunsch vom 13.09.2026). Texte 1:1 aus
 * Design A v2 (Übergabe Zeile 223 und 270).
 *
 * 🚨 Der Knopf sagt „Kostenlos anmelden", nicht „4,90 € im Monat". Der Preis steht als
 * Fußzeile darunter — Stufe 1 hat noch keine Anmeldung, und ein Preis auf dem Knopf
 * verspräche einen Kauf, den es nicht gibt. Die Entscheidung stammt vom User.
 */
import Button from "@/components/ui/Button";

const PUNKTE = [
  { titel: "Aktenkoffer ohne Limit", text: "Rechnungen, Ratgeber und Ergebnisse an einer Stelle.", href: "/plus/aktenkoffer" },
  { titel: "Wächter für alle Verträge", text: "Eine Meldung, wenn sich etwas ändert, das Sie betrifft.", href: "/plus/waechter" },
  { titel: "Ausgaben als PDF", text: "Ihr Faden zum Ausdrucken — werbefrei.", href: null },
];

export default function PlusTeaser() {
  return (
    <section className="landing-block plus-teaser" aria-labelledby="plus-titel">
      <div className="landing-block__kopf">
        <span className="kicker kicker--gruen">Finanzleser Plus</span>
        <span className="landing-block__hinweis">Werbefrei lesen</span>
      </div>
      <div className="plus-teaser__satz">
        <div className="plus-teaser__text">
          <h3 id="plus-titel" className="plus-teaser__schlag">Leo merkt sich Ihre Zahlen.<br />Der Faden reißt nie ab.</h3>
          <p className="landing-block__vorspann">Aktenkoffer ohne Limit, Wächter für alle Verträge, Ausgaben als PDF – werbefrei.</p>
          <Button label="Kostenlos anmelden" href="/plus" />
          <p className="quelle plus-teaser__preis">Später 4,90 € im Monat · jederzeit kündbar</p>
        </div>
        <img className="plus-teaser__bild" src="/assets/toolbox.png" width={1220} height={864} alt="" loading="lazy" decoding="async" />
      </div>
      <ul className="plus-teaser__punkte">
        {PUNKTE.map((p) => (
          <li key={p.titel}>
            <b>{p.titel}</b>
            <span>{p.text}</span>
            {p.href ? <a className="textlink" href={p.href}>ansehen</a> : <span className="quelle">in Vorbereitung</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
