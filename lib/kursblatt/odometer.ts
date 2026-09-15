/**
 * Ziffernwalzen — die Zeichen rollen von der alten zur neuen Stellung.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:458 (`odo`) und :279
 * (die Walze im Markup). Jede Walze ist eine Spalte mit allen möglichen Zeichen
 * untereinander; sichtbar ist genau eine Zeile, verschoben um `index × 1em`.
 *
 * 🚨 Zwei Fallen des Prototyps, hier behoben:
 *
 * 1. Der Zeichensatz war `0123456789.,% €≈`, und `Math.max(0, indexOf(c))` bildet jedes
 *    unbekannte Zeichen stumm auf die Null ab. Ein Minus oder Plus erschiene als Ziffer 0,
 *    ohne Fehler, ohne Warnung. Der Satz trägt jetzt auch „+ − -“, und `walzen()` meldet
 *    ein unbekanntes Zeichen, statt es zu verschlucken.
 * 2. Die Walzen waren von links indiziert. Wächst die Zahl um eine Stelle (999 → 1.000),
 *    verschiebt das jede Walze, und die ganze Zahl wirbelt. Der Schlüssel zählt deshalb
 *    von RECHTS, und der Block steht rechtsbündig — dann rollt nur, was sich ändert.
 */

export const ZEICHEN = "0123456789.,% €≈+−-";

export interface Walze {
  /** Stellung in der Spalte, 0 = erstes Zeichen. */
  stelle: number;
  /** Breite der Walze in em — Ziffern schmaler als das Prozentzeichen. */
  breite: string;
  /** Schlüssel von rechts gezählt, damit React die Spalten wiedererkennt. */
  schluessel: number;
}

function breiteVon(c: string): string {
  if (/\d/.test(c)) return ".62em";
  if (c === " ") return ".26em";
  if (c === "." || c === ",") return ".3em";
  if (c === "%") return "1.05em";
  return ".82em";
}

export function walzen(text: string): Walze[] {
  const zeichen = [...text];
  return zeichen.map((c, i) => {
    const stelle = ZEICHEN.indexOf(c);
    if (stelle < 0) {
      // Lieber laut als eine falsche Ziffer: im Bau sichtbar, im Betrieb harmlos (Leerzeichen).
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Odometer] Zeichen „${c}“ fehlt im Satz — bitte in ZEICHEN ergänzen.`);
      }
      return { stelle: ZEICHEN.indexOf(" "), breite: breiteVon(" "), schluessel: zeichen.length - 1 - i };
    }
    return { stelle, breite: breiteVon(c), schluessel: zeichen.length - 1 - i };
  });
}
