/**
 * Server-Verlinkung der Glossarbegriffe im HTML der Kette: reine String-Arbeit, kein DOM.
 *
 * Regeln (Anhang 2.16, mit echtem Text erarbeitet): Kurzformen bis 4 Zeichen (BU, AVB,
 * GOT) nur als ganzes Wort, Nomen nur, wenn das Wort im Text großgeschrieben ist
 * („unterhalten“ ist kein Unterhalt), Flexion bis 3 Buchstaben immer, Komposita
 * („Kindergeldantrag“) erst ab 7 Buchstaben Begriffslänge, erste Fundstelle je Begriff,
 * begrenzte Zahl je Kette. Sperrkontexte: Überschriften, Links, Knöpfe, Tabellenköpfe,
 * Bildunterschriften, Code sowie Kicker, Quellen, Krumen, Vorspann, Chips.
 */
import type { GlossarEintrag } from "@/lib/types";
import { buildGlossarUrl } from "@/lib/urls";

const AUSNAHMEN = new Set(["haftpflichtkasse"]);
/**
 * Homonyme: Wörter, die für einen Begriff NICHT als Treffer zählen, weil sie im
 * Alltagsdeutsch etwas anderes meinen („trägt zur Grundversorgung der Familie bei“ ist
 * kein Stromtarif). Die übrigen Varianten des Begriffs (Grundversorger, StromGVV, …)
 * bleiben aktiv. Ergänzen, wenn der Stapel-Sweep neue Fälle zeigt.
 */
const HOMONYME: Record<string, RegExp> = {
  grundversorgung: /^grundversorgung$/i, // „trägt zur Grundversorgung der Familie bei“
  "zugang-der-kuendigung": /^zugang$/i, // Zugang zu Leistungen, Online-Zugang
  beitrag: /^beitrag$/i, // „in diesem Beitrag“ = Artikel; Beiträge/Beitragssatz bleiben
};
/**
 * Überschriften stehen hier bewusst NICHT mehr drin (Wunsch vom 09.09.): Begriffe dürfen
 * auch in Titeln vorkommen, nicht nur im Fließtext. Der Prototyp sperrte h1–h4 noch
 * (`SKIP` in 05-js-neu.html) — das ist also eine bewusste Abweichung, keine Nachlässigkeit.
 */
const SPERR_TAGS = new Set(["a", "button", "thead", "figcaption", "code", "pre", "script", "style", "label", "input", "select", "textarea", "summary", "svg"]);
const SPERR_KLASSEN = /(^|\s)(kicker|quelle|krumen|vorspann|chip|chips|begriff|einwurf|kasten__fuss|aktionen|dazu|inhalt|wp-block-table-caption)(\s|$)/;
const LEER_TAGS = new Set(["br", "img", "hr", "input", "wbr", "source", "col", "embed", "meta", "link", "track", "area", "base"]);
const WORT = "A-Za-zÄÖÜäöüß";

interface Variante { text: string; klein: string; slug: string }
interface Linker {
  rx: RegExp;
  varianten: Variante[];
  /**
   * Varianten nach ihren ersten beiden Kleinbuchstaben gebündelt, innerhalb des Bündels
   * weiter nach Länge absteigend. `begriffSlug` sucht die längste passende Variante über
   * `startsWith` — dafür müssen die ersten beiden Zeichen ohnehin gleich sein, also
   * reicht das Bündel statt der Liste aller ~2.700.
   */
  eimer: Map<string, Variante[]>;
}

/**
 * 🚨 Modulweit, nicht an der Index-Map.
 *
 * Vorher hing der Cache in einer WeakMap am Ergebnis von `getGlossarIndex()` — das ist
 * `cache()`, also pro Request eine neue Map. Der Cache griff damit nie: Bei JEDEM Render
 * einer Ratgeberseite wurden 2.700 Varianten gesammelt, sortiert und zu einer Regex mit
 * 2.700 Alternativen kompiliert, und das zweimal (KetteKapitel verlinkt in zwei
 * Durchläufen). Der Schlüssel ist jetzt eine Signatur des Index, kein Objekt.
 */
