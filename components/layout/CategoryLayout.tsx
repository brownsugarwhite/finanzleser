import Footer from "./Footer";
import CategoryHeader from "./CategoryHeader";
import ArticleList from "@/components/sections/ArticleList";
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

export default function CategoryLayout({ title, titleSlug, description, imageWide, mainCategoryName, mainCategorySlug, children, posts }: CategoryLayoutProps) {
  const breadcrumbItems = mainCategorySlug && titleSlug ? [
    { label: "Home", href: "/" },
    { label: mainCategoryName || mainCategorySlug, href: `/${mainCategorySlug}` },
    { label: title || titleSlug, href: `/${mainCategorySlug}/${titleSlug}` }
  ] : undefined;
  return (
    <>
      <main className="min-h-screen bg-white">
        <CategoryHeader
          title={title}
          description={description}
          breadcrumbItems={breadcrumbItems}
          fadeSectionId="category-articles-section"
          imageWide={imageWide}
        />

        {/* Section trägt die ID für SparkHeading's Scroll-Fade-Trigger.
            Wenn das untere Ende dieser Section beim Scrollen den Viewport
            durchquert (50% → 0% von top), faded das Heading aus + bluht. */}
        <section
          id="category-articles-section"
          className="scalable-landing max-w-7xl mx-auto px-6 pb-12"
          style={{ paddingTop: 23 }}
        >
          {/* Posts Liste */}
          {posts && posts.length > 0 && (
            <ArticleList posts={posts} mainCategorySlug={mainCategorySlug} />
          )}

          {/* Children (wenn vorhanden) */}
          {children}

          {/* Empty state */}
          {posts && posts.length === 0 && !children && (
            <div className="text-center py-12 text-gray-400">
              <p>Keine Beiträge gefunden</p>
            </div>
          )}
        </section>
      </main>
      <div className="scalable-landing">
        <Footer />
      </div>
    </>
  );
}
