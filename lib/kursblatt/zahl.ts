/**
 * Zahlen im Kursblatt — deutsche Schreibweise beim Lesen wie beim Schreiben.
 *
 * Vorlage: design_handoff_finanzleser_kursblatt/, `eur`/`pct` in
 * „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:374-375 sowie die
 * Parse-/Formatier-Paare der drei Bausteine (FL Lineal:47-51/67, FL Setzzeile:43-45).
 *
 * 🚨 Bewusst NICHT `parseNum` aus components/rechner/ui/RechnerInput.tsx:21-31
 * wiederverwendet: das dortige Parsen kennt keine Tausenderpunkte. Wer „20.000“ in eine
 * Setzzeile tippt, bekäme dort 20 — im Kursblatt ist die formatierte Zahl aber genau das,
 * was im Feld steht, und muss sich zurücklesen lassen.
 */

/** „20.000,50“ → 20000.5 · „20000“ → 20000 · Unsinn → NaN. */
export function parseDe(text: string): number {
  const roh = String(text)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  return parseFloat(roh);
}

/** 20000.5 → „20.000,50“ (bei dez = 2). Ohne Einheit. */
export function fmtDe(wert: number, dez = 0): string {
  return wert.toLocaleString("de-DE", { minimumFractionDigits: dez, maximumFractionDigits: dez });
}

/** 339.09 → „339 €“ — gerundet, wie in der Übergabe. */
export function fmtEuro(wert: number): string {
  return `${Math.round(wert).toLocaleString("de-DE")} €`;
}

/** 0.68 → „0,68 %“ — immer zwei Nachkommastellen. */
export function fmtProzent(wert: number, dez = 2): string {
  return `${fmtDe(wert, dez)} %`;
}

/** Wert in die Schranken zwingen. */
export function klemme(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

/**
 * Auf das Raster runden und klemmen — die Mechanik des Lineals (FL Lineal:55).
 * `dez` fängt die Fließkomma-Reste, die beim Multiplizieren mit halben Schritten
 * entstehen (Kinderfreibeträge: Schritt 0,5).
 */
export function aufSchritt(wert: number, schritt: number, min: number, max: number, dez = 0): number {
  if (!isFinite(wert)) return min;
  const gerastert = Math.round(wert / schritt) * schritt;
  return +klemme(gerastert, min, max).toFixed(dez + 2);
}

/** Zahl der Schritte zwischen min und max — Spurlänge des Lineals (FL Lineal:71). */
export function schritte(min: number, max: number, schritt: number): number {
  return Math.round((max - min) / schritt);
}

/**
 * Ist `wert` ein Vielfaches von `teiler`? Mit Toleranz, weil 0,1er-Schritte
 * binär nie exakt aufgehen (FL Lineal:74 `nahe`).
 */
export function vielfaches(wert: number, teiler: number): boolean {
  if (!teiler) return false;
  return Math.abs(wert / teiler - Math.round(wert / teiler)) < 1e-6;
}
