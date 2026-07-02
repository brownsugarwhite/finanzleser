import Footer from "./Footer";
import CategoryHeader from "./CategoryHeader";
import PageAds from "./PageAds";
import MainCategorySliderBlock from "@/components/sections/MainCategorySliderBlock";
import CategoryArticleRows from "@/components/sections/CategoryArticleRows";
import FinanztoolGrid from "@/components/sections/FinanztoolGrid";
import CategoryDokumente from "@/components/sections/CategoryDokumente";
import { getSiteSettings } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

/** „…ratgeber"-Label je Hauptkategorie (deutsche Komposita unregelmäßig). */
const RATGEBER_LABEL: Record<string, string> = {
  steuern: "Steuerratgeber",
  finanzen: "Finanzratgeber",
  versicherungen: "Versicherungsratgeber",
  recht: "Rechtsratgeber",
};

interface MainCategoryLayoutProps {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imageWide?: string;
  categoryChildren: Array<{ name: string; slug: string; count: number; image?: string }>;
  posts: Post[];
  allCategoryPosts?: Record<string, Post[]>;
}

export default async function MainCategoryLayout({
  name,
  slug,
  description,
  imageWide,
  categoryChildren,
  posts,
  allCategoryPosts = {},
}: MainCategoryLayoutProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: name, href: `/${slug}` },
  ];
  const settings = await getSiteSettings();

  const topPosts = (posts || []).slice(0, 5);
  const ratgeber = RATGEBER_LABEL[slug] || `${name}ratgeber`;

  return (
    <>
      <main className="min-h-screen bg-white main-category-page">
        <CategoryHeader
          title={name}
          description={description}
          breadcrumbItems={breadcrumbItems}
          fadeSectionId="main-category-section"
          imageWide={imageWide}
        />

        <section id="main-category-section" className="scalable-landing" style={{ paddingTop: 23 }}>
          {/* Breiteres Billboard oben, Content 970px, Rails 300/160.
              „Neuste …": 2 Reihen à 2 Ratgebern nebeneinander. */}
          {topPosts.length > 0 && (
            <PageAds
              ads={settings.ads.kategorie}
              contentWidth={970}
              topFormat="billboard"
              railGap={46}
              contentClassName="page-shell-col--exact"
            >
              <h2 className="mcat-top-heading">Neuste {ratgeber}</h2>
              <CategoryArticleRows posts={topPosts} fallbackMain={slug} rows={[2, 3]} />
            </PageAds>
          )}

          {/* Kategorie-Auswahl-Slider „Alle [Kategorie]ratgeber" mit Linie + Morph. */}
          {categoryChildren.length > 0 && (
            <MainCategorySliderBlock
              heading={`Alle ${ratgeber}`}
              categories={categoryChildren.map((c) => ({ name: c.name, slug: c.slug, count: c.count, image: c.image }))}
              parentSlug={slug}
              allCategoryPosts={allCategoryPosts}
            />
          )}
        </section>

        {/* Finanztools in eigener Rail-Region: sticky Rails links/rechts (wie oben),
            dazwischen die Finanztools — KEIN Top-Banner. */}
        <section id="main-category-tools-section" className="scalable-landing pb-12">
          <PageAds
            ads={{ ...settings.ads.kategorie, top: false }}
            contentWidth={970}
            railGap={46}
            contentClassName="page-shell-col--exact"
          >
            <FinanztoolGrid
              mainCategorySlug={slug}
              mainCategoryName={name}
              categoryName={name}
              categorySlug={slug}
              perRow={4}
            />
          </PageAds>

          {/* Dokumente IN derselben Section (wie Subkategorie → gleicher Abstand zu den
              Finanztools, kein zusätzliches Section-Padding dazwischen). */}
          <CategoryDokumente
            mainCategorySlug={slug}
            mainCategoryName={name}
            categoryName={name}
            categorySlug={slug}
          />
        </section>
      </main>
      <div className="scalable-landing">
        <Footer />
      </div>
    </>
  );
}
