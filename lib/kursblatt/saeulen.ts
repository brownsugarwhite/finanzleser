/**
 * Die Rechnung hinter dem Säulen-Marktband — einmal für alle, die es zeichnen.
 *
 * Übergabe „Finanzleser Heute“, Bausteine 2 und 2b: Dieselbe Grafik steht klein im
 * Vergleichs-Teaser der Startseite (48 px Feldhöhe) und groß im Marktüberblick des
 * Kursblatts (130 px). Nur der Sockel unterscheidet sich, alles andere ist identisch.
 *
 * 🚨 Die Höhe zeigt den VORSPRUNG, nicht den Wert. Eine Säule, die den Preis abbildet,
 * macht das teuerste Angebot zum höchsten Balken — genau verkehrt herum. Hier ist die
 * beste Säule die höchste, und die schlechteste bleibt ein Stummel (der Sockel, damit
 * sie nicht ganz verschwindet).
 *
 * Alle Rückgabewerte sind PROZENT der Feldhöhe. Wer sie in Pixel umrechnet, bindet die
 * Grafik an eine Größe; so trägt sie jede.
 */

/** Sockel der kleinen Fassung (Teaser) und der großen (Kursblatt). */
export const SOCKEL_TEASER = 0.16;
export const SOCKEL_KURSBLATT = 0.14;

export interface SaeulenSkala {
  /** Höhe in Prozent für einen Wert. */
  hoehe: (wert: number) => number;
  /** Der beste und der schlechteste Wert der Reihe. */
  best: number;
  rand: number;
  schnitt: number;
  /** Ob kleinere Werte besser sind (Preis) oder größere (Zins, Ertrag). */
  guenstiger: boolean;
}

/**
 * Die Skala zu einer Werteliste. `hoch` heißt: mehr ist besser.
 * Bei einer Liste aus lauter gleichen Werten stehen alle Säulen voll — es gibt dann
 * keinen Vorsprung zu zeigen, und ein Feld voller Stummel wäre eine Falschaussage.
 */
export function saeulenSkala(werte: number[], hoch: boolean, sockel = SOCKEL_KURSBLATT): SaeulenSkala {
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const schnitt = werte.reduce((a, b) => a + b, 0) / werte.length;
  const frac = (w: number) => (max === min ? 0 : hoch ? (max - w) / (max - min) : (w - min) / (max - min));
  return {
    hoehe: (w: number) => Math.round((sockel + (1 - sockel) * (1 - frac(w))) * 100),
    best: hoch ? max : min,
    rand: hoch ? min : max,
    schnitt,
    guenstiger: !hoch,
  };
}
