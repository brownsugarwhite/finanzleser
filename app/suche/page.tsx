import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { searchPosts } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";

  let results: Post[] = [];
  if (query) {
    results = await searchPosts(query);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Breadcrumb items={[{ label: "Suche", href: "/suche" }]} />
          {/* Search Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-6">Suche</h1>

            {/* Search Form */}
            <form action="/suche" method="get" className="flex gap-3 max-w-lg">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Nach Beiträgen suchen..."
                className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-800 transition flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Suchen
              </button>
            </form>
          </div>

          {/* Results */}
          {query && results.length > 0 && (
            <>
              <p className="text-gray-600 mb-8">
                {results.length} {results.length === 1 ? "Ergebnis" : "Ergebnisse"} für &quot;<strong>{query}</strong>&quot;
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((post) => {
                  const category = post.categories?.nodes?.[0];
                  // Finde Parent-Kategorie (Hauptkategorie)
                  const mainCategory = post.categories?.nodes?.find(
                    (cat: any) => cat.parent === null || cat.parent === 0
                  );
                  const mainCategorySlug = mainCategory?.slug || "beitraege";
                  const subCategorySlug = category?.slug || "allgemein";
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
                          Lesen →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* No Results */}
          {query && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                Keine Ergebnisse für &quot;<strong>{query}</strong>&quot; gefunden.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Versuchen Sie mit anderen Suchbegriffen.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!query && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                Geben Sie einen Suchbegriff ein, um zu beginnen.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
