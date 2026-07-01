import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getAllPosts, getYoastMeta } from "@/lib/wordpress";
import { getCategoryPair } from "@/lib/urls";
import { isMainCategory } from "@/lib/categories";
import ArticleLayout from "@/components/layout/ArticleLayout";
import type { Category } from "@/lib/types";
import { buildMetadata, stripHtml, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { extractArticleHeader } from "@/lib/articleHeader";
import { getRedakteurForSlug } from "@/lib/redakteure";
import { JsonLd, articleSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { getArticleToolData, EMPTY_TOOL_DATA } from "@/lib/articleToolData";

export const revalidate = 3600;

type RouteParams = { kategorie: string; sub: string; slug: string };

// Full-SSG aller Beiträge — der frühere 404-Backe-Effekt kam vom IONOS-Build-Overload
// (200+ Einzel-getPostBySlug). Jetzt lädt getPostBySlug beim Build aus einer gebündelten
// Map (~8 Abfragen/Worker) → IONOS hält durch → vollständiges Prerender ohne 404.
// dynamicParams bleibt default true (Legacy on-demand); Freshness via save_post-Revalidate.
export async function generateStaticParams(): Promise<RouteParams[]> {
  try {
    const posts = await getAllPosts();
    return posts.map((p) => {
      const { main, sub } = getCategoryPair(p.categories);
      return { kategorie: main, sub, slug: p.slug };
    });
  } catch (e) {
    console.error("[article generateStaticParams] failed:", e);
    return [];
  }
}

export async function generateMetadata(
  props: { params: Promise<RouteParams> }
): Promise<Metadata> {
  const params = await props.params;
  // Yoast-SEO-Meta (von Redakteuren gepflegt) hat Vorrang vor Content-Ableitung.
  const [post, yoast] = await Promise.all([
    getPostBySlug(params.slug).catch(() => null),
    getYoastMeta(params.slug, "posts").catch(() => null),
  ]);
  if (!post) return { title: `Nicht gefunden – ${SITE_NAME}` };

  const mainCategory = post.categories?.nodes?.find((c: Category) => isMainCategory(c.slug));
  // Titel/Description: zuerst Yoast (Redaktions-optimiert), sonst WP-Titel + Content-<p>/Excerpt.
  const header = extractArticleHeader(post.content);
  return buildMetadata({
    title: yoast?.title || `${post.title} – ${SITE_NAME}`,
    description: yoast?.description || stripHtml(header?.description || post.excerpt || post.beitragFelder?.beitragUntertitel),
    path: `/${params.kategorie}/${params.sub}/${params.slug}`,
    image: post.featuredImage?.node?.sourceUrl,
    imageAlt: post.featuredImage?.node?.altText || post.title,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.date,
    ...(mainCategory && {}),
  });
}

export default async function BeitragPage(props: {
  params: Promise<RouteParams>;
}) {
  const params = await props.params;
  // KEIN .catch(() => null): ein transienter Build-Fehler (IONOS) würde sonst zu notFound()
  // = statisch gebackenem 404. So propagiert er → Next wiederholt die Seite. Zur Laufzeit
  // fängt getPostBySlugSingle Fehler intern ab und liefert null (→ echtes 404 nur bei „nicht da").
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Konvention v2: Titel = WP-Titel-Feld; Beschreibung = Content-<p> (nach 1. h2).
  const header = extractArticleHeader(post.content);

  // Finanztool-Daten serverseitig vorladen (ISR) → Rechner/Checkliste/Dokumente +
  // Tool-Überschriften sofort, ohne Client-Fetch/Layoutshift. Vergleich-Widgets
  // bleiben client-lazy. Fehler → leeres Set, Komponenten fallen auf Client-Fetch zurück.
  const toolData = await getArticleToolData(post.content).catch(() => EMPTY_TOOL_DATA);

  // Find main category (slug is in MAIN_CATEGORY_SLUGS) and subcategory
  const mainCategory = post.categories?.nodes?.find((cat: Category) => isMainCategory(cat.slug));

  // Subcategory = matching the URL param, or first non-main category
  const category = post.categories?.nodes?.find(
    (cat: Category) => cat.slug === params.sub
  ) || post.categories?.nodes?.find(
    (cat: Category) => !isMainCategory(cat.slug)
  ) || post.categories?.nodes[0];

  // Format date as "02. März 2026"
  const formattedDate = new Date(post.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const articlePath = `/${params.kategorie}/${params.sub}/${params.slug}`;
  const breadcrumbItems = [
    { name: "Startseite", path: "/" },
    ...(mainCategory ? [{ name: mainCategory.name, path: `/${params.kategorie}` }] : []),
    ...(category ? [{ name: category.name, path: `/${params.kategorie}/${params.sub}` }] : []),
    { name: post.title, path: articlePath },
  ];

  return (
    <>
      <JsonLd data={articleSchema({
        headline: post.title,
        description: stripHtml(header?.description || post.excerpt),
        url: absoluteUrl(articlePath),
        image: post.featuredImage?.node?.sourceUrl,
        datePublished: post.date,
        dateModified: post.date,
        authorName: post.author?.node?.name,
        section: mainCategory?.name,
      })} />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
    <ArticleLayout
      title={post.title}
      subtitle={post.beitragFelder?.beitragUntertitel}
      excerpt={post.excerpt}
      featuredImage={post.featuredImage?.node}
      category={category}
      mainCategory={params.kategorie}
      mainCategoryName={mainCategory?.name}
      content={post.content}
      contentTableOfContents={!!post.content}
      toolData={toolData}
      slug={params.slug}
      author={(() => {
        // Redaktions-Roster (Übergang bis Backend-Auswahl): deterministisch je Slug.
        const r = getRedakteurForSlug(post.slug || params.slug);
        return { name: r.name, role: r.role, date: formattedDate, imageUrl: r.imageUrl, colorVariant: r.colorVariant };
      })()}
    />
    </>
  );
}
