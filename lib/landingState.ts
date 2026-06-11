/**
 * Persistenter Client-Zustand der Landing, der eine Navigation überlebt (framework-frei,
 * wie pageTransition/morphTransition). React unmountet die Landing bei Navigation →
 * lokaler useState ginge verloren. Beim Browser-Zurück soll die Landing aber im
 * vorherigen Zustand erscheinen (Artikelslider offen statt Kategorieslider).
 *
 * Restore NUR bei Zurück/Vor (popstate) — ein normaler Vorwärts-Besuch der Landing
 * startet im Default. Das steuert das Back-Flag.
 */

// SubcategorySlider.activeSlide pro Block (Key = parentSlug; mehrere Blöcke auf der Landing).
const sliderActive = new Map<string, number | null>();

export function getSliderActive(parentSlug: string): number | null {
  return sliderActive.has(parentSlug) ? sliderActive.get(parentSlug)! : null;
}
export function setSliderActive(parentSlug: string, value: number | null): void {
  sliderActive.set(parentSlug, value);
}

// ArticleSlider Embla-Position pro Kategorie (Key = category slug) — damit der
// Slider bei Zurück an der zuvor gescrollten Card steht, nicht bei Slide 0.
const articleSliderPos = new Map<string, number>();
export function getArticleSliderPos(key: string): number {
  return articleSliderPos.get(key) ?? 0;
}
export function setArticleSliderPos(key: string, index: number): void {
  articleSliderPos.set(key, index);
}

// FinanztoolsHero.activeCard
let finanztoolsActiveCard: string | null = null;
export function getFinanztoolsActiveCard(): string | null {
  return finanztoolsActiveCard;
}
export function setFinanztoolsActiveCard(value: string | null): void {
  finanztoolsActiveCard = value;
}

// Back-Flag: true direkt nach einem popstate (Vor/Zurück), bis die Zielseite es
// konsumiert. Bei normaler Vorwärts-Navigation wird es gelöscht.
let backNavigation = false;
export function markBackNavigation(): void {
  backNavigation = true;
}
export function isBackNavigation(): boolean {
  return backNavigation;
}
export function clearBackNavigation(): void {
  backNavigation = false;
}
