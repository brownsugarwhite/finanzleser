/**
 * Server-seitiger Aufbau der Inhaltsverzeichnis-Einträge eines Artikels.
 *
 * 🚨 Muss die Heading-ID-Nummerierung von components/sections/ArticleContent.tsx
 * EXAKT nachbilden (gleiche parseContent-Block-Erkennung, gleiches addHeadingIds-
 * Schema `heading-${n}`, gleiche Tool-Dedupe-Reihenfolge). Sonst zeigen die TOC-
 * Links auf falsche/nicht existierende Anker. Bei Änderungen an ArticleContent
 * dort UND hier anpassen.
 *
 * Zweck: Das inline-TOC (ArticleTableOfContents) kann seine Einträge so schon beim
 * SSR/Client-Render mit voller Höhe ausgeben → kein Layout-Shift / Nachrutschen des
 * Artikel-Contents mehr (auch beim ersten Aufruf, ohne Hard-Refresh).
 */

export interface ArticleTocItem {
  id: string;
  text: string;
  toolType?: "rechner" | "checkliste" | "vergleich";
}

// Identisch zu ArticleContent.parseContent (Block-Divs / Gutenberg-Vergleich-Kommentar
// / Gamification). Frisch instanziiert wegen lastIndex-State des g-Flags.
const BLOCK_PATTERN_SRC =
  '<div\\s+data-finanzleser-(rechner|checkliste|vergleich)="([^"]+)"[^>]*></div>|<!-- wp:finanzleser\\/(vergleich) \\{"slug":"([^"]+)"\\} \\/-->|<div\\s+[^>]*?data-finanzleser-gamification="(mythos|quiz|schaetzen|karte|test|gewusst)"[^>]*>([\\s\\S]*?)</div>';

// Identisch zu ArticleContent.normalizeFaq.
function normalizeFaq(html: string): string {
  if (!html.includes("schema-faq")) return html;
  return html.replace(
    /<(strong|h3)([^>]*)class="schema-faq-question"([^>]*)>\s*<\/\1>\s*<strong>([\s\S]*?)<\/strong>/g,
    '<$1$2class="schema-faq-question"$3>$4</$1>'
  );
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function buildArticleTocItems(content?: string): ArticleTocItem[] {
  if (!content) return [];

  // 1. Content in Parts splitten — wie ArticleContent.parseContent.
  const parts: Array<{ type: "html" | "rechner" | "checkliste" | "vergleich" | "gamification"; value: string }> = [];
  const blockPattern = new RegExp(BLOCK_PATTERN_SRC, "g");
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
      const blockType = (match[1] || match[3]) as "rechner" | "checkliste" | "vergleich";
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
    }
    // gamification: kein heading, kein Index
  }

  return items;
}
