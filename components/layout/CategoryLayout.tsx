import Footer from "./Footer";
import CategoryHeader from "./CategoryHeader";
import PageAds from "./PageAds";
import ArticleList from "@/components/sections/ArticleList";
import FinanztoolGrid from "@/components/sections/FinanztoolGrid";
import CategoryDokumente from "@/components/sections/CategoryDokumente";
import { getSiteSettings } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

type CategoryLayoutProps = {
  title?: string;
  titleSlug?: string;
  description?: string;
  image?: string;
  imageWide?: string;
  mainCategoryName?: string;
  mainCategorySlug?: string;
  children?: React.ReactNode;
  posts?: Post[];
};

export default async function CategoryLayout({ title, titleSlug, description, imageWide, mainCategoryName, mainCategorySlug, children, posts }: CategoryLayoutProps) {
  const breadcrumbItems = mainCategorySlug && titleSlug ? [
    { label: "Home", href: "/" },
    { label: mainCategoryName || mainCategorySlug, href: `/${mainCategorySlug}` },
    { label: title || titleSlug, href: `/${mainCategorySlug}/${titleSlug}` }
  ] : undefined;

  const settings = await getSiteSettings();

  return (
    <>
      <main className="min-h-screen bg-white category-page">
        <CategoryHeader
          title={title}
          description={description}
          breadcrumbItems={breadcrumbItems}
          fadeSectionId="category-articles-section"
          imageWide={imageWide}
        />

        {/* Section trägt die ID für SparkHeading's Scroll-Fade-Trigger.
            Full-width (Rails sitzen in den Rändern); PageAds zentriert die Liste
            auf ~1040px und startet die Rails unter dem Heading. */}
        <section
          id="category-articles-section"
          className="scalable-landing pb-12"
          style={{ paddingTop: 23 }}
        >
          {/* Content exakt 728px (= Leaderboard) + 23px Gap zu den 300/160er-Rails. */}
          <PageAds
            ads={settings.ads.kategorie}
            contentWidth={728}
            topFormat="leaderboard"
            railGap={46}
            contentClassName="page-shell-col--exact"
          >
            {/* Posts Liste */}
            {posts && posts.length > 0 && (
              <>
                <h2 className="category-list-heading">Ratgeber</h2>
                <ArticleList posts={posts} mainCategorySlug={mainCategorySlug} />
              </>
            )}

            {/* Children (wenn vorhanden) */}
            {children}

            {/* Empty state */}
            {posts && posts.length === 0 && !children && (
              <div className="text-center py-12 text-gray-400">
                <p>Keine Beiträge gefunden</p>
              </div>
            )}

            {/* Passende Finanztools nach den Artikeln (heuristisch kategoriegefiltert). */}
            <FinanztoolGrid
              mainCategorySlug={mainCategorySlug}
              mainCategoryName={mainCategoryName}
              categoryName={title}
              categorySlug={titleSlug}
            />
          </PageAds>

          {/* Dokumente exakt wie im Artikel — über die volle Breite (Content + Rails),
              unterhalb des Rail-Bereichs. */}
          <CategoryDokumente
            mainCategorySlug={mainCategorySlug}
            mainCategoryName={mainCategoryName}
            categoryName={title}
            categorySlug={titleSlug}
          />
        </section>
      </main>
      <div className="scalable-landing">
        <Footer />
      </div>
    </>
  );
}
