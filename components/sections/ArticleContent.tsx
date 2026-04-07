"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

import FazitHeading from "@/components/ui/FazitHeading";

const ChecklisteInline = dynamic(() => import("@/components/checkliste/ChecklisteInline"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Checkliste wird geladen...</div>,
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
}

interface ContentPart {
  type: "html" | "rechner" | "checkliste";
  value: string; // HTML string or slug
}

function parseContent(html: string): ContentPart[] {
  const parts: ContentPart[] = [];

  // Regex für die Block-Divs die WordPress rendert
  const blockPattern = /<div\s+data-finanzleser-(rechner|checkliste)="([^"]+)"[^>]*><\/div>/g;

  let lastIndex = 0;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    // HTML vor dem Block
    if (match.index > lastIndex) {
      const before = html.slice(lastIndex, match.index).trim();
      if (before) parts.push({ type: "html", value: before });
    }

    // Der Block selbst
    parts.push({
      type: match[1] as "rechner" | "checkliste",
      value: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  // Rest nach dem letzten Block
  if (lastIndex < html.length) {
    const rest = html.slice(lastIndex).trim();
    if (rest) parts.push({ type: "html", value: rest });
  }

  return parts;
}

function WideContainer({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", paddingRight: collapsed ? 120 : 430 }}>
      <div style={{ width: "100%", minWidth: "80vw", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "80vw" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function CenteredContainer({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", paddingRight: collapsed ? 120 : 430 }}>
      <div style={{ width: "100%", minWidth: 750, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 750 }}>
          {children}
        </div>
      </div>
    </div>
  );
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

export default function ArticleContent({ content, collapsed }: Props) {
  const parts = parseContent(content);

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
            <CenteredContainer key={`${i}-fazit-${j}`} collapsed={collapsed}>
              <FazitHeading id={fp.value} />
            </CenteredContainer>
          );
        }
        return (
          <CenteredContainer key={`${i}-html-${j}`} collapsed={collapsed}>
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: fp.value }} />
          </CenteredContainer>
        );
      });
    }
    if (part.type === "rechner") {
      const id = `heading-${headingIndex}`;
      headingIndex++;
      return (
        <WideContainer key={i} collapsed={collapsed}>
          <div className="article-tool-embed">
            <RechnerEmbed
              slug={part.value}
              formHeader={<ToolLabel type="rechner" slug={part.value} headingId={id} showExcerpt />}
            />
          </div>
        </WideContainer>
      );
    }
    if (part.type === "checkliste") {
      const id = `heading-${headingIndex}`;
      headingIndex++;
      return (
        <WideContainer key={i} collapsed={collapsed}>
          <div className="checkliste-article-wrap">
            <ToolLabel type="checkliste" slug={part.value} headingId={id} />
            <ChecklisteInline slug={part.value} />
          </div>
        </WideContainer>
      );
    }
    return null;
  });

  return <>{rendered}</>;
}