let linkerCache: { schluessel: string; linker: Linker } | null = null;

/** Billige Signatur des Glossars: Zahl der Begriffe + Streuwert über Slugs und Varianten. */
function indexSignatur(index: Map<string, GlossarEintrag>): string {
  let h = 0;
  for (const [slug, e] of index) {
    const s = slug + "\u0000" + (e.varianten?.length ?? 0) + "\u0000" + (e.title || "");
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  }
  return index.size + ":" + (h >>> 0).toString(36);
}

/** Klartext für den Linker vorbereiten: nur was HTML sonst als Markup läse. */
export function alsText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Regex und Variantenliste je Glossar-Index einmal bauen (587 Begriffe, ~2.700 Varianten). */
export function erzeugeLinker(index: Map<string, GlossarEintrag>): Linker {
  const schluessel = indexSignatur(index);
  if (linkerCache && linkerCache.schluessel === schluessel) return linkerCache.linker;
  const varianten: Variante[] = [];
  const gesehen = new Set<string>();
  for (const e of index.values()) {
    for (const v of [e.title, ...(e.varianten || [])]) {
      const t = (v || "").trim();
      if (t.length < 2 || gesehen.has(t.toLowerCase())) continue;
      if (/^\d/.test(t)) continue; // Beträge und Prozentsätze („100.000 Euro“, „14,6 Prozent“) sind kein Begriff
      gesehen.add(t.toLowerCase());
      varianten.push({ text: t, klein: t.toLowerCase(), slug: e.slug });
    }
  }
  varianten.sort((a, b) => b.text.length - a.text.length);
  const rx = new RegExp(`(^|[^${WORT}])((?:${varianten.map((x) => escapeRx(x.text)).join("|")})[${WORT}]*)`, "gi");
  const eimer = new Map<string, Variante[]>();
  for (const v of varianten) {
    const k = v.klein.slice(0, 2);
    const liste = eimer.get(k);
    if (liste) liste.push(v); else eimer.set(k, [v]);
  }
  const l: Linker = { rx, varianten, eimer };
  linkerCache = { schluessel, linker: l };
  return l;
}

function begriffSlug(linker: Linker, wort: string): string | null {
  const w = wort.toLowerCase();
  if (AUSNAHMEN.has(w)) return null;
  // Nur das Bündel mit denselben ersten beiden Zeichen — `startsWith` kann sonst nicht
  // greifen. Reihenfolge im Bündel ist dieselbe wie in der Gesamtliste (Länge absteigend),
  // das Ergebnis also unverändert.
  for (const v of linker.eimer.get(w.slice(0, 2)) || []) {
    if (!w.startsWith(v.klein)) continue;
    const rest = wort.slice(v.text.length);
    if (/^[A-ZÄÖÜ]/.test(v.text) && !/^[A-ZÄÖÜ]/.test(wort)) continue; // Nomen nur großgeschrieben
    if (v.text.length <= 4) { if (rest.length) continue; } // Kurzform nur als ganzes Wort
    else if (rest.length > 3 && (v.text.length < 7 || !/^[a-zäöüß]+$/.test(rest))) continue; // Flexion ≤ 3, Komposita ab 7
    if (HOMONYME[v.slug]?.test(wort)) continue; // Alltagswort, kein Fachbegriff
    return v.slug;
  }
  return null;
}

export interface LinkKontext {
  linker: Linker;
  index: Map<string, GlossarEintrag>;
  /** Slugs, die bereits verlinkt wurden (erste Fundstelle je Begriff, kettenweit). */
  gesehen: Set<string>;
  zahl: number;
  max: number;
  /** Redaktionell vorbelegte Begriffe (glossar_begriffe) haben Vorrang. */
  bevorzugt: Set<string>;
}

