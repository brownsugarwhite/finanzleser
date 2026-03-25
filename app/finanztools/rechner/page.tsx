import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPostsAndCPTsByCategory } from "@/lib/wordpress";

export default async function RechnerPage() {
  const posts = await getPostsAndCPTsByCategory("rechner");

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-6">Finanzrechner</h1>
          <div className="flex items-center justify-between mb-12">
            <p className="text-lg text-gray-600">
              Unsere Finanzrechner helfen Ihnen bei wichtigen finanziellen Entscheidungen.
            </p>
            <Link
              href="/finanztools/rechner-uebersicht"
              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold whitespace-nowrap ml-4"
            >
              Alle 17 Rechner ansehen →
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const category = post.categories?.nodes?.[0];
                const mainCategory = post.categories?.nodes?.find(
                  (cat: any) => cat.parent === null || cat.parent === 0
                );
                const mainCategorySlug = mainCategory?.slug || "finanztools";
                const subCategorySlug = category?.slug || "rechner";
                const postLink = `/${mainCategorySlug}/${subCategorySlug}/${post.slug}`;

                return (
                  <article
                    key={post.id}
                    className="flex flex-col border border-gray-200 rounded overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Image */}
                    {post.featuredImage?.node?.sourceUrl ? (
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Kein Bild</span>
                      </div>
                    )}

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
                        Öffnen →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                Keine Rechner verfügbar.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
