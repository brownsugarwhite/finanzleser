"use client";

/**
 * Finanzleser Plus als ABO-COUPON — Baustein 5 der Übergabe „Finanzleser Heute“.
 *
 * Der Block steht in einer gestrichelten Schnittlinie, und auf der oberen Linie sitzt
 * eine Schere. Fährt man über den Coupon, wandert sie einmal quer hindurch und schneidet
 * dabei — genau das, was man mit einem Coupon tut.
 *
 * Rechts oben klebt die Plakette: „KOSTENLOS“ auf Holo-Folie, rund, mit gestricheltem
 * Ring — dieselbe Folie wie das Bestwert-Siegel im Kursblatt, nur in anderer Form
 * (components/kursblatt/teile/Siegel.tsx, `form="kreis"`). Der Preis steht als Fußzeile
 * darunter, nicht auf der Plakette: Stufe 1 hat keine Anmeldung, und eine Zahl auf dem
 * Abzeichen verspräche einen Kauf, den es nicht gibt.
 *
 * 🚨 Die drei Leistungen tragen CSS-Glyphen, keine Bilder: der Aktenkoffer fächert auf,
 * der Wächter schlägt Ringe, die PDF-Seite füllt ihre Zeilen. Sie sind 40 × 30 groß und
 * bestehen aus je drei bis fünf Kästchen — ein Icon-Satz dafür wäre schwerer und könnte
 * nicht auf Hover reagieren.
 */
import Button from "@/components/ui/Button";
import Siegel from "@/components/kursblatt/teile/Siegel";

const PUNKTE = [
  { key: "koffer", titel: "Aktenkoffer ohne Limit", text: "Rechnungen, Ratgeber und Ergebnisse an einer Stelle — Leo findet sie wieder.", href: "/plus/aktenkoffer" },
  { key: "waechter", titel: "Wächter für alle Verträge", text: "Eine Meldung, wenn sich etwas ändert, das Sie betrifft. Nicht mehr.", href: "/plus/waechter" },
  { key: "pdf", titel: "Ausgaben als PDF", text: "Ihr Faden zum Ausdrucken — werbefrei, mit Quellen und Seite.", href: null },
];

/** Die Schere auf der Schnittlinie — 90° gegen den Uhrzeigersinn gedreht (Wunsch 17.09.). */
function Schere() {
  return (
    <span className="plus-coupon__schere" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <g className="plus-coupon__klingen" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle className="plus-coupon__oese plus-coupon__oese--a" cx="6" cy="6" r="3" />
          <circle className="plus-coupon__oese plus-coupon__oese--b" cx="6" cy="18" r="3" />
          <line className="plus-coupon__klinge plus-coupon__klinge--a" x1="8.1" y1="8.1" x2="20" y2="20" />
          <line className="plus-coupon__klinge plus-coupon__klinge--b" x1="8.1" y1="15.9" x2="20" y2="4" />
        </g>
      </svg>
    </span>
  );
}

export default function PlusTeaser() {
  return (
    <section className="landing-block plus-teaser plus-coupon" aria-labelledby="plus-titel">
      <Schere />
      <div className="landing-block__kopf">
        <span className="kicker kicker--gruen">Finanzleser Plus</span>
        <span className="landing-block__hinweis">Werbefrei lesen</span>
      </div>

      <div className="plus-coupon__satz">
        <div className="plus-coupon__text">
          <h3 id="plus-titel" className="plus-teaser__schlag">Leo merkt sich Ihre Zahlen.<br />Der Faden reißt nie ab.</h3>
          <p className="landing-block__vorspann">Drei Dinge, die nur Plus kann — und keine Anzeige zwischen den Kapiteln.</p>
        </div>
        <span className="plus-coupon__plakette">
          <Siegel text="Kostenlos" form="kreis" gross={144} />
          <em>30 Tage</em>
        </span>
      </div>

      <ul className="plus-coupon__punkte">
        {PUNKTE.map((p) => (
          <li key={p.key} className={p.href ? undefined : "ist-spaeter"}>
            <span className={`plus-glyph plus-glyph--${p.key}`} aria-hidden="true">
              {p.key === "koffer" && <><i /><i /><i /></>}
              {p.key === "waechter" && <><i /><i /><i /></>}
              {p.key === "pdf" && <><i /><i /><i /><i /></>}
            </span>
            <span className="plus-coupon__zeile">
              <b>{p.titel}</b>
              <small>{p.text}</small>
            </span>
            {p.href
              ? <a className="strich-link" href={p.href}>ansehen<i /></a>
              : <span className="quelle">in Vorbereitung</span>}
          </li>
        ))}
      </ul>

      <div className="plus-coupon__fuss">
        <Button label="Kostenlos anmelden" href="/plus" />
        <p className="quelle">Jederzeit kündbar · Ihr Faden bleibt, auch ohne Plus. Später 4,90 € im Monat.</p>
      </div>
    </section>
  );
}
