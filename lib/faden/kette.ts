/**
 * Artikelmodell der Faden-Kette (Server).
 *
 * Zerlegt den gerenderten Beitragsinhalt (GraphQL `content`) in die Teile, die die
 * Kette braucht: Kicker (h2 #0) + Vorspann, Einleitung (h2 #1), Fachabschnitte (ab #2),
 * FAQ (Yoast-Block), Fazit, Werkzeuge (nach `leo_einwuerfe` platziert), Spielboxen.
 *
 * Abschnitts-IDs sind `heading-<n>` über ALLE h2 in Dokumentreihenfolge — dieselbe
 * Zählung wie lib/articleHtml.addHeadingIds, docs/inhalte/beitraege-liste.json und die
 * Leo-Fragen im CMS (leo_fragen[].abschnitt). Port von tools/faden-export.mjs:56-67.
 */
import type { FadenEinwurf, FadenFelder, FadenFrage, FadenStatistik, Post } from "@/lib/types";
import { parseContent, normalizeFaq, extractFaqBlock, normalizeTableHead, wrapTables, stripTags } from "@/lib/articleHtml";
import { medienHtml, medienUrl } from "./medien";
import { getCategoryPair, buildPostUrl } from "@/lib/urls";
import { getReadingTimeMinutes } from "@/lib/content-utils";
import { getRedakteurForSlug } from "@/lib/redakteure";

export type WerkzeugTyp = "rechner" | "checkliste" | "vergleich" | "dokumente";

export type Teil =
  | { art: "html"; html: string }
  | { art: "embed"; typ: WerkzeugTyp; slug: string; slugs?: string[]; grund?: string; vonLeo?: boolean; nachtrag?: boolean }
  | { art: "spiel"; typ: string; felder: Record<string, string> }
  /** Leos Einwurf im Abschnitt: verweist auf die Werkzeugkarte am Ende des Beitrags. */
  | { art: "einwurf"; typ: WerkzeugTyp; slug: string; grund: string; ziel: string };

export type WerkzeugTeil = Extract<Teil, { art: "embed" }>;

export function werkzeugId(typ: WerkzeugTyp, slug: string): string {
  return `werkzeug-${typ}-${slug}`;
}

export interface Abschnitt {
  /** `heading-<n>` */
  id: string;
  nr: number;
  titel: string;
  /** Titel als HTML, nachdem der Glossar-Linker darüber lief (KetteKapitel). Klartext bleibt in `titel`. */
  titelHtml?: string;
  teile: Teil[];
  fragen: FadenFrage[];
  statistiken: FadenStatistik[];
}

export interface TocEintrag {
  id: string;
  titel: string;
  art: "abschnitt" | "werkzeug" | "faq" | "fazit";
  /** Nur bei `werkzeug`: Typ und Slug; der Titel wird beim Rendern aufgelöst. */
  typ?: WerkzeugTyp;
  slug?: string;
  /** Lesedauer des Abschnitts in Minuten — die Zahl rechts in der Inhaltsübersicht. */
  minuten?: number;
}

export interface Krume {
  name: string;
  href: string;
}

export interface Kette {
  slug: string;
  url: string;
  titel: string;
  /** Erste h2 des Beitrags = großer Untertitel wie auf der alten Seite. */
  kicker: string;
  vorspann: string;
  krumen: Krume[];
  rubrik: string;
  lesezeit: string;
  stand: string;
  autor: { name: string; role: string; imageUrl: string };
  bild?: { src: string; alt: string };
  einleitung?: { titel: string; html: string };
  abschnitte: Abschnitt[];
  faq: { q: string; a: string }[];
  faqId?: string;
  fazitHtml?: string;
  fazitId?: string;
  /** Alle Werkzeuge des Beitrags, in CMS-Reihenfolge, für den Block am Ende. */
  werkzeuge: WerkzeugTeil[];
  toc: TocEintrag[];
  faden: FadenFelder;
}

const LEER: FadenFelder = { leoFragen: [], glossarBegriffe: [], leoEinwuerfe: [], dazuPasst: [], waechterRegeln: [], statistiken: [] };

