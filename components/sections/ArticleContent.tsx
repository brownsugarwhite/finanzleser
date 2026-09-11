"use client";

import { memo, Fragment, useState, useEffect, useMemo, useLayoutEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import gsap from "@/lib/gsapConfig";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

import FazitHeading from "@/components/ui/FazitHeading";
import DokumenteHead from "@/components/dokumente/DokumenteHead";
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


interface Props {
  content: string;
  collapsed: boolean;
  currentSlug?: string;
  showMidAd?: boolean;
  /** Serverseitig vorgeladene Tool-Daten (ISR) → sofort, kein Client-Fetch. */
  toolData?: ArticleToolData;
}

import { parseContent, addHeadingIds, splitFazit, wrapTables, normalizeTableHead, normalizeFaq, extractFaqBlock, injectInlineAd } from "@/lib/articleHtml";

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
      // `statistik` fällt hier bewusst heraus: die Formen aus Design A v2 sind in
      // app/statistik-formen.css durchgehend auf `.faden-shell` gescoped und würden auf
      // der alten Beitragsseite ohne Gestaltung stehen. Sie verschwindet dort still,
      // statt kaputt auszusehen. Fällt der Faden je wieder weg, muss das hier nach.
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
          <ArticleElementWrapper variant="tool" collapsed={collapsed}>
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
          <ArticleElementWrapper variant="tool" collapsed={collapsed}>
            <div className="article-finanztool article-finanztool--wide">
              {/* Spike-Label-Kopf + Linie auf Box-Breite */}
              <DokumenteHead headingId={unit.headingId} />
              {/* Downloads ohne umschließenden Kasten */}
              <DokumenteEmbed slugs={unit.slugs} initialDokumente={toolData?.dokumente[unit.slugs.join(",")]} />
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
