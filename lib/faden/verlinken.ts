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
const SPERR_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "a", "button", "thead", "figcaption", "code", "pre", "script", "style", "label", "input", "select", "textarea", "summary", "svg"]);
const SPERR_KLASSEN = /(^|\s)(kicker|quelle|krumen|vorspann|chip|chips|begriff|einwurf|kasten__fuss|aktionen|dazu|inhalt|wp-block-table-caption)(\s|$)/;
const LEER_TAGS = new Set(["br", "img", "hr", "input", "wbr", "source", "col", "embed", "meta", "link", "track", "area", "base"]);
const WORT = "A-Za-zÄÖÜäöüß";

interface Variante { text: string; klein: string; slug: string }
interface Linker { rx: RegExp; varianten: Variante[] }

const linkerCache = new WeakMap<object, Linker>();

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Regex und Variantenliste je Glossar-Index einmal bauen (587 Begriffe, ~2.700 Varianten). */
export function erzeugeLinker(index: Map<string, GlossarEintrag>): Linker {
  const hit = linkerCache.get(index);
  if (hit) return hit;
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
  const l = { rx, varianten };
  linkerCache.set(index, l);
  return l;
}

function begriffSlug(varianten: Variante[], wort: string): string | null {
  const w = wort.toLowerCase();
  if (AUSNAHMEN.has(w)) return null;
  for (const v of varianten) {
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
  return { linker: erzeugeLinker(index), index, gesehen: new Set(), zahl: 0, max: opts.max ?? Math.max(6, bevorzugt.size), bevorzugt };
}

function begriffLink(slug: string, wort: string): string {
  return `<a class="begriff" href="${buildGlossarUrl(slug)}" data-b="${slug}">${wort}</a>`;
}

/** Ein Textknoten (ohne Tags): Begriffe verlinken, Entities unangetastet lassen. */
function textVerlinken(text: string, ctx: LinkKontext, nurBevorzugt: boolean): string {
  if (text.trim().length < 3 || ctx.zahl >= ctx.max) return text;
  const { rx, varianten } = ctx.linker;
  return text.split(/(&[#\w]+;)/).map((stueck, i) => {
    if (i % 2 === 1 || !stueck) return stueck; // Entity
    let out = "";
    let last = 0;
    rx.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(stueck)) !== null) {
      if (ctx.zahl >= ctx.max) break;
      const wort = m[2];
      const slug = begriffSlug(varianten, wort);
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
