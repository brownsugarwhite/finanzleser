/**
 * Reine HTML-Verarbeitung für Beitragsinhalte — ohne React, ohne Next.
 *
 * Wird von zwei Seiten genutzt:
 *   - components/sections/ArticleContent.tsx (alte Beitragsseite, client)
 *   - lib/faden/kette.ts (Faden-Kette, server)
 *   - lib/articleTocBuilder.ts, lib/articleFaq.ts (Server-Helfer)
 *
 * Alles, was die heading-IDs (`heading-<n>`) bestimmt, steht hier an EINER Stelle:
 * parseContent (Block-Erkennung) und addHeadingIds (Zählung über alle <h2>).
 * Änderungen hier wirken auf TOC, FAQ-Anker und die Abschnitts-IDs der Leo-Fragen
 * (docs/inhalte/*.json, tools/faden-stapel.mjs) — die zählen genauso.
 */
import type { FaqPair } from "./articleFaq";

export interface ContentPart {
  type: "html" | "rechner" | "checkliste" | "vergleich" | "dokumente" | "gamification" | "statistik";
  value: string; // HTML string, slug, kommagetrennte Dokument-Slugs, gamification type oder base64-JSON (statistik)
  gamFields?: Record<string, string>; // nur bei gamification: Feldwerte (Behauptung, Auflösung, …)
}

// Regex für Block-Divs (Rechner/Checkliste/Vergleich/Dokumente/Statistik), Gutenberg-Kommentare
// (Vergleich) und Gamification-Boxen. Gamification (3. Alternative) ist – anders als die
// Slug-Tools – NICHT leer: der Block enthält die Felder inline. Voraussetzung: keine
// verschachtelten <div> im Block (vom Studio so erzeugt), damit [\s\S]*? bis zum ersten
// </div> korrekt greift.
// WICHTIG: data-Attribute dürfen NICHT als erstes Attribut vorausgesetzt werden —
// der Gutenberg-Editor schiebt beim erneuten Speichern class/style davor (so brachen
// die Gamification-Felder in „buergergeld"). Daher überall [^>]*? vor dem Attribut.
export const BLOCK_PATTERN_SRC =
  '<div\\s+[^>]*?data-finanzleser-(rechner|checkliste|vergleich|dokumente|statistik)="([^"]+)"[^>]*>\\s*</div>|<!-- wp:finanzleser\\/(vergleich) \\{"slug":"([^"]+)"\\} \\/-->|<div\\s+[^>]*?data-finanzleser-gamification="(mythos|quiz|schaetzen|karte|test|gewusst)"[^>]*>([\\s\\S]*?)</div>';

/** Frisch instanziiert (g-Flag hat lastIndex-State). */
export function neuesBlockPattern(): RegExp {
  return new RegExp(BLOCK_PATTERN_SRC, "g");
}

// Tabellen aus dem (Gamification-/Studio-)Editor kommen teils OHNE <thead>/<tbody>:
// die erste <tr> enthält <th>, steht aber direkt im <table>. Dann greift weder der
// graue Header (.prose thead th) noch das korrekte Zebra (tbody tr:nth-child(even)),
// und die Header-Zeile wird mitgezählt. Fix: erste <th>-Zeile in <thead> wrappen,
// Rest in <tbody> → identische Optik wie in den alten Beiträgen.
export function normalizeTableHead(html: string): string {
  if (!html.includes("<table")) return html;
  return html.replace(/(<table\b[^>]*>)([\s\S]*?)(<\/table>)/gi, (full, open: string, inner: string, close: string) => {
    if (/<thead[\s>]/i.test(inner)) return full; // bereits strukturiert
    const m = inner.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/i);
    if (!m || m.index === undefined) return full;
    const firstRow = m[0];
    if (!/<th[\s>]/i.test(firstRow)) return full; // erste Zeile ist kein Header
    const before = inner.slice(0, m.index);
    const rest = inner.slice(m.index + firstRow.length);
    return `${open}${before}<thead>${firstRow}</thead><tbody>${rest}</tbody>${close}`;
  });
}

// Wrap each <table> in scroll containers so wide tables get horizontal scroll
// instead of bleeding past the viewport. Edge gradients are added via CSS + JS.
export function wrapTables(html: string): string {
  return html.replace(
    /<table\b[^>]*>[\s\S]*?<\/table>/g,
    (match) => `<div class="table-scroll"><div class="table-scroll-inner">${match}</div></div>`
  );
}

// FAQ-Markup robust machen: Von Hand eingefügte FAQs (statt Yoast-Block) haben
// eine LEERE .schema-faq-question und den Fragetext in einem separaten <strong>.
// Hier den Fragetext in die Frage-Klasse ziehen, damit das Parsing greift.
export function normalizeFaq(html: string): string {
  if (!html.includes("schema-faq")) return html;
  return html.replace(
    /<(strong|h3)([^>]*)class="schema-faq-question"([^>]*)>\s*<\/\1>\s*<strong>([\s\S]*?)<\/strong>/g,
    '<$1$2class="schema-faq-question"$3>$4</$1>'
  );
}

