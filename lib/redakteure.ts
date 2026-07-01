/**
 * Redaktions-Roster (Übergangslösung bis zur Backend-Auswahl nach dem Livegang).
 *
 * 6 Redakteure mit Profilbild + eigener Gradient-Outline (colorVariant 1–6).
 * Verteilung deterministisch je Beitrags-Slug:
 *   - Nicole Hahn auf ~50 % der Beiträge (Index 0)
 *   - die anderen 5 teilen sich die restlichen ~50 % (je ~10 %)
 *
 * Namen aus den Bild-Dateinamen abgeleitet. Die zwei generischen Dateien
 * (Redaktion_01, Redakteur_02) tragen die Byline „Finanzleser Redaktion".
 * Später wird der Redakteur im WP-Backend pro Beitrag gewählt; dann diese
 * Datei durch ein WP-Feld ersetzen.
 */

export interface Redakteur {
  name: string;
  role: string;
  imageUrl: string;
  colorVariant: 1 | 2 | 3 | 4 | 5 | 6;
}

export const REDAKTEURE: Redakteur[] = [
  { name: "Nicole Hahn",          role: "Redakteurin bei Finanzleser.de", imageUrl: "/assets/redaktion/nicole-hahn.jpg",    colorVariant: 1 }, // 50 %
  { name: "Anton Schreiber",      role: "Redakteur bei Finanzleser.de",   imageUrl: "/assets/redaktion/anton-schreiber.jpg", colorVariant: 2 },
  { name: "Jan",                  role: "Redakteur bei Finanzleser.de",   imageUrl: "/assets/redaktion/jan.jpg",             colorVariant: 3 },
  { name: "Johanna",              role: "Redakteurin bei Finanzleser.de", imageUrl: "/assets/redaktion/johanna.jpg",         colorVariant: 4 },
  { name: "Finanzleser Redaktion", role: "Redaktion von Finanzleser.de",  imageUrl: "/assets/redaktion/redakteur-02.jpg",    colorVariant: 5 },
  { name: "Finanzleser Redaktion", role: "Redaktion von Finanzleser.de",  imageUrl: "/assets/redaktion/redaktion-01.jpg",    colorVariant: 6 },
];

// Stabiler String-Hash → 0..99 (gleicher Slug ⇒ immer gleicher Redakteur).
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 100;
}

/** Deterministische Zuordnung: Nicole 50 %, die übrigen 5 je ~10 %. */
export function getRedakteurForSlug(slug: string): Redakteur {
  if (!slug) return REDAKTEURE[0];
  const n = hashSlug(slug);
  if (n < 50) return REDAKTEURE[0]; // Nicole Hahn
  const idx = 1 + Math.floor((n - 50) / 10); // 50–59→1 … 90–99→5
  return REDAKTEURE[Math.min(idx, 5)];
}
