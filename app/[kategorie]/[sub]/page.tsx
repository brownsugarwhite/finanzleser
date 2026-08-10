import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostsByCategory, getCategoryBySlug, getNavItems } from "@/lib/wordpress";
import CategoryLayout from "@/components/layout/CategoryLayout";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";
import { isMainCategory } from "@/lib/categories";
import { buildSubcategoryUrl, buildPostUrl } from "@/lib/urls";
import { isBotPath } from "@/lib/botPaths";

export const revalidate = 86400;

// Kanonischer Pfad einer Kategorie-Landingpage. Von generateMetadata UND Page genutzt,
// damit Canonical-Tag und Redirect-Ziel garantiert identisch sind.
// WP-Quirk: die 4 Hauptkategorien hängen in WP unter "ratgeber" → per Slug erkennen,
// nicht per parent, sonst würde /ratgeber/finanzen zum Kanon erklärt.
function canonicalCategoryPath(subSlug: string, parentSlug?: string | null): string {
  if (isMainCategory(subSlug)) return `/${subSlug}`;
  if (parentSlug) return buildSubcategoryUrl(parentSlug, subSlug);
  return `/${subSlug}`; // parentlose Kategorie → Root-Ebene
}

// Unterkategorie-Seiten beim Build vorrendern (SSG) statt dynamisch pro Request —
// die Kombinationen kommen aus der Nav-Struktur. Legacy-Post-Slugs unter einer
// Hauptkategorie bleiben dynamisch (dynamicParams = default true).
export async function generateStaticParams() {
  try {
    const navItems = await getNavItems();
    const params: Array<{ kategorie: string; sub: string }> = [];
    for (const item of navItems) {
      for (const sub of item.submenu || []) {
        const parts = sub.href.replace(/^\//, "").split("/").filter(Boolean);
        if (parts.length === 2) params.push({ kategorie: parts[0], sub: parts[1] });
      }
    }
    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: { params: Promise<{ kategorie: string; sub: string }> }
): Promise<Metadata> {
  const params = await props.params;
  // Scanner-Proben (/wp-content/plugins …) nicht gegen WP abfragen.
  if (isBotPath(params.kategorie, params.sub)) return { title: SITE_NAME };
  const cat = await getCategoryBySlug(params.sub).catch(() => null);
  if (cat) {
    return buildMetadata({
      title: `${cat.name} – ${SITE_NAME}`,
      description: stripHtml(cat.description) || `Ratgeber zu ${cat.name}.`,
      // Canonical aus den echten Kategorie-Daten, nie aus der angefragten URL.
      path: canonicalCategoryPath(params.sub, cat.parent?.slug),
      image: cat.image,
    });
  }
  // Post-Slugs unter /x/slug redirectet die Page permanent → Metadata wird verworfen.
  return { title: `${params.sub} – ${SITE_NAME}` };
}

export default async function SubkategoriePage(props: { params: Promise<{ kategorie: string; sub: string }> }) {
  const params = await props.params;

  // Scanner-Proben früh raus, bevor die WP-Queries laufen (siehe lib/botPaths.ts).
  // /wp-content/plugins/foo landet erst hier, nicht in der Root-Route.
  if (isBotPath(params.kategorie, params.sub)) {
    notFound();
  }

  // 1. Zuerst prüfen: ist es eine Kategorie-Seite? Posts + Kategorie PARALLEL holen
  // (beide hängen nur an params.sub; getCategoryBySlug ist via React.cache dedupliziert
  // mit generateMetadata).
  const [categoryPosts, category] = await Promise.all([
    getPostsByCategory(params.sub).catch(() => []),
    getCategoryBySlug(params.sub).catch(() => null),
  ]);
  if (categoryPosts.length > 0) {
    // Nicht-kanonischer Pfad (/quatsch/geldanlagen, /x/finanzen) → 308 auf den Kanon
    // statt 200-Duplikat. Nur mit verifizierten Kategorie-Daten redirecten — bei
    // transientem Fetch-Fail lieber rendern als falsch umleiten.
    if (category) {
      const canonical = canonicalCategoryPath(params.sub, category.parent?.slug);
      if (canonical !== `/${params.kategorie}/${params.sub}`) {
        permanentRedirect(canonical);
      }
    }
    const mainCategory = category?.parent ? category.parent : { name: params.kategorie, slug: params.kategorie };
    return (
      <CategoryLayout
        title={category?.name || params.sub}
        titleSlug={params.sub}
        description={category?.description}
        image={category?.image}
        imageWide={category?.imageWide}
        mainCategoryName={mainCategory?.name}
        mainCategorySlug={mainCategory?.slug}
        posts={categoryPosts}
      />
    );
  }

  // 2. Sonst: Post-Slug unter zwei Segmenten (/x/slug) → 308 auf die kanonische
  // dreistufige URL statt degradiertem Duplikat-Render (früher: ArticleLayout ohne
  // featuredImage/JSON-LD mit Self-Canonical auf den Fake-Pfad).
  const post = await getPostBySlug(params.sub).catch(() => null);
  if (post) {
    permanentRedirect(buildPostUrl(post));
  }

  // 3. Nichts gefunden
  notFound();
}
