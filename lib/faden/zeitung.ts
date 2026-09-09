/**
 * Zeitungssatz im Faden: Fließtext in zwei Spalten, große Initiale am Auftakt.
 *
 * Beide Entscheidungen sind unabhängig voneinander und fallen serverseitig, damit im
 * SSR-HTML schon die richtigen Klassen stehen (kein Umbruch-Flackern nach Hydration).
 *
 * 🚨 Zwei Spalten sind im Web nur so lange eine Wohltat, wie der Block auf einen
 * Bildschirm passt. Wird er höher, liest man Spalte 1 nach unten und muss zum Anfang
 * von Spalte 2 wieder hoch — in der Zeitung gibt es das nicht, weil die Seite eine
 * feste Höhe hat. Deshalb entscheidet hier die Textlänge, nicht der Ort im Beitrag.
 * Bei rund 340 px Spaltenbreite passen etwa 45 Zeichen in eine Zeile; MAX_ZEICHEN
 * ergibt damit gut 20 Zeilen je Spalte und bleibt unter einer Bildschirmhöhe.
 */

const MIN_ZEICHEN = 300;
const MAX_ZEICHEN = 1800;

/**
 * Elemente, bei denen der Block einspaltig bleibt.
 *
 * Aufzählungen jeder Art (ul, ol, dl) gehören dazu: eine Liste im Spaltensatz reißt
 * entweder mitten im Aufzählungspunkt ab, oder sie springt als Ganzes in die nächste
 * Spalte und lässt ihren Zwischentitel allein am Spaltenfuß zurück. Beides liest sich
 * schlechter als eine ruhige einspaltige Liste.
 * Der Rest hat feste Breiten oder eigene Umbruchregeln und passt nicht in ~340 px.
 */
const SPERREN = /<(ul|ol|dl|table|figure|iframe|video|pre|img)\b/i;

/** Reiner Textinhalt eines HTML-Schnipsels — nur zum Zählen, nicht zum Rendern. */
function nurText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z]+|#\d+);/gi, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function zweiSpalten(html: string): boolean {
  if (SPERREN.test(html)) return false;
  const zeichen = nurText(html).length;
  return zeichen >= MIN_ZEICHEN && zeichen <= MAX_ZEICHEN;
}

/**
 * Klassen für einen Fließtext-Block.
 *
 * `initiale` bittet nur um die große Initiale — ob der Block auch zwei Spalten
 * bekommt, entscheidet weiterhin die Länge. Eine Initiale trägt auch einspaltig,
 * ein zu langer Auftakt verliert also nicht seinen Schmuck.
 * Die Ausnahme „neben der umflossenen Anzeige einspaltig“ steht bewusst NICHT hier,
 * sondern in app/faden.css: die Anzeige floatet erst ab 900 px, und ob dieser Punkt
 * erreicht ist, weiß der Server nicht.
 */
export function zeitungKlassen(
  html: string,
  opts: { initiale?: boolean } = {},
): string {
  const klassen: string[] = [];
  if (zweiSpalten(html)) klassen.push("zeitung");
  // Die Initiale hängt an `p:first-child::first-letter` — ohne führenden Absatz
  // (Liste, Überschrift, Kasten) gäbe es nichts zu vergrößern.
  if (opts.initiale && /^\s*<p[\s>]/i.test(html)) klassen.push("zeitung--initiale");
  return klassen.join(" ");
}
