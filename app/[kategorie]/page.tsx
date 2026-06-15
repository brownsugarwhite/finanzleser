import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostsByCategory, getCategoryWithChildren, getCategoryBySlug, getAnbieterBySlug, getAllAnbieter } from "@/lib/wordpress";
import { MAIN_CATEGORY_SLUGS } from "@/lib/categories";
import ArticleLayout from "@/components/layout/ArticleLayout";
import { getArticleToolData, EMPTY_TOOL_DATA } from "@/lib/articleToolData";
import AnbieterLayout from "@/components/layout/AnbieterLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";
import MainCategoryLayout from "@/components/layout/MainCategoryLayout";
import type { Post } from "@/lib/types";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";
import { getRedakteurForSlug } from "@/lib/redakteure";

// Redaktions-Roster (Übergang bis Backend-Auswahl): deterministisch je Slug.
function redakteurAuthor(slug: string, date?: string) {
  const r = getRedakteurForSlug(slug);
  return {
    name: r.name,
    role: r.role,
    date: date ? new Date(date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : undefined,
    imageUrl: r.imageUrl,
    colorVariant: r.colorVariant,
  };
}

export const revalidate = 3600;

// Hauptkategorien + Anbieter-Seiten (Legacy-Single-Segment-Pfad) beim Build vorrendern.
// Legacy-Beitrags-Slugs unter dieser Route bleiben dynamisch (dynamicParams = default true).
export async function generateStaticParams(): Promise<Array<{ kategorie: string }>> {
  const params: Array<{ kategorie: string }> = MAIN_CATEGORY_SLUGS.map((slug) => ({ kategorie: slug }));
  try {
    const anbieter = await getAllAnbieter();
    for (const a of anbieter) params.push({ kategorie: a.slug });
  } catch (e) {
    console.error("[main-category generateStaticParams] anbieter failed:", e);
  }
  return params;
}

export async function generateMetadata(
  props: { params: Promise<{ kategorie: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const slug = params.kategorie;

  const post = await getPostBySlug(slug).catch(() => null);
  if (post) {
    return buildMetadata({
      title: `${post.title} – ${SITE_NAME}`,
      description: stripHtml(post.excerpt),
      path: `/${slug}`,
      image: post.featuredImage?.node?.sourceUrl,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.date,
    });
  }

  const anbieter = await getAnbieterBySlug(slug).catch(() => null);
  if (anbieter) {
    return buildMetadata({
      title: `${anbieter.title} – Kontakt – ${SITE_NAME}`,
      description: stripHtml(anbieter.content).slice(0, 160),
      path: `/${slug}`,
    });
  }

  const cat = await getCategoryBySlug(slug).catch(() => null);
  if (cat) {
    return buildMetadata({
      title: `${cat.name} – ${SITE_NAME}`,
      description: stripHtml(cat.description) || `Ratgeber, Rechner und Vergleiche zum Thema ${cat.name}.`,
      path: `/${slug}`,
      image: cat.image,
    });
  }

  return { title: `${slug} – ${SITE_NAME}` };
}

export default async function KategoriePage(props: { params: Promise<{ kategorie: string }> }) {
  const params = await props.params;

  // 1. Zuerst prüfen: ist es ein Post-Slug (legacy URL)?
  const post = await getPostBySlug(params.kategorie).catch(() => null);
  if (post) {
    const toolData = await getArticleToolData(post.content).catch(() => EMPTY_TOOL_DATA);
    return (
      <ArticleLayout title={post.title} subtitle={post.beitragFelder?.beitragUntertitel} content={post.content} toolData={toolData} author={redakteurAuthor(post.slug || params.kategorie, post.date)} />
    );
  }

  // 1a. Ist es ein Anbieter-Slug (legacy URL, /advocard-rechtsschutzversicherung-kontakt/ etc.)?
  const anbieter = await getAnbieterBySlug(params.kategorie).catch(() => null);
  if (anbieter) {
    return <AnbieterLayout title={anbieter.title} content={anbieter.content} />;
  }

  // 2. Prüfen: ist es eine Hauptkategorie mit Child-Kategorien?
  const categoryWithChildren = await getCategoryWithChildren(params.kategorie).catch(() => null);
  if (categoryWithChildren && categoryWithChildren.children && categoryWithChildren.children.length > 0) {
    // Posts pro Subkategorie vorladen (für SubcategorySlider)
    const allCategoryPosts: Record<string, Post[]> = {};
    const results = await Promise.all(
      categoryWithChildren.children.map(async (cat) => ({
        slug: cat.slug,
        posts: await getPostsByCategory(cat.slug).catch(() => []),
      }))
    );
    results.forEach(({ slug, posts }) => { allCategoryPosts[slug] = posts; });

    return (
      <MainCategoryLayout
        name={categoryWithChildren.name}
        slug={params.kategorie}
        description={categoryWithChildren.description}
        image={categoryWithChildren.image}
        imageWide={categoryWithChildren.imageWide}
        categoryChildren={categoryWithChildren.children}
        posts={categoryWithChildren.posts}
        allCategoryPosts={allCategoryPosts}
      />
    );
  }

  // 3. Sonst: Subkategorie-Seite mit Post-Liste
  const posts = await getPostsByCategory(params.kategorie).catch(() => []);
  if (!posts || posts.length === 0) {
    notFound();
  }

  const category = await getCategoryBySlug(params.kategorie).catch(() => null);
  return (
    <CategoryLayout
      title={category?.name || params.kategorie}
      titleSlug={params.kategorie}
      description={category?.description}
      image={category?.image}
      imageWide={category?.imageWide}
      mainCategoryName={category?.parent?.name}
      mainCategorySlug={category?.parent?.slug}
      posts={posts}
    />
  );
}
