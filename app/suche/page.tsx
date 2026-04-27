import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import SearchHero from "@/components/sections/SearchHero";
import QuickAccessButtons from "@/components/sections/QuickAccessButtons";
import { searchPosts } from "@/lib/wordpress";
import { isMainCategory } from "@/lib/categories";
import type { Post, Category } from "@/lib/types";

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
      <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg-page)" }}>
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Suche", href: "/suche" }]} />
        </div>

        <section className="max-w-7xl mx-auto px-6 pb-12">
          <SearchHero initialQuery={query} />
          <QuickAccessButtons />

          {/* Results */}
          {query && results.length > 0 && (
            <div className="mt-16">
              <p className="text-gray-600 mb-8">
                {results.length} {results.length === 1 ? "Ergebnis" : "Ergebnisse"} für &quot;<strong>{query}</strong>&quot;
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((post) => {
                  const mainCategory = post.categories?.nodes?.find((cat: Category) => isMainCategory(cat.slug));
                  const category = post.categories?.nodes?.find((cat: Category) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
                  const mainCategorySlug = mainCategory?.slug || "beitraege";
                  const subCategorySlug = category?.slug || "allgemein";
                  const postLink = `/${mainCategorySlug}/${subCategorySlug}/${post.slug}`;

                  return (
                    <article
                      key={post.id}
                      className="flex flex-col border border-gray-200 rounded overflow-hidden hover:shadow-lg transition"
                    >
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
                        <div className="h-48" style={{ background: "rgba(0, 0, 0, 0.05)" }} />
                      )}

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
            </div>
          )}

          {query && results.length === 0 && (
            <div className="text-center py-12 mt-16">
              <p className="text-lg text-gray-600">
                Keine Ergebnisse für &quot;<strong>{query}</strong>&quot; gefunden.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Versuchen Sie mit anderen Suchbegriffen.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
