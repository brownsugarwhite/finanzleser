// Serverseitige FAQ-Extraktion für das FAQPage-JSON-LD der Artikelseite.
// Erkennung über die Yoast-Klassen (.schema-faq-section/-question/-answer) —
// normalizeFaq/stripTags kommen aus lib/articleHtml.ts (dieselbe Quelle wie das
// Akkordeon-Rendering in components/sections/ArticleContent.tsx).

export interface FaqPair {
  q: string;
  a: string;
}

import { normalizeFaq, stripTags } from "./articleHtml";

/** Frage/Antwort-Paare (als Klartext) aus dem Artikel-HTML — leer, wenn kein FAQ-Block. */
export function extractFaqPairs(html?: string): FaqPair[] {
  if (!html || !html.includes("schema-faq")) return [];
  const normalized = normalizeFaq(html);
  const pairs: FaqPair[] = [];
  const sectionRe = /<div[^>]*class="schema-faq-section[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let s: RegExpExecArray | null;
  while ((s = sectionRe.exec(normalized)) !== null) {
    const inner = s[1];
    const qm = inner.match(/<(strong|h3)[^>]*class="schema-faq-question"[^>]*>([\s\S]*?)<\/\1>/i);
    const am = inner.match(/<([a-z0-9]+)[^>]*class="schema-faq-answer"[^>]*>([\s\S]*?)<\/\1>/i);
    const q = qm ? stripTags(qm[2]) : "";
    const a = am ? stripTags(am[2]) : "";
    if (q && a) pairs.push({ q, a });
  }
  return pairs;
}
