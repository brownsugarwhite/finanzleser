"use client";

import dynamic from "next/dynamic";

const RechnerEmbed = dynamic(() => import("@/components/rechner/RechnerEmbed"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Rechner wird geladen...</div>,
});

const ChecklisteInline = dynamic(() => import("@/components/checkliste/ChecklisteInline"), {
  loading: () => <div style={{ padding: 24, textAlign: "center", color: "#999" }}>Checkliste wird geladen...</div>,
});

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
            <div key={i} style={{ margin: "40px 0" }}>
              <RechnerEmbed slug={part.value} />
            </div>
          );
        }
        if (part.type === "checkliste") {
          return (
            <div key={i} className="checkliste-article-wrap">
              <ChecklisteInline slug={part.value} />
            </div>
          );
        }
        return null;
      })}
    </>
  );
}
