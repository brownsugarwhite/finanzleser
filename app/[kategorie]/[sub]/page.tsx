import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostsByCategory, getCategoryBySlug, getNavItems } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

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
  const cat = await getCategoryBySlug(params.sub).catch(() => null);
  if (cat) {
    return buildMetadata({
      title: `${cat.name} – ${SITE_NAME}`,
      description: stripHtml(cat.description) || `Ratgeber zu ${cat.name}.`,
      path: `/${params.kategorie}/${params.sub}`,
      image: cat.image,
    });
  }
  const post = await getPostBySlug(params.sub).catch(() => null);
  if (post) {
    return buildMetadata({
      title: `${post.title} – ${SITE_NAME}`,
      description: stripHtml(post.excerpt),
      path: `/${params.kategorie}/${params.sub}`,
      image: post.featuredImage?.node?.sourceUrl,
      type: "article",
      publishedTime: post.date,
    });
  }
  return { title: `${params.sub} – ${SITE_NAME}` };
}

export default async function SubkategoriePage(props: { params: Promise<{ kategorie: string; sub: string }> }) {
  const params = await props.params;

  // 1. Zuerst prüfen: ist es eine Kategorie-Seite? Posts + Kategorie PARALLEL holen
  // (beide hängen nur an params.sub; getCategoryBySlug ist via React.cache dedupliziert
  // mit generateMetadata).
  const [categoryPosts, category] = await Promise.all([
    getPostsByCategory(params.sub).catch(() => []),
    getCategoryBySlug(params.sub).catch(() => null),
  ]);
  if (categoryPosts.length > 0) {
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

  // 2. Sonst: prüfen ob es ein Post-Slug ist
  const post = await getPostBySlug(params.sub).catch(() => null);
  if (post) {
    return (
      <ArticleLayout title={post.title} subtitle={post.beitragFelder?.beitragUntertitel} content={post.content} />
    );
  }

  // 3. Nichts gefunden
  notFound();
}
