import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getAllPosts, getYoastMeta } from "@/lib/wordpress";
import { getCategoryPair, buildPostUrl } from "@/lib/urls";
import { isMainCategory } from "@/lib/categories";
import ArticleLayout from "@/components/layout/ArticleLayout";
import type { Category } from "@/lib/types";
import { buildMetadata, stripHtml, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { extractArticleHeader } from "@/lib/articleHeader";
import { getRedakteurForSlug } from "@/lib/redakteure";
import { JsonLd, articleSchema, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { extractFaqPairs } from "@/lib/articleFaq";
import { getArticleToolData, EMPTY_TOOL_DATA } from "@/lib/articleToolData";
import { isBotPath } from "@/lib/botPaths";

export const revalidate = 86400;

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
  // Scanner-Proben nicht gegen WP abfragen (siehe lib/botPaths.ts).
  if (isBotPath(params.kategorie, params.sub, params.slug)) return { title: SITE_NAME };
  // Yoast-SEO-Meta (von Redakteuren gepflegt) hat Vorrang vor Content-Ableitung.
  const [post, yoast] = await Promise.all([
    // KEIN .catch(() => null) — analog zur Page unten (Zeile 67 ff.). Ein geschluckter
    // Fehler lieferte Metadata ohne Canonical, womit der Root-Layout-Canonical
    // (= Startseite) griff und mitgecacht wurde.
    getPostBySlug(params.slug),
    // Yoast DARF fail-open bleiben: fehlt es, greifen WP-Titel/Excerpt als Fallback.
    // Das ist eine Verbesserung, keine Existenz-Entscheidung — hier wird nichts kaputt.
    getYoastMeta(params.slug, "posts").catch(() => null),
  ]);
  // Existiert wirklich nicht → die Page unten liefert notFound(). Self-Canonical, damit
  // auch dieser Zweig nie den Startseiten-Canonical erbt.
  if (!post) {
    return buildMetadata({
      title: `Nicht gefunden – ${SITE_NAME}`,
      path: `/${params.kategorie}/${params.sub}/${params.slug}`,
      noIndex: true,
    });
  }

  // Titel/Description: zuerst Yoast (Redaktions-optimiert), sonst WP-Titel + Content-<p>/Excerpt.
  const header = extractArticleHeader(post.content);
  return buildMetadata({
    title: yoast?.title || `${post.title} – ${SITE_NAME}`,
    description: yoast?.description || stripHtml(header?.description || post.excerpt || post.untertitel),
    // Canonical IMMER aus den echten Post-Kategorien, nie aus der angefragten URL —
    // sonst bestätigt jede Pfad-Variante sich selbst als Kanon (Duplicate Content).
    path: buildPostUrl(post),
    image: post.featuredImage?.node?.sourceUrl,
    imageAlt: post.featuredImage?.node?.altText || post.title,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.modified || post.date,
  });
}

export default async function BeitragPage(props: {
  params: Promise<RouteParams>;
}) {
  const params = await props.params;

  // Scanner-Proben früh raus, bevor die WP-Queries laufen (siehe lib/botPaths.ts).
  if (isBotPath(params.kategorie, params.sub, params.slug)) {
    notFound();
  }

  // KEIN .catch(() => null): ein transienter Build-Fehler (IONOS) würde sonst zu notFound()
  // = statisch gebackenem 404. So propagiert er → Next wiederholt die Seite. Zur Laufzeit
  // fängt getPostBySlugSingle Fehler intern ab und liefert null (→ echtes 404 nur bei „nicht da").
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Nicht-kanonischer Pfad (falsche/alte Kategorie-Segmente) → 308 auf den Kanon statt
  // 200-Duplikat. Loop-sicher: buildPostUrl liefert exakt /main/sub/slug, dort greift die
  // Bedingung nicht mehr. permanentRedirect wirft NEXT_REDIRECT — nie in try/catch wrappen.
  const { main, sub } = getCategoryPair(post.categories);
  if (main !== params.kategorie || sub !== params.sub) {
    permanentRedirect(buildPostUrl(post));
  }

  // Konvention v2: Titel = WP-Titel-Feld; Beschreibung = Content-<p> (nach 1. h2).
  const header = extractArticleHeader(post.content);

  // Finanztool-Daten serverseitig vorladen (ISR) → Rechner/Checkliste/Dokumente +
  // Tool-Überschriften sofort, ohne Client-Fetch/Layoutshift. Vergleich-Widgets
  // bleiben client-lazy. Fehler → leeres Set, Komponenten fallen auf Client-Fetch zurück.
  // Slug mitgeben, damit auch das Beitrags-PDF vorgeladen wird (sonst feuerte
  // PdfPreview /api/beitrag-pdf auf jedem Artikel-View). Fallback wie in Zeile 143.
  const toolData = await getArticleToolData(post.content, post.slug || params.slug).catch(() => EMPTY_TOOL_DATA);

  // Kategorien aus den Post-Daten (nach dem Guard identisch mit main/sub der URL).
  const mainCategory = post.categories?.nodes?.find((cat: Category) => isMainCategory(cat.slug));
  const category = post.categories?.nodes?.find(
    (cat: Category) => cat.slug === sub
  ) || post.categories?.nodes[0];

  // Format date as "02. März 2026"
  const formattedDate = new Date(post.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // JSON-LD/Breadcrumbs aus den kanonischen Post-Daten, nie aus params.
  const articlePath = buildPostUrl(post);
  const faqPairs = extractFaqPairs(post.content);
  const breadcrumbItems = [
    { name: "Startseite", path: "/" },
    ...(mainCategory ? [{ name: mainCategory.name, path: `/${main}` }] : []),
    ...(category ? [{ name: category.name, path: `/${main}/${sub}` }] : []),
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
        dateModified: post.modified || post.date,
        authorName: post.author?.node?.name,
        section: mainCategory?.name,
      })} />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      {faqPairs.length > 0 && <JsonLd data={faqSchema(faqPairs)} />}
    <ArticleLayout
      title={post.title}
      subtitle={post.untertitel}
      excerpt={post.excerpt}
      featuredImage={post.featuredImage?.node}
      category={category}
      mainCategory={main}
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
