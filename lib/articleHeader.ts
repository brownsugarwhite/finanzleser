/**
 * Neue Redaktions-Konvention (Gamification-/Studio-Workflow): Titel und Beschreibung
 * stehen NICHT mehr im WP-Titel-/Untertitel-Feld, sondern am Anfang des Contents.
 * Struktur:
 *
 *   <p><em>… </em></p>     ← wird IGNORIERT (Alt-/Hilfszeile über dem Titel)
 *   <h1>Eigentlicher Titel</h1>   ← fetter Titel (unter dem pinken Reiter)
 *   <p>Einleitung …</p>           ← BESCHREIBUNG (oben, unter dem Titel)
 *   <h2>…</h2> …                  ← ab hier der Artikel-Flow (nach dem TOC)
 *
 * extractArticleHeader zieht Titel (h1) + Beschreibung (erstes <p> NACH dem h1)
 * heraus; der Body beginnt beim ersten <h2>. Alles davor (führendes <p>, h1,
 * Einleitungs-<p>) wird aus dem Fließtext entfernt.
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
  // Muss mit (optionalem führenden <p> — wird ignoriert) + <h1> beginnen.
  const head = content.match(/^\s*(?:<p[^>]*>[\s\S]*?<\/p>\s*)?<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!head) return null;
  const title = stripTags(head[1]);
  if (!title) return null;

  const afterH1 = content.slice(head[0].length);
  // Body beginnt beim ersten <h2>; alles davor ist Einleitung/Beschreibung.
  const h2Idx = afterH1.search(/<h2[\s>]/i);
  if (h2Idx < 0) {
    // Kein <h2> → keine Beschreibung extrahieren, Rest bleibt Body.
    return { title, description: null, body: afterH1.replace(/^\s+/, "") };
  }
  const beforeH2 = afterH1.slice(0, h2Idx);
  const body = afterH1.slice(h2Idx);
  // Beschreibung = erstes <p> zwischen h1 und erstem h2.
  const pMatch = beforeH2.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const description = pMatch ? stripTags(pMatch[1]) || null : null;
  return { title, description, body };
}
