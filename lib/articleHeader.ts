/**
 * Neue Redaktions-Konvention (Gamification-/Studio-Workflow): Titel und Beschreibung
 * stehen NICHT mehr im WP-Titel-/Untertitel-Feld, sondern am Anfang des Contents:
 *
 *   <p><em>Beschreibung …</em></p>     ← Beschreibung (optional)
 *   <h1>Eigentlicher Titel …</h1>      ← fetter Titel (unter dem pinken Reiter)
 *   <p>Intro …</p>                      ← ab hier normaler Artikel-Flow
 *   <h2>…</h2> …
 *
 * extractArticleHeader zieht Titel (h1) + Beschreibung (führendes p) heraus und gibt
 * den restlichen Body zurück, damit beide NICHT doppelt im Fließtext landen.
 *
 * Greift nur, wenn der Content mit (optionalem <p> +) <h1> BEGINNT → alte Beiträge
 * (Titel/Untertitel in den WP-Feldern, kein führendes <h1>) bleiben unverändert.
 */

export interface ArticleHeader {
  title: string;
  description: string | null;
  body: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function extractArticleHeader(content?: string): ArticleHeader | null {
  if (!content) return null;
  // Anker am Anfang: optionales führendes <p>…</p>, dann <h1>…</h1>.
  const m = content.match(/^\s*(?:<p[^>]*>([\s\S]*?)<\/p>\s*)?<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  const title = stripTags(m[2]);
  if (!title) return null;
  const description = m[1] ? stripTags(m[1]) || null : null;
  const body = content.slice(m[0].length).replace(/^\s+/, "");
  return { title, description, body };
}
