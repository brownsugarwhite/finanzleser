/**
 * Server-seitiger Aufbau der Inhaltsverzeichnis-Einträge eines Artikels.
 *
 * 🚨 Muss die Heading-ID-Nummerierung von components/sections/ArticleContent.tsx
 * EXAKT nachbilden (gleiches addHeadingIds-Schema `heading-${n}`, gleiche Tool-Dedupe-
 * Reihenfolge). Die Block-Erkennung kommt seit dem Faden-Umbau aus lib/articleHtml.ts
 * (eine Quelle für ArticleContent, TOC-Builder und lib/faden/kette.ts).
 *
 * Zweck: Das inline-TOC (ArticleTableOfContents) kann seine Einträge so schon beim
 * SSR/Client-Render mit voller Höhe ausgeben → kein Layout-Shift / Nachrutschen des
 * Artikel-Contents mehr (auch beim ersten Aufruf, ohne Hard-Refresh).
 */

export interface ArticleTocItem {
  id: string;
  text: string;
  toolType?: "rechner" | "checkliste" | "vergleich" | "dokumente";
}

import { neuesBlockPattern, normalizeFaq, stripTags } from "./articleHtml";

export function buildArticleTocItems(content?: string): ArticleTocItem[] {
  if (!content) return [];

  // 1. Content in Parts splitten — wie ArticleContent.parseContent.
  const parts: Array<{ type: "html" | "rechner" | "checkliste" | "vergleich" | "dokumente" | "gamification"; value: string }> = [];
  const blockPattern = neuesBlockPattern();
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const before = content.slice(lastIndex, match.index).trim();
      if (before) parts.push({ type: "html", value: before });
    }
    const gamType = match[5];
    if (gamType) {
      parts.push({ type: "gamification", value: gamType });
    } else {
      const blockType = (match[1] || match[3]) as "rechner" | "checkliste" | "vergleich" | "dokumente";
      const blockSlug = match[2] || match[4];
      parts.push({ type: blockType, value: blockSlug });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    const rest = content.slice(lastIndex).trim();
    if (rest) parts.push({ type: "html", value: rest });
  }

  // 2. heading-Index in Dokumentreihenfolge vergeben — wie ArticleContent's useMemo.
  const items: ArticleTocItem[] = [];
  let headingIndex = 0;
  const seenTools = new Set<string>();

  for (const part of parts) {
    if (part.type === "html") {
      const html = normalizeFaq(part.value);
      const h2re = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;
      let h: RegExpExecArray | null;
      while ((h = h2re.exec(html)) !== null) {
        const id = `heading-${headingIndex}`;
        headingIndex++;
        if (/data-toc-exclude/.test(h[1])) continue; // Untertitel o.ä. — ID dennoch vergeben
        const text = stripTags(h[2]);
        if (text) items.push({ id, text });
      }
    } else if (part.type === "rechner" || part.type === "checkliste" || part.type === "vergleich") {
      const key = `${part.type}:${part.value}`;
      if (seenTools.has(key)) continue; // Duplikat → wie ArticleContent nur einmal
      seenTools.add(key);
      const id = `heading-${headingIndex}`;
      headingIndex++;
      // Tool-Titel wird async geladen (ToolLabel) → server leer, Client füllt nach.
      items.push({ id, text: "", toolType: part.type });
    } else if (part.type === "dokumente") {
      const key = `dokumente:${part.value}`;
      if (seenTools.has(key)) continue;
      seenTools.add(key);
      const slugs = part.value.split(",").map((s) => s.trim()).filter(Boolean);
      if (slugs.length === 0) continue;
      const id = `heading-${headingIndex}`;
      headingIndex++;
      // Statische Überschrift „Dokumente" (kein async-Titel wie bei Tools).
      items.push({ id, text: "Dokumente", toolType: "dokumente" });
    }
    // gamification: kein heading, kein Index
  }

  return items;
}
