// Serverseitige FAQ-Extraktion für das FAQPage-JSON-LD der Artikelseite.
// Erkennung über die Yoast-Klassen (.schema-faq-section/-question/-answer) —
// HINWEIS: Parsing-Logik synchron halten mit extractFaqBlock/normalizeFaq in
// components/sections/ArticleContent.tsx (dort fürs Akkordeon-Rendering).

export interface FaqPair {
  q: string;
  a: string;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeFaq(html: string): string {
  if (!html.includes("schema-faq")) return html;
  return html.replace(
    /<(strong|h3)([^>]*)class="schema-faq-question"([^>]*)>\s*<\/\1>\s*<strong>([\s\S]*?)<\/strong>/g,
    '<$1$2class="schema-faq-question"$3>$4</$1>'
  );
}

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
