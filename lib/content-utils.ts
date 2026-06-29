import { stripVCShortcodes, decodeHtmlEntities } from "./html-utils";

const WORDS_PER_MINUTE = 220;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Bereinigt eine CPT-Beschreibung für die reine Text-Anzeige: dekodiert zuerst
 * HTML-Entities (WP liefert teils `&lt;p&gt;…`), dann werden alle Tags entfernt.
 * So erscheint kein literales `<p>` mehr am Anfang/Ende der Beschreibung.
 */
export function cleanDescription(s: string | undefined | null): string {
  if (!s) return "";
  return stripHtml(decodeHtmlEntities(s));
}

export function getFirstParagraph(content: string | undefined | null): string {
  if (!content) return "";
  const cleaned = stripVCShortcodes(content);

  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = paragraphRegex.exec(cleaned)) !== null) {
    const text = stripHtml(match[1]);
    if (text.length > 0) return text;
  }
  return "";
}

export function getReadingTimeMinutes(content: string | undefined | null): number {
  if (!content) return 0;
  const text = stripHtml(content);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export type PreviewToolType = "rechner" | "vergleich" | "checkliste" | "dokumente";

export function detectToolTypes(content: string | undefined | null): PreviewToolType[] {
  if (!content) return [];
  const tools: PreviewToolType[] = [];
  if (/wp:finanzleser\/rechner|data-finanzleser-rechner/.test(content)) tools.push("rechner");
  if (/wp:finanzleser\/vergleich|data-finanzleser-vergleich/.test(content)) tools.push("vergleich");
  if (/wp:finanzleser\/checkliste|data-finanzleser-checkliste/.test(content)) tools.push("checkliste");
  if (/wp:finanzleser\/dokumente|data-finanzleser-dokumente/.test(content)) tools.push("dokumente");
  return tools;
}
