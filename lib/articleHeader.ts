/**
 * Redaktions-Konvention v2 (Struktur-Migration 2026): Der echte Titel steht im
 * WP-Titel-Feld (post.title) — NICHT mehr im Content. Der Content beginnt mit:
 *
 *   <h2>Kicker-Tagline</h2>      ← 1. h2 = Untertitel (fett, 42px, brand-secondary)
 *   <p>SEO-Beschreibung</p>      ← Beschreibung (liegt auch im Excerpt-Feld)
 *   <h2>Begriff-Überschrift</h2> ← 2. h2 = erste echte TOC-Überschrift
 *   <p>Body …</p>
 *
 * extractArticleHeader zieht subtitle (1. h2) + description (erstes <p> nach dem
 * 1. h2) heraus; der Body beginnt beim 2. <h2>, sodass der TOC automatisch bei der
 * Begriff-Überschrift startet und die Kicker-h2 nie im Fließtext/TOC auftaucht.
 *
 * Greift nur, wenn der Content mit einem <h2> beginnt (genauer: ein <h2> enthält).
 * Beiträge ohne Content-h2 → null, Frontend fällt auf die WP-Felder zurück.
 */

export interface ArticleHeader {
  subtitle: string;
  description: string | null;
  body: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function extractArticleHeader(content?: string): ArticleHeader | null {
  if (!content) return null;

  // 1. <h2> = Kicker/Untertitel.
  const firstH2 = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!firstH2 || firstH2.index === undefined) return null;
  const subtitle = stripTags(firstH2[1]);
  if (!subtitle) return null;

  const afterFirstH2 = content.slice(firstH2.index + firstH2[0].length);

  // 2. <h2> = erste echte Body-Überschrift (Begriff). Body beginnt dort.
  const secondH2Rel = afterFirstH2.search(/<h2[\s>]/i);

  if (secondH2Rel < 0) {
    // Kein 2. h2 → Beschreibung = erstes <p> nach dem 1. h2, Body = Rest danach.
    const pMatch = afterFirstH2.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const description = pMatch ? stripTags(pMatch[1]) || null : null;
    const body =
      pMatch && pMatch.index !== undefined
        ? afterFirstH2.slice(pMatch.index + pMatch[0].length).replace(/^\s+/, "")
        : afterFirstH2.replace(/^\s+/, "");
    return { subtitle, description, body };
  }

  const between = afterFirstH2.slice(0, secondH2Rel); // zwischen 1. und 2. h2
  const body = afterFirstH2.slice(secondH2Rel); // ab 2. h2
  // Beschreibung = erstes <p> zwischen den beiden h2.
  const pMatch = between.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const description = pMatch ? stripTags(pMatch[1]) || null : null;
  return { subtitle, description, body };
}
