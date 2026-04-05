"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

const ChecklisteInline = dynamic(() => import("@/components/checkliste/ChecklisteInline"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Checkliste wird geladen...</div>,
});

const TOOL_CONFIG = {
  rechner: { label: "Rechner", color: "var(--color-tool-rechner)", endpoint: "/finanzleser/v1/rechner" },
  checkliste: { label: "Checkliste", color: "var(--color-tool-checklisten)", endpoint: "/finanzleser/v1/checklisten" },
  vergleich: { label: "Vergleich", color: "var(--color-tool-vergleiche)", endpoint: "" },
} as const;

function ToolLabel({ type, slug }: { type: keyof typeof TOOL_CONFIG; slug: string }) {
  const config = TOOL_CONFIG[type];
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`/api/tool-title/${type}/${slug}`)
      .then((res) => res.json())
      .then((data) => { if (data.title) setTitle(data.title); })
      .catch(() => {});
  }, [type, slug]);

  return (
    <div className="article-tool-label">
      <span className="article-tool-badge" style={{ background: config.color }}>
        {config.label}
      </span>
      {title && <span className="article-tool-title">{title}</span>}
    </div>
  );
}

interface Props {
  content: string;
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

export default function ArticleContent({ content }: Props) {
  const parts = parseContent(content);

  // Kein Block gefunden → normales HTML
  if (parts.length === 1 && parts[0].type === "html") {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "html") {
          return <div key={i} dangerouslySetInnerHTML={{ __html: part.value }} />;
        }
        if (part.type === "rechner") {
          return (
            <div key={i} style={{ margin: "40px 0" }} className="article-tool-embed">
              <ToolLabel type="rechner" slug={part.value} />
              <RechnerEmbed slug={part.value} />
            </div>
          );
        }
        if (part.type === "checkliste") {
          return (
            <div key={i} className="checkliste-article-wrap">
              <ToolLabel type="checkliste" slug={part.value} />
              <ChecklisteInline slug={part.value} />
            </div>
          );
        }
        return null;
      })}
    </>
  );
}
