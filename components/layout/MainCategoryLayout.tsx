import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { Post } from "@/lib/types";

interface MainCategoryLayoutProps {
  name: string;
  slug: string;
  categoryChildren: Array<{ name: string; slug: string; count: number }>;
  posts: Post[];
}

export default function MainCategoryLayout({
  name,
  slug,
  categoryChildren,
  posts,
}: MainCategoryLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <div className="bg-gray-50 border-b border-gray-200 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <Breadcrumb />
            <h1 className="text-5xl font-bold mb-4">{name}</h1>
            <p className="text-lg text-gray-600">
              Entdecken Sie unsere Inhalte zum Thema {name.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
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
                      {post.featuredImage?.node?.sourceUrl ? (
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Kein Bild</span>
                        </div>
                      )}

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
