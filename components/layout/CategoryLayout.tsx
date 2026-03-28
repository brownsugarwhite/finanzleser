import Link from "next/link";
import InlineSVG from "@/components/ui/InlineSVG";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { Post, Category } from "@/lib/types";

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

          {/* Posts Grid (wenn Posts vorhanden) */}
          {posts && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const category = post.categories?.nodes?.[0];
                // Use the page's main category context for URL building
                const postLink = mainCategorySlug && category
                  ? `/${mainCategorySlug}/${category.slug}/${post.slug}`
                  : `/${category?.slug || "beitraege"}/${post.slug}`;

                return (
                  <article
                    key={post.id}
                    className="flex flex-col border border-gray-200 rounded overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Visual */}
                    <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                      {post.featuredImage?.node?.sourceUrl ? (
                        <InlineSVG
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">Kein Bild</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4">
                      {category && (
                        <span className="inline-block text-xs font-semibold text-blue-600 mb-2 w-fit">
                          {category.name}
                        </span>
                      )}

                      <h3 className="text-lg font-bold mb-2 line-clamp-2">{post.title}</h3>

                      <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                        {post.excerpt?.replace(/<[^>]*>/g, "") || ""}
                      </p>

                      <Link
                        href={postLink}
                        className="text-blue-600 text-sm font-semibold hover:text-blue-800 transition"
                      >
                        Lesen →
                      </Link>
                    </div>
                  </article>
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
