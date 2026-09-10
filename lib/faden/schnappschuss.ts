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

/**
 * Roh-HTML des lebenden Kapitels — plus seine Höhe.
 *
 * 🚨 Feste Höhen: Der Schnappschuss ersetzt das Kapitel im Klick-Moment, und darunter
 * hängt sofort das Skelett, zu dem der Faden rollt. Ist der Schnappschuss auch nur ein
 * Pixel kürzer als das Kapitel, rutscht das Skelett nach oben und der Sprung zielt daneben
 * (gemessen 10.09.2026: bis zu 11 887 px, weil die Inseln leer 0 px hoch waren; danach
 * +3 513 px, als die Portale sie wieder füllten). Deshalb merkt sich jede Insel hier ihre
 * gerenderte Höhe (`data-insel-h`, `saeubern` macht daraus `min-height`), und das Kapitel
 * als Ganzes seine Höhe samt Leos Wortwechsel (`hoehe`, Strom.tsx setzt sie als
 * `min-height` auf das eingefrorene Kapitel).
 */
export function greifen(live: HTMLElement): { html: string; hoehe: number } {
  const inhalt = live.querySelector(".kapitel__inhalt") || live;
  // Die Insel-Hülle ist `display: contents` (kein eigener Kasten) — gemessen wird die
  // Vereinigung ihrer Kinder.
  inhalt.querySelectorAll<HTMLElement>("[data-insel]").forEach((el) => {
    let oben = Infinity, unten = -Infinity;
    for (const kind of Array.from(el.children)) {
      if (kind.tagName === "SCRIPT") continue;
      const r = kind.getBoundingClientRect();
      if (!r.height) continue;
      oben = Math.min(oben, r.top); unten = Math.max(unten, r.bottom);
    }
    el.dataset.inselH = unten > oben ? String(Math.round(unten - oben)) : "0";
  });
  const leo = document.getElementById("leo-strom");
  const leoHtml = leo && leo.children.length
    ? `<div class="leo-strom leo-strom--alt" data-leo-alt>${leo.innerHTML}</div>`
    : "";
  const hoehe = Math.round(live.getBoundingClientRect().height + (leoHtml ? leo!.getBoundingClientRect().height : 0));
  return { html: inhalt.innerHTML + leoHtml, hoehe };
}

/**
 * Für die Anzeige aufbereiten: nichts Ausführbares, keine doppelten IDs, keine zweite
 * Live-Region, und aus Leos Wortwechsel fliegen Tippanzeige und Aktionen heraus.
 */
export function saeubern(html: string, id: string): string {
  if (typeof document === "undefined") return html;
  const t = document.createElement("template");
  t.innerHTML = html;
  // Skripte raus — außer den JSON-Beilagen der Inseln (die führen nichts aus und werden
  // beim Aufklappen gebraucht, siehe components/faden/kette/Insel.tsx).
  t.content.querySelectorAll("script:not([data-insel-werte]), iframe, video, audio, canvas").forEach((e) => e.remove());
  // Inseln leeren: Was React beim Aufklappen ohnehin neu einhängt, muss nicht als totes
  // Abbild mitgeschleppt werden — das hielte den Schnappschuss unnötig groß und zeigte
  // vor dem Einhängen einen Rechner, den man nicht bedienen kann.
  //
  // 🚨 … aber die Höhe bleibt: Die geleerte Insel wird ein Kasten mit der Höhe, die sie
  // im lebenden Kapitel hatte (`data-insel-h` aus greifen). Das Portal rendert später in
  // diesen Kasten hinein — nichts darunter rückt, weder beim Einfrieren noch beim Beleben.
  t.content.querySelectorAll<HTMLElement>("[data-insel]").forEach((el) => {
    const werte = el.querySelector("script[data-insel-werte]");
    const h = Number(el.dataset.inselH || 0);
    el.innerHTML = "";
    if (werte) el.appendChild(werte);
    if (h > 0) { el.classList.add("insel--platz"); el.style.minHeight = `${h}px`; }
  });
  t.content.querySelectorAll("[data-leo-alt] .tippt, [data-leo-alt] .cursor, [data-leo-alt] .leo-chips, [data-leo-alt] .werkzeuge").forEach((e) => e.remove());
  t.content.querySelectorAll("[aria-live]").forEach((e) => e.removeAttribute("aria-live"));
  // IDs präfixieren, damit ein eingefrorenes Kapitel keine Doppelten ins Dokument bringt —
  // und die Ankerlinks GLEICH MIT. Ohne das zeigte das Inhaltsverzeichnis eines
  // aufgeklappten Kapitels auf `#heading-2`, während der Abschnitt `alt-<id>-heading-2`
  // hieß: elf Links, die ins Leere sprangen.
  t.content.querySelectorAll("[id]").forEach((e) => { e.id = `alt-${id}-${e.id}`; });
  t.content.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const ziel = a.getAttribute("href")!.slice(1);
    if (ziel) a.setAttribute("href", `#alt-${id}-${ziel}`);
  });
  return t.innerHTML;
}
