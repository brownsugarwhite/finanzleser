"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

import FazitHeading from "@/components/ui/FazitHeading";
import ArticleElementWrapper from "@/components/layout/ArticleElementWrapper";

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
  type: "html" | "rechner" | "checkliste" | "vergleich";
  value: string; // HTML string or slug
}

function parseContent(html: string): ContentPart[] {
  const parts: ContentPart[] = [];

  // Regex für Block-Divs (Rechner/Checkliste), Gutenberg-Kommentare (Vergleich) und core/latest-posts
  const blockPattern = /<div\s+data-finanzleser-(rechner|checkliste|vergleich)="([^"]+)"[^>]*><\/div>|<!-- wp:finanzleser\/(vergleich) \{"slug":"([^"]+)"\} \/-->/g;

  let lastIndex = 0;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    // HTML vor dem Block
    if (match.index > lastIndex) {
      const before = html.slice(lastIndex, match.index).trim();
      if (before) parts.push({ type: "html", value: before });
    }

    const blockType = (match[1] || match[3]) as "rechner" | "checkliste" | "vergleich";
    const blockSlug = match[2] || match[4];
    parts.push({ type: blockType, value: blockSlug });

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

export default function ArticleContent({ content, collapsed, currentSlug }: Props) {
  const parts = parseContent(content);

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
          onComplete: () => gsap.set(answer, { clearProps: "height,paddingBottom" }),
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
          onComplete: () => gsap.set(answer, { height: "auto" }),
        });
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Globalen Heading-Index ueber alle Parts hinweg berechnen
  let headingIndex = 0;
  const rendered = parts.map((part, i) => {
    if (part.type === "html") {
      const { html, count } = addHeadingIds(part.value, headingIndex);
      headingIndex += count;
      const fazitParts = splitFazit(html);
      return fazitParts.map((fp, j) => {
        if (fp.type === "fazit") {
          return (
            <ArticleElementWrapper key={`${i}-fazit-${j}`} variant="centered" collapsed={collapsed}>
              <FazitHeading id={fp.value} />
            </ArticleElementWrapper>
          );
        }
        return (
          <ArticleElementWrapper key={`${i}-html-${j}`} variant="centered" collapsed={collapsed}>
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: fp.value }} />
          </ArticleElementWrapper>
        );
      });
    }
    if (part.type === "rechner") {
      const id = `heading-${headingIndex}`;
      headingIndex++;
      return (
        <ArticleElementWrapper key={i} variant="wide" collapsed={collapsed}>
          <div className="article-tool-embed">
            <RechnerEmbed
              slug={part.value}
              formHeader={<ToolLabel type="rechner" slug={part.value} headingId={id} showExcerpt />}
            />
          </div>
        </ArticleElementWrapper>
      );
    }
    if (part.type === "checkliste") {
      const id = `heading-${headingIndex}`;
      headingIndex++;
      return (
        <ArticleElementWrapper key={i} variant="wide" collapsed={collapsed}>
          <div className="checkliste-article-wrap">
            <ChecklisteEmbed
              slug={part.value}
              formHeader={<ToolLabel type="checkliste" slug={part.value} headingId={id} showExcerpt />}
            />
          </div>
        </ArticleElementWrapper>
      );
    }
    if (part.type === "vergleich") {
      const id = `heading-${headingIndex}`;
      headingIndex++;
      return (
        <ArticleElementWrapper key={i} variant="wide" collapsed={collapsed}>
          <VergleichEmbed
            slug={part.value}
            formHeader={<ToolLabel type="vergleich" slug={part.value} headingId={id} showExcerpt />}
          />
        </ArticleElementWrapper>
      );
    }
    return null;
  });

  return <>{rendered}</>;
}
