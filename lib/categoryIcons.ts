/**
 * Icon-Pfade je Hauptkategorie-Slug. Einfarbige SVGs (fill #334A27) → per
 * CSS-mask + currentColor tintbar (Hover-Recolor). Wird in der Ratgeber-Section
 * (app/page.tsx) und im Megamenü-Booklet genutzt.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  finanzen: "/icons/icon_finanzen.svg",
  versicherungen: "/icons/icon_versicherungen.svg",
  steuern: "/icons/icon_steuer.svg",
  recht: "/icons/icon_recht.svg",
};

/** Slug aus einem Kategorie-Href (z.B. "/finanzen" → "finanzen"). */
export function categoryIconForHref(href: string): string | undefined {
  const slug = href.split("/").filter(Boolean).pop() || "";
  return CATEGORY_ICONS[slug];
}
