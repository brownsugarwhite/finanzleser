import InlineSVG from "@/components/ui/InlineSVG";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ArticleList from "@/components/sections/ArticleList";
import type { Post } from "@/lib/types";

type CategoryLayoutProps = {
  title?: string;
  titleSlug?: string;
  description?: string;
  image?: string;
  mainCategoryName?: string;
  mainCategorySlug?: string;
  children?: React.ReactNode;
  posts?: Post[];
};

export default function CategoryLayout({ title, titleSlug, description, image, mainCategoryName, mainCategorySlug, children, posts }: CategoryLayoutProps) {
  const breadcrumbItems = mainCategorySlug && titleSlug ? [
    { label: "Home", href: "/" },
    { label: mainCategoryName || mainCategorySlug, href: `/${mainCategorySlug}` },
    { label: title || titleSlug, href: `/${mainCategorySlug}/${titleSlug}` }
  ] : undefined;
  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12" style={{ paddingTop: 23 }}>
          <Breadcrumb items={breadcrumbItems} />

          {/* Titelbild */}
          {image && (
            <div style={{ width: '100%', maxHeight: '300px', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <InlineSVG
                src={image}
                alt={title || ''}
                style={{ maxWidth: '400px', width: '100%', height: '100%', maxHeight: '300px' }}
              />
            </div>
          )}

          {title && <h1 className="text-3xl font-bold mb-4">{title}</h1>}
          {description && (
            <p style={{
              fontFamily: 'Merriweather, serif',
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'var(--color-text-medium)',
              marginBottom: '32px',
            }}>
              {description}
            </p>
          )}

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
        </div>
      </main>
      <Footer />
    </>
  );
}
