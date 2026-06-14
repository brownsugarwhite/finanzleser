"use client";

import { memo, Fragment, useState, useEffect, useMemo, useLayoutEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import gsap from "@/lib/gsapConfig";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

import FazitHeading from "@/components/ui/FazitHeading";
import ArticleElementWrapper from "@/components/layout/ArticleElementWrapper";
import GamificationEmbed from "@/components/gamification/GamificationEmbed";
import ArticleFaq, { type FaqPair } from "@/components/sections/ArticleFaq";
import type { ArticleToolData } from "@/lib/articleToolData";

const ChecklisteEmbed = dynamic(() => import("@/components/checkliste/ChecklisteEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Checkliste wird geladen...</div>,
});

const VergleichEmbed = dynamic(() => import("@/components/vergleich/VergleichEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Vergleich wird geladen...</div>,
});

const DokumenteEmbed = dynamic(() => import("@/components/dokumente/DokumenteEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Dokumente werden geladen...</div>,
});


const TOOL_CONFIG = {
  rechner: { label: "Rechner", color: "var(--color-tool-rechner)", endpoint: "/finanzleser/v1/rechner" },
  checkliste: { label: "Checkliste", color: "var(--color-tool-checklisten)", endpoint: "/finanzleser/v1/checklisten" },
  vergleich: { label: "Vergleich", color: "var(--color-tool-vergleiche)", endpoint: "" },
} as const;

function ToolLabel({ type, slug, headingId, showExcerpt, preload }: { type: keyof typeof TOOL_CONFIG; slug: string; headingId: string; showExcerpt?: boolean; preload?: { title: string; excerpt: string } }) {
  const config = TOOL_CONFIG[type];
  const [title, setTitle] = useState(preload?.title ?? "");
  const [excerpt, setExcerpt] = useState(preload?.excerpt ?? "");

  useEffect(() => {
    if (preload) return; // serverseitig vorgeladen
    fetch(`/api/tool-title/${type}/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.title) setTitle(data.title);
        if (data.excerpt) setExcerpt(data.excerpt);
      })
      .catch(() => {});
  }, [type, slug, preload]);

  return (
    <>
      <h2 id={headingId} className="article-tool-label">
        <span className="article-tool-badge" style={{ background: config.color }}>
          {config.label}
        </span>
        {title && <span className="article-tool-title">{title}</span>}
      </h2>
      {showExcerpt && excerpt && (
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: excerpt }} />
      )}
    </>
  );
}

// Dokumente-Kopf: Spike-Label „Dokumente" (bündig zur Body-Breite) + Untertitel + Linie.
function DokumenteHead({ headingId }: { headingId: string }) {
  return (
    <div className="dok-head">
      <span className="dok-head-line" aria-hidden />
      <h2 id={headingId} className="dok-head-h">
        <span className="dok-head-label">Dokumente</span>
      </h2>
      <span className="dok-head-subtitle">Passende Formulare und Broschüren</span>
    </div>
  );
}

interface Props {
  content: string;
  collapsed: boolean;
  currentSlug?: string;
  showMidAd?: boolean;
  /** Serverseitig vorgeladene Tool-Daten (ISR) → sofort, kein Client-Fetch. */
  toolData?: ArticleToolData;
}

interface ContentPart {
  type: "html" | "rechner" | "checkliste" | "vergleich" | "dokumente" | "gamification";
  value: string; // HTML string, slug, kommagetrennte Dokument-Slugs, or gamification type
  gamFields?: Record<string, string>; // nur bei gamification: Feldwerte (Behauptung, Auflösung, …)
}

// Tabellen aus dem (Gamification-/Studio-)Editor kommen teils OHNE <thead>/<tbody>:
// die erste <tr> enthält <th>, steht aber direkt im <table>. Dann greift weder der
// graue Header (.prose thead th) noch das korrekte Zebra (tbody tr:nth-child(even)),
// und die Header-Zeile wird mitgezählt. Fix: erste <th>-Zeile in <thead> wrappen,
// Rest in <tbody> → identische Optik wie in den alten Beiträgen.
function normalizeTableHead(html: string): string {
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
function wrapTables(html: string): string {
  return html.replace(
    /<table\b[^>]*>[\s\S]*?<\/table>/g,
    (match) => `<div class="table-scroll"><div class="table-scroll-inner">${match}</div></div>`
  );
}

// FAQ-Markup robust machen: Von Hand eingefügte FAQs (statt Yoast-Block) haben
// eine LEERE .schema-faq-question und den Fragetext in einem separaten <strong>.
// Hier den Fragetext in die Frage-Klasse ziehen, damit das Parsing greift.
// HINWEIS: identisch in lib/articleTocBuilder.ts halten.
function normalizeFaq(html: string): string {
  if (!html.includes("schema-faq")) return html;
  return html.replace(
    /<(strong|h3)([^>]*)class="schema-faq-question"([^>]*)>\s*<\/\1>\s*<strong>([\s\S]*?)<\/strong>/g,
    '<$1$2class="schema-faq-question"$3>$4</$1>'
  );
}

// Yoast-FAQ-Block (<div class="schema-faq …">) aus dem HTML herauslösen und in
// Frage/Antwort-Paare parsen → wird als <ArticleFaq> (Master-Detail/Akkordeon)
// gerendert. Liefert {before, pairs, after} oder null, wenn kein FAQ-Block da ist.
function extractFaqBlock(html: string): { before: string; pairs: FaqPair[]; after: string; headingId: string } | null {
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

function parseContent(html: string): ContentPart[] {
  const parts: ContentPart[] = [];

  // Regex für Block-Divs (Rechner/Checkliste), Gutenberg-Kommentare (Vergleich) und core/latest-posts.
  // Gamification (3. Alternative) ist – anders als die Slug-Tools – NICHT leer: der Block enthält die
  // Felder inline. Voraussetzung: keine verschachtelten <div> im Block (vom Studio so erzeugt), damit
  // [\s\S]*? bis zum ersten </div> korrekt greift.
  const blockPattern = /<div\s+data-finanzleser-(rechner|checkliste|vergleich|dokumente)="([^"]+)"[^>]*><\/div>|<!-- wp:finanzleser\/(vergleich) \{"slug":"([^"]+)"\} \/-->|<div\s+[^>]*?data-finanzleser-gamification="(mythos|quiz|schaetzen|karte|test|gewusst)"[^>]*>([\s\S]*?)<\/div>/g;

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
      const fieldPattern = /<p\s+data-gam-field="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
      let fieldMatch;
      while ((fieldMatch = fieldPattern.exec(match[6])) !== null) {
        fields[fieldMatch[1]] = fieldMatch[2].replace(/<[^>]+>/g, "").trim();
      }
      parts.push({ type: "gamification", value: gamType, gamFields: fields });
    } else {
      const blockType = (match[1] || match[3]) as "rechner" | "checkliste" | "vergleich" | "dokumente";
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
function addHeadingIds(html: string, startIndex: number): { html: string; count: number } {
  let idx = startIndex;
  const result = html.replace(/<h2([\s>])/gi, (_, after) => {
    const id = `heading-${idx}`;
    idx++;
    return `<h2 id="${id}"${after}`;
  });
  return { html: result, count: idx - startIndex };
}

// Splittet HTML an Fazit-H2s und gibt abwechselnd HTML-Strings und "fazit" Marker zurück
function splitFazit(html: string): { type: "html" | "fazit"; value: string }[] {
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
function injectInlineAd(html: string): string {
  const matches = [...html.matchAll(/<p[\s>]/gi)];
  if (matches.length === 0) return html;
  const at = matches[Math.min(1, matches.length - 1)].index ?? 0;
  const box =
    '<aside class="article-ad-inline" data-ad-format="rectangle" aria-label="Werbung"></aside>';
  return html.slice(0, at) + box + html.slice(at);
}

function ArticleContent({ content, collapsed, currentSlug, showMidAd, toolData }: Props) {
  // Memoize ALL HTML transforms (parseContent + addHeadingIds + splitFazit + wrapTables)
  // so dangerouslySetInnerHTML receives stable strings across re-renders. Otherwise
  // every parent re-render (TOC scroll progress, collapsed toggle, …) produces a new
  // HTML string → React re-sets innerHTML → DOM nodes get replaced → our cached
  // .table-scroll refs go stale → classes never apply.
  type RenderUnit =
    | { kind: "html"; htmlString: string; itemKey: string }
    | { kind: "fazit"; id: string; itemKey: string }
    | { kind: "tool"; toolType: "rechner" | "checkliste" | "vergleich"; slug: string; headingId: string; itemKey: string }
    | { kind: "dokumente"; slugs: string[]; headingId: string; itemKey: string }
    | { kind: "gamification"; gamType: string; fields: Record<string, string>; itemKey: string }
    | { kind: "faq"; pairs: FaqPair[]; headingId: string; itemKey: string };

  const units = useMemo<RenderUnit[]>(() => {
    const raw = parseContent(content);
    const out: RenderUnit[] = [];
    let headingIndex = 0;
    // Dedupe identischer Tool-Embeds (Typ+Slug): Ein Beitrag kann denselben
    // Checklisten-/Rechner-/Vergleich-Embed versehentlich doppelt enthalten —
    // z.B. ein roher <div data-finanzleser-checkliste> (Custom-HTML) PLUS der
    // gerenderte Gutenberg-Block, die beide zum gleichen <div> rendern. Wir
    // rendern jeden Tool-Slug nur einmal. Verschiedene Slugs bleiben erhalten.
    const seenTools = new Set<string>();
    raw.forEach((part, i) => {
      if (part.type === "html") {
        const { html, count } = addHeadingIds(normalizeFaq(part.value), headingIndex);
        headingIndex += count;
        // FAQ-Block (falls vorhanden) herauslösen → eigene <ArticleFaq>-Unit.
        // before bleibt im Fließtext (enthält u.a. die h2.faq-heading = TOC-Eintrag).
        const faq = extractFaqBlock(html);
        const segments: { html: string; faq?: FaqPair[]; faqHeadingId?: string }[] = faq
          ? [{ html: faq.before }, { html: "", faq: faq.pairs, faqHeadingId: faq.headingId }, { html: faq.after }]
          : [{ html }];
        segments.forEach((seg, sIdx) => {
          if (seg.faq) {
            out.push({ kind: "faq", pairs: seg.faq, headingId: seg.faqHeadingId || "", itemKey: `${i}-faq-${sIdx}` });
            return;
          }
          if (!seg.html.trim()) return;
          const fazitParts = splitFazit(seg.html);
          fazitParts.forEach((fp, j) => {
            if (fp.type === "fazit") {
              out.push({ kind: "fazit", id: fp.value, itemKey: `${i}-fazit-${sIdx}-${j}` });
            } else {
              out.push({ kind: "html", htmlString: wrapTables(normalizeTableHead(fp.value)), itemKey: `${i}-html-${sIdx}-${j}` });
            }
          });
        });
      } else if (part.type === "rechner" || part.type === "checkliste" || part.type === "vergleich") {
        const toolKey = `${part.type}:${part.value}`;
        if (seenTools.has(toolKey)) return; // Duplikat → nur einmal rendern
        seenTools.add(toolKey);
        const headingId = `heading-${headingIndex}`;
        headingIndex++;
        out.push({ kind: "tool", toolType: part.type, slug: part.value, headingId, itemKey: `${i}` });
      } else if (part.type === "dokumente") {
        const toolKey = `dokumente:${part.value}`;
        if (seenTools.has(toolKey)) return; // Duplikat → nur einmal rendern
        seenTools.add(toolKey);
        const slugs = part.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
        if (slugs.length === 0) return;
        const headingId = `heading-${headingIndex}`;
        headingIndex++;
        out.push({ kind: "dokumente", slugs, headingId, itemKey: `${i}` });
      } else if (part.type === "gamification") {
        out.push({ kind: "gamification", gamType: part.value, fields: part.gamFields ?? {}, itemKey: `${i}` });
      }
    });
    return out;
  }, [content]);

  // FAQ-Interaktion: jetzt in <ArticleFaq> (Master-Detail/Akkordeon) gekapselt.

  // Edge-gradient toggle for wrapped tables.
  // Strategy: re-apply classes on EVERY render (useLayoutEffect, no deps) so the
  // state survives React DOM resets without any observers or refs. Plus a
  // capture-phase scroll listener for live updates while the user pans the table.
  useLayoutEffect(() => {
    document.querySelectorAll<HTMLElement>(".table-scroll-inner").forEach((inner) => {
      if (!inner.isConnected || inner.scrollWidth === 0) return;
      const wrapper = inner.closest<HTMLElement>(".table-scroll");
      if (!wrapper) return;
      const overflow = inner.scrollWidth - inner.clientWidth > 0.5;
      const atStart = inner.scrollLeft < 0.5;
      const atEnd = inner.scrollWidth - inner.clientWidth - inner.scrollLeft < 0.5;
      wrapper.classList.toggle("is-clipped-left", overflow && !atStart);
      wrapper.classList.toggle("is-clipped-right", overflow && !atEnd);
    });
  });

  useEffect(() => {
    const onScroll = (e: Event) => {
      const inner = e.target as HTMLElement | null;
      if (!(inner instanceof HTMLElement) || !inner.classList.contains("table-scroll-inner")) return;
      const wrapper = inner.closest<HTMLElement>(".table-scroll");
      if (!wrapper) return;
      const overflow = inner.scrollWidth - inner.clientWidth > 0.5;
      const atStart = inner.scrollLeft < 0.5;
      const atEnd = inner.scrollWidth - inner.clientWidth - inner.scrollLeft < 0.5;
      wrapper.classList.toggle("is-clipped-left", overflow && !atStart);
      wrapper.classList.toggle("is-clipped-right", overflow && !atEnd);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
  }, []);


  const renderUnit = (unit: RenderUnit, withAd = false): ReactNode => {
    if (unit.kind === "html") {
      const html = withAd ? injectInlineAd(unit.htmlString) : unit.htmlString;
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </ArticleElementWrapper>
      );
    }
    if (unit.kind === "fazit") {
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <FazitHeading id={unit.id} />
        </ArticleElementWrapper>
      );
    }
    if (unit.kind === "tool" && unit.toolType === "rechner") {
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <div className="article-tool-embed article-finanztool">
            <RechnerEmbed
              slug={unit.slug}
              noVisual
              formHeader={<ToolLabel type="rechner" slug={unit.slug} headingId={unit.headingId} showExcerpt preload={toolData?.titles[`rechner:${unit.slug}`]} />}
            />
            {/* Fester Abstand + Trennlinie nach dem Rechner (ein-/ausgeklappt gleich) */}
            <hr className="article-tool-divider" />
          </div>
        </ArticleElementWrapper>
      );
    }
    if (unit.kind === "tool" && unit.toolType === "checkliste") {
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <div className="checkliste-article-wrap article-finanztool">
            <ChecklisteEmbed
              slug={unit.slug}
              noVisual
              initialData={toolData?.checklisten[unit.slug]}
              formHeader={<ToolLabel type="checkliste" slug={unit.slug} headingId={unit.headingId} showExcerpt preload={toolData?.titles[`checkliste:${unit.slug}`]} />}
            />
            <hr className="article-tool-divider" />
          </div>
        </ArticleElementWrapper>
      );
    }
    if (unit.kind === "tool" && unit.toolType === "vergleich") {
      return (
        <Fragment key={unit.itemKey}>
          {/* Überschrift + Beschreibung auf schmaler Body-Breite (Ads laufen weiter) */}
          <ArticleElementWrapper variant="centered" collapsed={collapsed}>
            <ToolLabel type="vergleich" slug={unit.slug} headingId={unit.headingId} showExcerpt preload={toolData?.titles[`vergleich:${unit.slug}`]} />
          </ArticleElementWrapper>
          {/* Widget breit, OHNE äußere Box (nur Streifen-Ladebox + Vergleich) */}
          <ArticleElementWrapper variant="hero" collapsed={collapsed}>
            <div className="article-finanztool article-finanztool--wide">
              <VergleichEmbed slug={unit.slug} />
            </div>
          </ArticleElementWrapper>
          <ArticleElementWrapper variant="centered" collapsed={collapsed}>
            <hr className="article-tool-divider" />
          </ArticleElementWrapper>
        </Fragment>
      );
    }
    if (unit.kind === "dokumente") {
      return (
        <Fragment key={unit.itemKey}>
          <ArticleElementWrapper variant="hero" collapsed={collapsed}>
            <div className="article-finanztool article-finanztool--wide">
              {/* Spike-Label-Kopf + Linie auf Box-Breite */}
              <DokumenteHead headingId={unit.headingId} />
              {/* Downloads in Box */}
              <div className="article-widget-box">
                <DokumenteEmbed slugs={unit.slugs} initialDokumente={toolData?.dokumente[unit.slugs.join(",")]} />
              </div>
            </div>
          </ArticleElementWrapper>
          <ArticleElementWrapper variant="centered" collapsed={collapsed}>
            <hr className="article-tool-divider" />
          </ArticleElementWrapper>
        </Fragment>
      );
    }
    if (unit.kind === "gamification") {
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <GamificationEmbed gamType={unit.gamType} fields={unit.fields} />
        </ArticleElementWrapper>
      );
    }
    if (unit.kind === "faq") {
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <ArticleFaq pairs={unit.pairs} headingId={unit.headingId} />
        </ArticleElementWrapper>
      );
    }
    return null;
  };

  // 1–2 In-Text-Werbeflächen (float, der Text umfließt sie) gleichmäßig über die
  // längeren HTML-Units verteilen. 2 ab genügend Blöcken, sonst 1.
  // Units mit Tabellen NICHT bewerben — die Float-Box neben einer Tabelle sieht schlecht aus.
  const htmlIndices = units
    .map((u, i) => (u.kind === "html" && !u.htmlString.includes("<table") ? i : -1))
    .filter((i) => i >= 0);
  const adTargets = new Set<number>();
  if (showMidAd && htmlIndices.length > 0) {
    const n = htmlIndices.length >= 4 ? 2 : 1;
    for (let k = 1; k <= n; k++) {
      const idx = htmlIndices[Math.floor((htmlIndices.length * k) / (n + 1))]
        ?? htmlIndices[htmlIndices.length - 1];
      adTargets.add(idx);
    }
  }

  const rendered = units.map((unit, i) => renderUnit(unit, adTargets.has(i)));

  return <>{rendered}</>;
}

// Memo: parent (ArticleClient) re-renders on every vertical scroll (TOC active
// heading updates). Without memo, ArticleContent would re-render too, causing
// React to re-execute dangerouslySetInnerHTML and reset table scrollLeft.
export default memo(ArticleContent);