export function neuerKontext(index: Map<string, GlossarEintrag>, opts: { max?: number; bevorzugt?: string[] } = {}): LinkKontext {
  const bevorzugt = new Set((opts.bevorzugt || []).filter((s) => index.has(s)));
  // 🚨 Ohne `max` wird NICHT gedeckelt — wie im Prototyp, der für Artikel `verlinke(art)`
  // ohne Obergrenze aufruft (jeder Begriff bei seiner ersten Fundstelle). Vorher stand
  // hier `Math.max(6, bevorzugt.size)`; bei im Median 5 redaktionellen Begriffen hieß das
  // faktisch: nur die redaktionellen, sonst nichts. Über alle 202 Beiträge gemessen kam
  // der Deckel auf 1.212 von 4.375 möglichen Begriffen und beschnitt ausnahmslos jeden
  // Beitrag (Median ohne Deckel: 21). Kleinere Flächen setzen ihre Grenze selbst — die
  // Begriffskarte 3, wie der Prototyp dort `verlinke(b, 3)` nutzt.
  return { linker: erzeugeLinker(index), index, gesehen: new Set(), zahl: 0, max: opts.max ?? Infinity, bevorzugt };
}

function begriffLink(slug: string, wort: string): string {
  return `<a class="begriff" href="${buildGlossarUrl(slug)}" data-b="${slug}">${wort}</a>`;
}

/** Ein Textknoten (ohne Tags): Begriffe verlinken, Entities unangetastet lassen. */
function textVerlinken(text: string, ctx: LinkKontext, nurBevorzugt: boolean): string {
  if (text.trim().length < 3 || ctx.zahl >= ctx.max) return text;
  const { rx } = ctx.linker;
  return text.split(/(&[#\w]+;)/).map((stueck, i) => {
    if (i % 2 === 1 || !stueck) return stueck; // Entity
    let out = "";
    let last = 0;
    rx.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(stueck)) !== null) {
      if (ctx.zahl >= ctx.max) break;
      const wort = m[2];
      const slug = begriffSlug(ctx.linker, wort);
      if (!slug || ctx.gesehen.has(slug)) continue;
      if (nurBevorzugt && !ctx.bevorzugt.has(slug)) continue;
      ctx.gesehen.add(slug);
      ctx.zahl++;
      const start = m.index + m[1].length;
      out += stueck.slice(last, start) + begriffLink(slug, wort);
      last = start + wort.length;
    }
    return last ? out + stueck.slice(last) : stueck;
  }).join("");
}

/**
 * HTML verlinken. Läuft tag-weise durch den String; innerhalb gesperrter Elemente
 * (und aller ihrer Kinder) bleibt der Text unangetastet.
 */
export function verlinke(html: string, ctx: LinkKontext, opts: { nurBevorzugt?: boolean } = {}): string {
  if (!html || ctx.zahl >= ctx.max) return html;
  const nurBevorzugt = !!opts.nurBevorzugt;
  if (nurBevorzugt && !ctx.bevorzugt.size) return html;
  const tokens = html.split(/(<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>)/);
  const offen: { name: string; sperrt: boolean }[] = [];
  let gesperrt = 0;
  let out = "";
  for (const t of tokens) {
    if (!t) continue;
    if (t.startsWith("<!--")) { out += t; continue; }
    if (t.startsWith("</")) {
      const name = (t.match(/^<\/([a-zA-Z0-9]+)/) || [])[1]?.toLowerCase();
      // bis zum passenden Öffner zurückrollen (verzeiht unsauber geschachteltes HTML)
      for (let i = offen.length - 1; i >= 0; i--) {
        const o = offen.pop()!;
        if (o.sperrt) gesperrt--;
        if (o.name === name) break;
      }
      out += t;
      continue;
    }
    if (t.startsWith("<")) {
      const name = (t.match(/^<([a-zA-Z0-9]+)/) || [])[1]?.toLowerCase() || "";
      const selbst = t.endsWith("/>") || LEER_TAGS.has(name);
      const klasse = (t.match(/\sclass=["']([^"']*)["']/) || [])[1] || "";
      const sperrt = SPERR_TAGS.has(name) || SPERR_KLASSEN.test(klasse);
      if (!selbst) { offen.push({ name, sperrt }); if (sperrt) gesperrt++; }
      out += t;
      continue;
    }
    out += gesperrt > 0 ? t : textVerlinken(t, ctx, nurBevorzugt);
  }
  return out;
}
