import type { Post, Category } from "./types";
import { isMainCategory } from "./categories";

const FALLBACK_MAIN = "beitraege";
const FALLBACK_SUB = "allgemein";

export function getCategoryPair(categories?: { nodes: Category[] }): {
  main: string;
  sub: string;
} {
  const nodes = categories?.nodes || [];
  const mainCat = nodes.find((c) => isMainCategory(c.slug));
  const subCat = nodes.find((c) => !isMainCategory(c.slug)) || nodes[0];
  return {
    main: mainCat?.slug || FALLBACK_MAIN,
    sub: subCat?.slug || FALLBACK_SUB,
  };
}

export function buildPostUrl(post: Pick<Post, "slug" | "categories">): string {
  const { main, sub } = getCategoryPair(post.categories);
  return `/${main}/${sub}/${post.slug}`;
}

export function buildCategoryUrl(slug: string): string {
  return `/${slug}`;
}

export function buildSubcategoryUrl(mainSlug: string, subSlug: string): string {
  return `/${mainSlug}/${subSlug}`;
}

export function buildRechnerUrl(slug: string): string {
  return `/finanztools/rechner/${slug}`;
}

export function buildVergleichUrl(slug: string): string {
  return `/finanztools/vergleiche/${slug}`;
}

export function buildChecklisteUrl(slug: string): string {
  return `/finanztools/checklisten/${slug}`;
}

export function buildDokumentUrl(slug: string): string {
  return `/finanztools/dokumente/${slug}`;
}

export function buildAnbieterUrl(slug: string): string {
  return `/${slug}`;
}
