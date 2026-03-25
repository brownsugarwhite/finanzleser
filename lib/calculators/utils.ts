/**
 * Runden auf 2 Dezimalstellen
 * z.B. rund(123.456) → 123.46
 */
export function rund(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Formatieren als Euro mit Tausendertrennzeichen
 * z.B. euro(1234.56) → "1.234,56 €"
 */
export function euro(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}
