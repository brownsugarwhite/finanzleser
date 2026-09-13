/**
 * Der Teaser zum Wochenbrief auf der Startseite: Schlagzeile, Vorspann, das Feld — und
 * die Grafik daneben. Eintragen geht an Ort und Stelle; `WochenbriefForm` schickt an
 * `/api/newsletter` (CleverReach, Double-Opt-in), wie überall im Faden.
 *
 * 🚨 Eigene ID `wochenbrief-heute`. `#wochenbrief` gehört dem Kasten am Ende jeder
 * Ratgeber-Kette, und Landing und Ratgeber können gleichzeitig im Strom stehen. Der
 * Newsletter-Knopf im Kopf kennt beide Anker (components/faden/Kopf.tsx).
 */
import Insel from "@/components/faden/kette/Insel";
import WochenbriefForm from "@/components/faden/WochenbriefForm";

export default function WochenbriefTeaser() {
  return (
    <section className="landing-block wb-teaser" id="wochenbrief-heute" aria-labelledby="wb-teaser-titel">
      <div className="landing-block__kopf">
        <span className="kicker kicker--gruen">Leos Wochenbrief</span>
        <span className="landing-block__hinweis">Jederzeit abbestellbar</span>
      </div>
      <div className="wb-teaser__satz">
        <div>
          <h3 id="wb-teaser-titel" className="landing-block__schlag">Die Antworten der Woche, donnerstags</h3>
          <p className="landing-block__vorspann">Was Leser diese Woche gefragt haben, was sich an Werten geändert hat, ein Finanzwort. Kurz genug für eine Tasse Kaffee.</p>
          <Insel typ="wochenbrief"><WochenbriefForm /></Insel>
        </div>
        <img className="wb-teaser__bild bild--druck" src="/assets/newsletter-illustration.svg" width={600} height={500} alt="" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}
