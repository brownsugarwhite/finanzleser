import InlineSVG from "@/components/ui/InlineSVG";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ArticleListItem from "@/components/ui/ArticleListItem";
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
    { label: mainCategoryName || mainCategorySlug, href: `/${mainCategorySlug}` },
    { label: title || titleSlug, href: `/${mainCategorySlug}/${titleSlug}` }
  ] : undefined;
  return (
    <>
      <Header />
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              {posts.map((post, index) => {
                const category = post.categories?.nodes?.[0];
                const postLink = mainCategorySlug && category
                  ? `/${mainCategorySlug}/${category.slug}/${post.slug}`
                  : `/${category?.slug || "beitraege"}/${post.slug}`;
                return (
                  <div
                    key={post.id}
                    style={{
                      width: '100vw',
                      marginLeft: 'calc(-50vw + 50%)',
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '16px 24px',
                      position: 'sticky',
                      top: 0,
                      zIndex: index + 1,
                    }}
                  >
                    <ArticleListItem
                      post={post}
                      href={postLink}
                      bookmarkType={index < 2 ? 'neu' : undefined}
                    />
                  </div>
                );
              })}
            </div>
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
