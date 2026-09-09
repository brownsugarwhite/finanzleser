/**
 * Eingefrorene Kapitel: greifen und säubern.
 *
 * 🚨 Getrennt, weil beides zu verschiedenen Zeitpunkten gehört. Gegriffen wird im
 * Klick-Moment — dort zählt jede Millisekunde, denn der Browser malt erst, wenn der
 * Handler zurück ist. Gesäubert wird erst, wenn der Leser das Kapitel wieder aufklappt;
 * bis dahin steht das HTML nur im State und nicht im DOM (siehe Strom.tsx), also kann
 * es auch keine doppelten IDs geben.
 *
 * Vorher lief beides zusammen im Klick: `cloneNode(true)` über einen ganzen Artikel plus
 * drei `querySelectorAll`-Durchläufe darüber.
 */

/** Roh-HTML des lebenden Kapitels (ein nativer Lesezugriff, sonst nichts). */
export function greifen(live: HTMLElement): string {
  const inhalt = live.querySelector(".kapitel__inhalt") || live;
  const leo = document.getElementById("leo-strom");
  const leoHtml = leo && leo.children.length
    ? `<div class="leo-strom leo-strom--alt" data-leo-alt>${leo.innerHTML}</div>`
    : "";
  return inhalt.innerHTML + leoHtml;
}

/**
 * Für die Anzeige aufbereiten: nichts Ausführbares, keine doppelten IDs, keine zweite
 * Live-Region, und aus Leos Wortwechsel fliegen Tippanzeige und Aktionen heraus.
 */
export function saeubern(html: string, id: string): string {
  if (typeof document === "undefined") return html;
  const t = document.createElement("template");
  t.innerHTML = html;
  t.content.querySelectorAll("script, iframe, video, audio, canvas").forEach((e) => e.remove());
  t.content.querySelectorAll("[data-leo-alt] .tippt, [data-leo-alt] .cursor, [data-leo-alt] .leo-chips, [data-leo-alt] .werkzeuge").forEach((e) => e.remove());
  t.content.querySelectorAll("[aria-live]").forEach((e) => e.removeAttribute("aria-live"));
  t.content.querySelectorAll("[id]").forEach((e) => { e.id = `alt-${id}-${e.id}`; });
  return t.innerHTML;
}
