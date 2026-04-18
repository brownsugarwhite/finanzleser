/**
 * Hauptkategorien-Slugs (1:1 zur MegaNav-Reihenfolge).
 * Diese 4 Kategorien gelten als "Top-Level" — egal welchen Parent sie in WP haben.
 *
 * Hintergrund: WP-seitig hängen alle 4 unter der Default-Kategorie "Ratgeber"
 * (parent=8943) für eine saubere CMS-Hierarchie. Im Frontend wird die
 * Hauptkategorie eines Posts deshalb per Slug erkannt, nicht per parent-Check.
 */
export const MAIN_CATEGORY_SLUGS = ["finanzen", "versicherungen", "steuern", "recht"] as const;

export type MainCategorySlug = (typeof MAIN_CATEGORY_SLUGS)[number];

export function isMainCategory(slug?: string | null): boolean {
  return !!slug && (MAIN_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
