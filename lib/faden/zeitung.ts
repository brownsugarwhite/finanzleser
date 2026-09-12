/**
 * Zeitungssatz im Faden: Fließtext in zwei Spalten, große Initiale am Auftakt.
 *
 * Beide Entscheidungen sind unabhängig voneinander und fallen serverseitig, damit im
 * SSR-HTML schon die richtigen Klassen stehen (kein Umbruch-Flackern nach Hydration).
 *
 * 🚨 Bis 11.09.2026 entschied hier die TEXTLÄNGE, ob ein Block zwei Spalten bekommt —
 * jeder Block im Beitrag konnte also mehrspaltig werden. Das hatte zwei Nachteile:
 *
 *   1. Design A v2 setzt genau EINEN Block zweispaltig, den Auftakt (Handoff Zeile 403).
 *      Alles Weitere läuft dort über die volle Satzbreite.
 *   2. `columns` eröffnet einen eigenen Block-Formatierungskontext. Ein solcher Block
 *      umfließt einen Float nicht, er weicht ihm als Ganzes aus. Neben einer umflossenen
 *      Anzeige blieb der Text deshalb auf 402 von 728 px stehen — auch 500 px unterhalb
 *      der Anzeige, wo längst wieder die volle Breite frei war. Auch `columns: 1` half
 *      nicht: der Kontext bleibt bestehen.
 *
 * Deshalb entscheidet jetzt der ORT, nicht die Länge: der Aufrufer sagt, ob dieser Block
 * der Auftakt ist. Damit hat außerhalb des ersten Abschnitts kein Block mehr `columns`,
 * und der Textumfluss um die Anzeigen funktioniert von selbst.
 */

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

/** Zu kurz für zwei Spalten: unter dieser Länge sähe die zweite Spalte leer aus. */
const MIN_ZEICHEN = 300;

/** Reiner Textinhalt eines HTML-Schnipsels — nur zum Zählen, nicht zum Rendern. */
function nurText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z]+|#\d+);/gi, "x")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Klassen für einen Fließtext-Block.
 *
 * `spalten` bittet um den Zweispaltensatz — nur der erste Abschnitt tut das. Auch dann
 * bleibt der Block einspaltig, wenn er eine Liste oder Tabelle enthält oder so kurz ist,
 * dass die zweite Spalte leer bliebe.
 * `initiale` bittet um die große Initiale; sie trägt auch einspaltig.
 */
export function zeitungKlassen(
  html: string,
  opts: { spalten?: boolean; initiale?: boolean } = {},
): string {
  const klassen: string[] = [];
  if (opts.spalten && !SPERREN.test(html) && nurText(html).length >= MIN_ZEICHEN) klassen.push("zeitung");
  // Die Initiale hängt an `p:first-child::first-letter` — ohne führenden Absatz
  // (Liste, Überschrift, Kasten) gäbe es nichts zu vergrößern.
  if (opts.initiale && /^\s*<p[\s>]/i.test(html)) klassen.push("zeitung--initiale");
  return klassen.join(" ");
}
