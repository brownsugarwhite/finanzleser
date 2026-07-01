/**
 * Wiederverwendbare Helfer, um aus einer Artikel-Card die Morph-Items (Quell-Rects
 * + Schrift-Stile bzw. Visual) zu erfassen — genutzt von allen Card-Typen
 * (SlideArticleCard, SearchResultCard, ArticleListItem, FinanztoolsHero-Sidebar).
 *
 * Mapping nach String-Identität (siehe MorphTransitionLayer): der fette Titel
 * (= beitragUntertitel) → article-subtitle, der Titel/Subline (= post.title)
 * → article-title (pink kursiv), das Visual → article-visual.
 */

import type { MorphItemSource, MorphKind } from "@/lib/morphTransition";

/** Aktueller (evtl. gehoverter) Skalierungsfaktor eines Elements aus seinem transform. */
export function getElementScale(el: HTMLElement | null): number {
  if (!el) return 1;
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 1;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (m) {
    const a = parseFloat(m[1].split(",")[0]);
    return a > 0 ? a : 1;
  }
  return 1;
}

/**
 * Ein Text-Element als Morph-Item erfassen. Der Rect ist (falls die Card gehovert
 * skaliert ist) bereits skaliert → der Morph startet EXAKT beim gehoverten Zustand
 * (kein Snap auf 1.0). Damit der Umbruch identisch bleibt, werden Schrift UND
 * Zeilenhöhe um denselben `scale`-Faktor mitskaliert (Breite + Font skaliert =
 * gleicher Umbruch).
 */
export function captureTextItem(
  el: HTMLElement | null,
  kind: MorphKind,
  scale = 1
): MorphItemSource | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize) || undefined;
  const lhPx = cs.lineHeight.endsWith("px") ? parseFloat(cs.lineHeight) : null;
  return {
    kind,
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    text: el.textContent || "",
    fontSize: fs ? fs * scale : undefined,
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    lineHeight: lhPx != null ? `${lhPx * scale}px` : cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    color: cs.color,
  };
}

/** Den Visual-Container als Morph-Item erfassen (Rect + Bildquelle). */
export function captureVisualItem(el: HTMLElement | null, imgSrc?: string | null): MorphItemSource | null {
  if (!el || !imgSrc) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    kind: "visual",
    rect: { top: r.top, left: r.left, width: r.width, height: r.height },
    imgSrc,
    borderRadius: cs.borderRadius,
  };
}

/** Original-Card-Elemente unsichtbar schalten (der abgehobene Anker übernimmt). */
export function hideSourceEls(...els: (HTMLElement | null | undefined)[]): void {
  els.forEach((e) => {
    if (e) e.style.visibility = "hidden";
  });
}
