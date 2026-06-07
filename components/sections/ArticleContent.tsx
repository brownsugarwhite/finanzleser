"use client";

import { memo, Fragment, useState, useEffect, useMemo, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import gsap from "@/lib/gsapConfig";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

import FazitHeading from "@/components/ui/FazitHeading";
import ArticleElementWrapper from "@/components/layout/ArticleElementWrapper";
import GamificationEmbed from "@/components/gamification/GamificationEmbed";

const ChecklisteEmbed = dynamic(() => import("@/components/checkliste/ChecklisteEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Checkliste wird geladen...</div>,
});

const VergleichEmbed = dynamic(() => import("@/components/vergleich/VergleichEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Vergleich wird geladen...</div>,
});


const TOOL_CONFIG = {
  rechner: { label: "Rechner", color: "var(--color-tool-rechner)", endpoint: "/finanzleser/v1/rechner" },
  checkliste: { label: "Checkliste", color: "var(--color-tool-checklisten)", endpoint: "/finanzleser/v1/checklisten" },
  vergleich: { label: "Vergleich", color: "var(--color-tool-vergleiche)", endpoint: "" },
} as const;

function ToolLabel({ type, slug, headingId, showExcerpt }: { type: keyof typeof TOOL_CONFIG; slug: string; headingId: string; showExcerpt?: boolean }) {
  const config = TOOL_CONFIG[type];
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");

  useEffect(() => {
    fetch(`/api/tool-title/${type}/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.title) setTitle(data.title);
        if (data.excerpt) setExcerpt(data.excerpt);
      })
      .catch(() => {});
  }, [type, slug]);

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
}

interface ContentPart {
  type: "html" | "rechner" | "checkliste" | "vergleich" | "gamification";
  value: string; // HTML string, slug, or gamification type
  gamFields?: Record<string, string>; // nur bei gamification: Feldwerte (Behauptung, Auflösung, …)
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
// Hier den Fragetext in die Frage-Klasse ziehen, damit Styling + Akkordeon greifen.
function normalizeFaq(html: string): string {
  if (!html.includes("schema-faq")) return html;
  return html.replace(
    /<(strong|h3)([^>]*)class="schema-faq-question"([^>]*)>\s*<\/\1>\s*<strong>([\s\S]*?)<\/strong>/g,
    '<$1$2class="schema-faq-question"$3>$4</$1>'
  );
}

function parseContent(html: string): ContentPart[] {
  const parts: ContentPart[] = [];

  // Regex für Block-Divs (Rechner/Checkliste), Gutenberg-Kommentare (Vergleich) und core/latest-posts.
  // Gamification (3. Alternative) ist – anders als die Slug-Tools – NICHT leer: der Block enthält die
  // Felder inline. Voraussetzung: keine verschachtelten <div> im Block (vom Studio so erzeugt), damit
  // [\s\S]*? bis zum ersten </div> korrekt greift.
  const blockPattern = /<div\s+data-finanzleser-(rechner|checkliste|vergleich)="([^"]+)"[^>]*><\/div>|<!-- wp:finanzleser\/(vergleich) \{"slug":"([^"]+)"\} \/-->|<div\s+[^>]*?data-finanzleser-gamification="(mythos|quiz|schaetzen|karte|test|gewusst)"[^>]*>([\s\S]*?)<\/div>/g;

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
      const blockType = (match[1] || match[3]) as "rechner" | "checkliste" | "vergleich";
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

function ArticleContent({ content, collapsed, currentSlug }: Props) {
  // Memoize ALL HTML transforms (parseContent + addHeadingIds + splitFazit + wrapTables)
  // so dangerouslySetInnerHTML receives stable strings across re-renders. Otherwise
  // every parent re-render (TOC scroll progress, collapsed toggle, …) produces a new
  // HTML string → React re-sets innerHTML → DOM nodes get replaced → our cached
  // .table-scroll refs go stale → classes never apply.
  type RenderUnit =
    | { kind: "html"; htmlString: string; itemKey: string }
    | { kind: "fazit"; id: string; itemKey: string }
    | { kind: "tool"; toolType: "rechner" | "checkliste" | "vergleich"; slug: string; headingId: string; itemKey: string }
    | { kind: "gamification"; gamType: string; fields: Record<string, string>; itemKey: string };

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
        const fazitParts = splitFazit(html);
        fazitParts.forEach((fp, j) => {
          if (fp.type === "fazit") {
            out.push({ kind: "fazit", id: fp.value, itemKey: `${i}-fazit-${j}` });
          } else {
            out.push({ kind: "html", htmlString: wrapTables(fp.value), itemKey: `${i}-html-${j}` });
          }
        });
      } else if (part.type === "rechner" || part.type === "checkliste" || part.type === "vergleich") {
        const toolKey = `${part.type}:${part.value}`;
        if (seenTools.has(toolKey)) return; // Duplikat → nur einmal rendern
        seenTools.add(toolKey);
        const headingId = `heading-${headingIndex}`;
        headingIndex++;
        out.push({ kind: "tool", toolType: part.type, slug: part.value, headingId, itemKey: `${i}` });
      } else if (part.type === "gamification") {
        out.push({ kind: "gamification", gamType: part.value, fields: part.gamFields ?? {}, itemKey: `${i}` });
      }
    });
    return out;
  }, [content]);

  // Accordion-Interaktivität für Yoast FAQ-Block mit GSAP
  useEffect(() => {
    const DURATION = 0.4;
    const PADDING_PX = 20; // entspricht 1.25rem bei 16px Basis
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const question = target.closest(".schema-faq-question") as HTMLElement | null;
      if (!question) return;
      const section = question.closest(".schema-faq-section") as HTMLElement | null;
      if (!section) return;
      const answer = section.querySelector(".schema-faq-answer") as HTMLElement | null;
      if (!answer) return;

      gsap.killTweensOf(answer);
      const isOpen = section.classList.contains("is-open");

      if (isOpen) {
        const current = answer.getBoundingClientRect().height;
        gsap.set(answer, { height: current });
        gsap.to(answer, {
          height: 0,
          paddingBottom: 0,
          duration: DURATION,
          ease: "power3.out",
          onStart: () => section.classList.remove("is-open"),
          onComplete: () => { gsap.set(answer, { clearProps: "height,paddingBottom" }); },
        });
      } else {
        section.classList.add("is-open");
        gsap.set(answer, { height: 0, paddingBottom: 0 });
        const contentHeight = answer.scrollHeight;
        gsap.to(answer, {
          height: contentHeight,
          paddingBottom: PADDING_PX,
          duration: DURATION,
          ease: "power3.out",
          onComplete: () => { gsap.set(answer, { height: "auto" }); },
        });
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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


  const rendered = units.map((unit) => {
    if (unit.kind === "html") {
      return (
        <ArticleElementWrapper key={unit.itemKey} variant="centered" collapsed={collapsed}>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: unit.htmlString }} />
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
    if (unit.kind === "tool") {
      // Überschrift (Badge + Titel) + Einleitung ÜBER dem Tool, in Artikeltext-
      // breite (centered/750) zentriert. Die wide-Column enthält nur Visual + Tool.
      let embed: React.ReactNode = null;
      if (unit.toolType === "rechner") {
        embed = <div className="article-tool-embed"><RechnerEmbed slug={unit.slug} /></div>;
      } else if (unit.toolType === "checkliste") {
        embed = <div className="checkliste-article-wrap"><ChecklisteEmbed slug={unit.slug} /></div>;
      } else {
        embed = <VergleichEmbed slug={unit.slug} />;
      }
      return (
        <Fragment key={unit.itemKey}>
          <ArticleElementWrapper variant="centered" collapsed={collapsed}>
            <div className="article-tool-head">
              <ToolLabel type={unit.toolType} slug={unit.slug} headingId={unit.headingId} showExcerpt />
            </div>
          </ArticleElementWrapper>
          <ArticleElementWrapper variant="wide" collapsed={collapsed}>
            {embed}
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
    return null;
  });

  return <>{rendered}</>;
}

// Memo: parent (ArticleClient) re-renders on every vertical scroll (TOC active
// heading updates). Without memo, ArticleContent would re-render too, causing
// React to re-execute dangerouslySetInnerHTML and reset table scrollLeft.
export default memo(ArticleContent);
