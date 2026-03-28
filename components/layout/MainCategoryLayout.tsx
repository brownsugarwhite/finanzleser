import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import InlineSVG from "@/components/ui/InlineSVG";
import type { Post } from "@/lib/types";

interface MainCategoryLayoutProps {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  categoryChildren: Array<{ name: string; slug: string; count: number }>;
  posts: Post[];
}

export default function MainCategoryLayout({
  name,
  slug,
  description,
  image,
  categoryChildren,
  posts,
}: MainCategoryLayoutProps) {
  const breadcrumbItems = [
    { label: name, href: `/${slug}` }
  ];
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
                alt={name}
                style={{ maxWidth: '400px', width: '100%', height: '100%', maxHeight: '300px' }}
              />
            </div>
          )}

          <h1 className="text-5xl font-bold mb-4">{name}</h1>
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

          {/* Unterkategorien */}
          {categoryChildren.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Kategorien</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryChildren.map((child) => (
                  <Link
                    key={child.slug}
                    href={`/${slug}/${child.slug}/`}
                    className="border border-gray-200 rounded p-6 hover:shadow-lg transition"
                  >
                    <h3 className="font-bold text-lg mb-2">{child.name}</h3>
                    <p className="text-sm text-gray-600">{child.count} Beiträge</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Aktuelle Beiträge */}
          {posts.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Aktuelle Beiträge</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => {
                  const category = post.categories?.nodes?.[0];
                  const categorySlug = category?.slug || slug;
                  const postLink = `/${slug}/${categorySlug}/${post.slug}`;

                  return (
                    <article
                      key={post.id}
                      className="flex flex-col border border-gray-200 rounded overflow-hidden hover:shadow-lg transition"
                    >
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

                      <div className="flex flex-col flex-1 p-4">
                        {category && (
                          <span className="inline-block text-xs font-semibold text-blue-600 mb-2 w-fit">
                            {category.name}
                          </span>
                        )}

                        <h3 className="text-lg font-bold mb-2 line-clamp-2">
                          {post.title}
                        </h3>

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
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
