/**
 * Die rollende Zahl — Ziffernwalzen statt eines Textwechsels.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:279 (Zinssatz) und
 * :295 („Leo rechnet mit: ≈ 387 €“). Dieselbe Walze, nur andere Schriftgröße.
 *
 * 🚨 Jede Walze trägt ALLE Zeichen untereinander und zeigt davon eine Zeile. Im
 * Textauszug steht damit „0123456789.,% €≈+−-0123456789…“ statt „≈ 382 €“ (gemessen
 * 15.09.2026 im gelieferten HTML). Deshalb liegt die echte Zahl zusätzlich als
 * unsichtbarer Text darunter — dasselbe Mittel wie `.nur-vorlesen` bei den Statistiken
 * (statistik-formen.css:28). Kein display:none: das nähme sie auch aus der Vorlesereihe.
 *
 * Serverkomponente: die Stellung kommt aus dem Text, nicht aus einem Effekt — die
 * richtige Zahl steht schon im gelieferten HTML.
 */
import { ZEICHEN, walzen } from "@/lib/kursblatt/odometer";

export default function Odometer({ text, klasse }: { text: string; klasse?: string }) {
  const spalten = walzen(text);
  return (
    <span className={"kb-odo" + (klasse ? " " + klasse : "")}>
      <span className="kb-odo__klartext">{text}</span>
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
