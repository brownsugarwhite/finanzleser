import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostsByCategory, getCategoryWithChildren, getCategoryBySlug, getAnbieterBySlug, getRechnerBySlug, getChecklisteBySlug, getAllVergleiche } from "@/lib/wordpress";
import { MAIN_CATEGORY_SLUGS, isMainCategory } from "@/lib/categories";
import { buildPostUrl, buildSubcategoryUrl, buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl } from "@/lib/urls";
import AnbieterLayout from "@/components/layout/AnbieterLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";
import MainCategoryLayout from "@/components/layout/MainCategoryLayout";
import type { Post } from "@/lib/types";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";

export const revalidate = 86400;

// Nur die 4 Hauptkategorien prerendern (high-traffic Top-Nav). Daten-Fetches sind dank
// Build-Bulk/Memo jetzt leicht → keine „0 Rechner"-Bakes mehr. Anbieter (147, low-traffic)
// + Legacy-Slugs bleiben on-demand (dynamicParams = default true).
export async function generateStaticParams(): Promise<Array<{ kategorie: string }>> {
  return MAIN_CATEGORY_SLUGS.map((slug) => ({ kategorie: slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ kategorie: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const slug = params.kategorie;

  // Post-Slugs redirectet die Page permanent auf den Kanon → keine Post-Metadata nötig.
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

  // 0. Groß-/Kleinschreibung normalisieren (/Datenschutz, /AGB, alte Mailing-Links):
  //    Großbuchstaben-Pfade matchen die statischen lowercase-Routen nicht und landen
  //    hier → 308 auf lowercase. NICHT über next.config redirects() lösbar (matcht
  //    case-INSENSITIV → /datenschutz→/datenschutz-Loop, siehe Kommentar dort).
  if (params.kategorie !== params.kategorie.toLowerCase()) {
    permanentRedirect(`/${params.kategorie.toLowerCase()}`);
  }

  // 1. Legacy-Flach-URL eines Beitrags (/slug) → 301/308 auf die kanonische verschachtelte
  //    URL (/main/sub/slug). Direktes Rendern hier lieferte eine degradierte Seite (ohne
  //    featuredImage/Visual, abweichendes TOC-Verhalten) und erzeugte Duplicate Content.
  //    Der Redirect konsolidiert Rendering + Ranking-Signale auf den Kanon.
  const post = await getPostBySlug(params.kategorie).catch(() => null);
  if (post) {
    permanentRedirect(buildPostUrl(post));
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
  const category = await getCategoryBySlug(params.kategorie).catch(() => null);

  // Subkategorie mit Main-Parent hat ihren Kanon unter /parent/sub → 308 statt
  // Root-Duplikat (/geldanlagen vs. /finanzen/geldanlagen). isMainCategory-Guard wegen
  // WP-Quirk: Hauptkategorien hängen unter "ratgeber" und dürfen hier nicht wegredirecten
  // (werden ohnehin von Schritt 2 abgefangen). Muss VOR dem posts-Check stehen, damit
  // auch eine leere Subkategorie 308 statt 404 liefert.
  if (category?.parent?.slug && isMainCategory(category.parent.slug)) {
    permanentRedirect(buildSubcategoryUrl(category.parent.slug, params.kategorie));
  }

  const posts = await getPostsByCategory(params.kategorie).catch(() => []);
  if (!posts || posts.length === 0) {
    // 4. Letzte Stufe vor dem 404: Legacy-Flach-URL eines FINANZTOOLS (alte Beiträge,
    //    die zu Rechnern/Checklisten/Vergleichen wurden — z. B. /abfindung, /zinseszins).
    //    Diese Slugs fehlen in den generierten Redirects; generisch auflösen statt 74
    //    Einzel-Redirects pflegen. Läuft nur, wenn sonst nichts matcht (echte 404-Pfade).
    const rechner = await getRechnerBySlug(params.kategorie).catch(() => null);
    if (rechner) permanentRedirect(buildRechnerUrl(rechner.slug));
    const checkliste = await getChecklisteBySlug(params.kategorie).catch(() => null);
    if (checkliste) permanentRedirect(buildChecklisteUrl(checkliste.slug));
    const vergleiche = await getAllVergleiche().catch(() => []);
    if (vergleiche.some((v) => v.slug === params.kategorie)) {
      permanentRedirect(buildVergleichUrl(params.kategorie));
    }
    notFound();
  }

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