function datumDe(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

function ersterAbsatz(html: string): string {
  const m = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  return m ? stripTags(m[1]) : stripTags(html).slice(0, 320);
}

/** HTML eines Fließtext-Teils für die Kette aufbereiten: Tabellen, Medien, Klassenmüll. */
function fliessHtml(html: string): string {
  let h = wrapTables(normalizeTableHead(html));
  h = medienHtml(h);
  h = h.replace(/\s+class="wp-block-(heading|paragraph|list|table|image)"/g, "");
  return h.trim();
}

/** Interner Zwischenstand: Sektion je h2 in Dokumentreihenfolge. */
interface RohSektion {
  nr: number;
  titel: string;
  teile: Teil[];
  html: string[]; // gesammelte HTML-Stücke (für Kicker/Einleitung/FAQ/Fazit)
}

export function baueKette(post: Post, opts: { toolTitel?: Record<string, string> } = {}): Kette {
  const content = post.content || "";
  const faden = post.faden || LEER;
  const parts = parseContent(content);

  // 1) In Sektionen je h2 zerlegen, heading-Index über alle h2.
  const sektionen: RohSektion[] = [];
  let aktuelle: RohSektion = { nr: -1, titel: "", teile: [], html: [] };
  let h2Index = 0;
  const h2re = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;

  const htmlAnhaengen = (s: RohSektion, html: string) => {
    const t = html.trim();
    if (!t) return;
    s.html.push(t);
    s.teile.push({ art: "html", html: t });
  };

  for (const part of parts) {
    if (part.type === "html") {
      const html = normalizeFaq(part.value);
      let last = 0;
      let m: RegExpExecArray | null;
      h2re.lastIndex = 0;
      while ((m = h2re.exec(html)) !== null) {
        htmlAnhaengen(aktuelle, html.slice(last, m.index));
        const neu: RohSektion = { nr: h2Index++, titel: stripTags(m[2]), teile: [], html: [] };
        sektionen.push(neu);
        aktuelle = neu;
        last = m.index + m[0].length;
      }
      htmlAnhaengen(aktuelle, html.slice(last));
    } else if (part.type === "gamification") {
      // Die Drehkarte („karte") erklärt einen Begriff — das übernimmt im Faden das
      // Glossar, jeder grüne Begriff öffnet dieselbe Erklärung an Ort und Stelle.
      // Sie bleibt im CMS stehen, wird hier aber nicht mehr in die Kette gehängt.
      if (part.value === "karte") continue;
      aktuelle.teile.push({ art: "spiel", typ: part.value, felder: part.gamFields || {} });
    } else {
      const typ = part.type as WerkzeugTyp;
      const slugs = part.value.split(",").map((s) => s.trim()).filter(Boolean);
      if (!slugs.length) continue;
      aktuelle.teile.push({ art: "embed", typ, slug: slugs[0], slugs: typ === "dokumente" ? slugs : undefined });
    }
  }

  // 2) Kicker (h2 #0), Einleitung (h2 #1), FAQ, Fazit, Fachabschnitte.
  const istFaq = (s: RohSektion) => /h[äa]ufig(e|\s+gestellte)?\s+fragen|faq/i.test(s.titel) || s.html.some((h) => h.includes("schema-faq"));
  const istFazit = (s: RohSektion) => /^fazit\b/i.test(s.titel);

  const kickerSektion = sektionen.find((s) => s.nr === 0);
  const einleitungSektion = sektionen.find((s) => s.nr === 1);
  const kicker = kickerSektion ? kickerSektion.titel : (post.untertitel || "");
  const vorspann = kickerSektion && kickerSektion.html.length ? ersterAbsatz(kickerSektion.html.join("")) : stripTags(post.excerpt || "");

  let faq: { q: string; a: string }[] = [];
  let faqId: string | undefined;
  let fazitHtml: string | undefined;
  let fazitId: string | undefined;

  const fach: Abschnitt[] = [];
  const verirrteEmbeds: Extract<Teil, { art: "embed" }>[] = [];

  for (const s of sektionen) {
    if (s.nr <= 1) {
      // Werkzeuge aus Kicker/Einleitung wandern in den Pool (kommen praktisch nicht vor).
      s.teile.forEach((t) => { if (t.art === "embed") verirrteEmbeds.push(t); });
      continue;
    }
    if (istFaq(s)) {
      const block = extractFaqBlock(s.html.join("\n")) || extractFaqBlock(normalizeFaq(content));
      if (block) { faq = block.pairs; faqId = `heading-${s.nr}`; }
      s.teile.forEach((t) => { if (t.art === "embed") verirrteEmbeds.push(t); });
      continue;
    }
    if (istFazit(s)) {
      fazitHtml = fliessHtml(s.html.join("\n"));
      fazitId = `heading-${s.nr}`;
      s.teile.forEach((t) => { if (t.art === "embed") verirrteEmbeds.push(t); });
      continue;
    }
    // Fachabschnitt: Embeds herausziehen (werden gleich per Einwurf platziert), Rest bleibt in Reihenfolge.
    const teile: Teil[] = [];
    for (const t of s.teile) {
      if (t.art === "embed") verirrteEmbeds.push(t);
      else if (t.art === "html") teile.push({ art: "html", html: fliessHtml(t.html) });
      else teile.push(t);
    }
    fach.push({ id: `heading-${s.nr}`, nr: s.nr, titel: s.titel, teile, fragen: [], statistiken: [] });
  }

  // 3) Werkzeuge: Dedupe in CMS-Reihenfolge; sie stehen wie auf der alten Seite gesammelt am Ende
  //    des Beitrags. Leos Einwürfe (leo_einwuerfe) bleiben im Abschnitt und zeigen auf die Karte.
  const gesehen = new Set<string>();
  const pool: WerkzeugTeil[] = verirrteEmbeds.filter((e) => {
    const key = `${e.typ}:${e.slugs ? e.slugs.join(",") : e.slug}`;
    if (gesehen.has(key)) return false;
    gesehen.add(key);
    return true;
  }).map((e) => ({ ...e, nachtrag: true }));
  const nachId = (id: string) => fach.find((a) => a.id === id);
  for (const e of faden.leoEinwuerfe as FadenEinwurf[]) {
    if (e.typ === "post" || e.typ === "glossar" || e.typ === "spiel") continue;
    const ziel = nachId(e.nach);
    if (!ziel) continue;
    const typ = e.typ as WerkzeugTyp;
    let karte = pool.find((w) => w.typ === typ && (w.slug === e.slug || (w.slugs || []).includes(e.slug)));
    if (!karte) {
      // Einwurf auf ein Werkzeug, das im Beitrag nicht eingebettet ist: Karte kommt aus dem Bestand.
      karte = { art: "embed", typ, slug: e.slug, vonLeo: true, nachtrag: true };
      pool.push(karte);
    }
    if (!karte.grund && e.grund) { karte.grund = e.grund; karte.vonLeo = true; }
    ziel.teile.push({ art: "einwurf", typ, slug: karte.slug, grund: e.grund || "", ziel: werkzeugId(typ, karte.slug) });
  }

  // 4) Leo-Fragen und Statistiken je Abschnitt.
  for (const a of fach) {
    a.fragen = faden.leoFragen.filter((f) => f.abschnitt === a.id);
    a.statistiken = faden.statistiken.filter((st) => st.abschnitt === a.id);
  }

  // 5) Kopfdaten.
  const { main, sub } = getCategoryPair(post.categories);
  const hauptKat = post.categories?.nodes?.find((c) => c.slug === main);
  const subKat = post.categories?.nodes?.find((c) => c.slug === sub) || post.categories?.nodes?.[0];
  const krumen: Krume[] = [{ name: "Ratgeber", href: "/" }];
  if (hauptKat) krumen.push({ name: hauptKat.name, href: `/${main}` });
  if (subKat && subKat.slug !== main) krumen.push({ name: subKat.name, href: `/${main}/${sub}` });
  const r = getRedakteurForSlug(post.slug);
  const minuten = getReadingTimeMinutes(content);
  const einleitungHtml = einleitungSektion ? fliessHtml(einleitungSektion.html.join("\n")) : "";

  // Lesedauer je Abschnitt: die Zahl rechts in der Inhaltsübersicht, wie die Seitenzahl
  // im Inhaltsverzeichnis einer Zeitung. Gerechnet aus dem Fließtext des Abschnitts, mit
  // demselben Maß wie die Gesamtlesezeit (lib/content-utils.ts) — sonst summierten sich
  // die Abschnitte auf einen anderen Wert als die Angabe im Kopf.
  const abschnittMinuten = (a: Abschnitt): number =>
    Math.max(1, getReadingTimeMinutes(a.teile.filter((t) => t.art === "html").map((t) => t.html).join(" ")));
  const toc: TocEintrag[] = fach.map((a) => ({ id: a.id, titel: a.titel, art: "abschnitt" as const, minuten: abschnittMinuten(a) }));
  if (faq.length && faqId) toc.push({ id: faqId, titel: "Häufige Fragen", art: "faq" });
  if (fazitHtml && fazitId) toc.push({ id: fazitId, titel: "Fazit", art: "fazit" });
  for (const w of pool) toc.push({ id: werkzeugId(w.typ, w.slug), titel: w.slug, art: "werkzeug", typ: w.typ, slug: w.slug });

  void opts;
  return {
    slug: post.slug,
    url: buildPostUrl(post),
    titel: post.title,
    kicker,
    vorspann,
    krumen,
    rubrik: main,
    lesezeit: `${minuten} Min.`,
    stand: datumDe(post.modified || post.date),
    autor: { name: r.name, role: r.role, imageUrl: r.imageUrl },
    bild: post.featuredImage?.node?.sourceUrl ? { src: medienUrl(post.featuredImage.node.sourceUrl), alt: post.featuredImage.node.altText || post.title } : undefined,
    einleitung: einleitungSektion ? { titel: einleitungSektion.titel, html: einleitungHtml } : undefined,
    abschnitte: fach,
    faq,
    faqId,
    fazitHtml,
    fazitId,
    werkzeuge: pool,
    toc,
    faden,
  };
}