// Yoast-FAQ-Block (<div class="schema-faq …">) aus dem HTML herauslösen und in
// Frage/Antwort-Paare parsen → wird als <ArticleFaq> (Master-Detail/Akkordeon)
// gerendert. Liefert {before, pairs, after} oder null, wenn kein FAQ-Block da ist.
export function extractFaqBlock(html: string): { before: string; pairs: FaqPair[]; after: string; headingId: string } | null {
  if (!html.includes("schema-faq")) return null;
  const startMatch = html.match(/<div[^>]*class="schema-faq\b[^"]*"[^>]*>/i);
  if (!startMatch || startMatch.index === undefined) return null;
  const start = startMatch.index;
  // Passendes </div> über Div-Tiefe finden (Sections sind verschachtelte <div>).
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = start;
  let depth = 0;
  let end = -1;
  let t: RegExpExecArray | null;
  while ((t = tagRe.exec(html)) !== null) {
    if (t[0].charAt(1) === "/") {
      depth--;
      if (depth === 0) { end = tagRe.lastIndex; break; }
    } else {
      depth++;
    }
  }
  if (end < 0) return null;

  const block = normalizeFaq(html.slice(start, end));
  // Originale „Häufig gestellte Fragen"-Überschrift entfernen — ArticleFaq rendert sie
  // dekoriert selbst. Deren heading-ID übernehmen → FaqHeading bekommt sie, damit der
  // TOC-Link funktioniert (sonst zeigt der TOC-Eintrag ins Leere).
  let headingId = "";
  // NUR das h2, das selbst „Häufig gestellte Fragen" enthält (Negative-Lookahead auf
  // </h2> verhindert, dass der Match von einem FRÜHEREN h2 – z.B. „Fazit" – bis zur
  // FAQ-Überschrift spannt und alles dazwischen löscht).
  const before = html.slice(0, start).replace(/<h2\b([^>]*)>(?:(?!<\/h2>)[\s\S])*?Häufig gestellte Fragen(?:(?!<\/h2>)[\s\S])*?<\/h2>/gi, (_m, attrs: string) => {
    const idm = attrs.match(/id="([^"]+)"/);
    if (idm) headingId = idm[1];
    return "";
  });
  const after = html.slice(end);

  const pairs: FaqPair[] = [];
  const sectionRe = /<div[^>]*class="schema-faq-section[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let s: RegExpExecArray | null;
  while ((s = sectionRe.exec(block)) !== null) {
    const inner = s[1];
    const qm = inner.match(/<(strong|h3)[^>]*class="schema-faq-question"[^>]*>([\s\S]*?)<\/\1>/i);
    const am = inner.match(/<([a-z0-9]+)[^>]*class="schema-faq-answer"[^>]*>([\s\S]*?)<\/\1>/i);
    const q = qm ? qm[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
    const a = am ? am[2].trim() : "";
    if (q) pairs.push({ q, a });
  }
  return pairs.length ? { before, pairs, after, headingId } : null;
}

/** Beitrags-HTML in HTML-Stücke und Werkzeug-/Spielblöcke zerlegen (Dokumentreihenfolge). */
export function parseContent(html: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const blockPattern = neuesBlockPattern();

  let lastIndex = 0;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    // HTML vor dem Block
    if (match.index > lastIndex) {
      const before = html.slice(lastIndex, match.index).trim();
      if (before) parts.push({ type: "html", value: before });
    }

    const gamType = match[5];
    if (gamType) {
      // Gamification-Block: Felder aus den data-gam-field-Absätzen extrahieren (reiner Text)
      const fields: Record<string, string> = {};
      // Attributreihenfolge-tolerant: WP speichert teils <p style="…" data-gam-field="…">.
      const fieldPattern = /<p\b[^>]*?\bdata-gam-field="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
      let fieldMatch;
      while ((fieldMatch = fieldPattern.exec(match[6])) !== null) {
        fields[fieldMatch[1]] = fieldMatch[2].replace(/<[^>]+>/g, "").trim();
      }
      parts.push({ type: "gamification", value: gamType, gamFields: fields });
    } else {
      // Statistik trägt statt eines Slugs ihre ganze Nutzlast als base64-JSON im Attribut.
      const blockType = (match[1] || match[3]) as "rechner" | "checkliste" | "vergleich" | "dokumente" | "statistik";
      const blockSlug = match[2] || match[4];
      parts.push({ type: blockType, value: blockSlug });
    }

    lastIndex = match.index + match[0].length;
  }

  // Rest nach dem letzten Block
  if (lastIndex < html.length) {
    const rest = html.slice(lastIndex).trim();
    if (rest) parts.push({ type: "html", value: rest });
  }

  return parts;
}

// H2-Tags im HTML-String mit heading-IDs versehen
export function addHeadingIds(html: string, startIndex: number): { html: string; count: number } {
  let idx = startIndex;
  const result = html.replace(/<h2([\s>])/gi, (_, after) => {
    const id = `heading-${idx}`;
    idx++;
    return `<h2 id="${id}"${after}`;
  });
  return { html: result, count: idx - startIndex };
}

// Splittet HTML an Fazit-H2s und gibt abwechselnd HTML-Strings und "fazit" Marker zurück
export function splitFazit(html: string): { type: "html" | "fazit"; value: string }[] {
  const parts: { type: "html" | "fazit"; value: string }[] = [];
  const regex = /<h2([^>]*)>\s*Fazit\s*<\/h2>/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "html", value: html.slice(lastIndex, match.index) });
    }
    // Extract id from the h2 tag if present
    const idMatch = match[1].match(/id="([^"]+)"/);
    parts.push({ type: "fazit", value: idMatch?.[1] || "" });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: "html", value: html.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "html", value: html }];
}

// Float-Werbebox vor dem 2. Absatz (oder 1., wenn nur einer) eines HTML-Blocks
// einsetzen, damit der nachfolgende Text sie umfließt. Platzhalter — später Ad.
export function injectInlineAd(html: string): string {
  const matches = [...html.matchAll(/<p[\s>]/gi)];
  if (matches.length === 0) return html;
  const at = matches[Math.min(1, matches.length - 1)].index ?? 0;
  const box =
    '<aside class="article-side-inline" data-slot-format="rectangle"></aside>';
  return html.slice(0, at) + box + html.slice(at);
}

/** Tags entfernen, Whitespace glätten. */
export function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
