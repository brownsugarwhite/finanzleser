/**
 * Die rollende Zahl — Ziffernwalzen statt eines Textwechsels.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:279 (Zinssatz) und
 * :295 („Leo rechnet mit: ≈ 387 €“). Dieselbe Walze, nur andere Schriftgröße.
 *
 * Serverkomponente: die Stellung kommt aus dem Text, nicht aus einem Effekt — der
 * richtige Wert steht schon im gelieferten HTML.
 */
import { ZEICHEN, walzen } from "@/lib/kursblatt/odometer";

export default function Odometer({ text, klasse }: { text: string; klasse?: string }) {
  const spalten = walzen(text);
  return (
    <span className={"kb-odo" + (klasse ? " " + klasse : "")} role="text" aria-label={text}>
      {spalten.map((w) => (
        <span key={w.schluessel} className="kb-odo__walze" style={{ width: w.breite }} aria-hidden="true">
          <span className="kb-odo__spalte" style={{ transform: `translateY(-${w.stelle}em)` }}>
            {[...ZEICHEN].map((c) => (
              <span key={c} className="kb-odo__zeichen">
                {c === " " ? " " : c}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
