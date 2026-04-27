import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Spacer from "@/components/ui/Spacer";
import SearchHero from "@/components/sections/SearchHero";
import QuickAccessButtons from "@/components/sections/QuickAccessButtons";
import SearchResultsGrid from "@/components/sections/SearchResultsGrid";
import ScrollToResults from "@/components/sections/ScrollToResults";
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
      <main className="min-h-screen" style={{ backgroundColor: "var(--color-bg-page)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Suche", href: "/suche" }]} />
        </div>

        <section className="max-w-7xl mx-auto px-6 pb-12">
          <SearchHero initialQuery={query} />
          <QuickAccessButtons />
          <ScrollToResults query={query} />

          <div style={{ position: "relative", zIndex: 1, marginTop: 56, marginBottom: 8 }}>
            <Spacer />
          </div>

          {/* Results */}
          {query && results.length > 0 && (
            <div id="search-results" className="mt-8" style={{ scrollMarginTop: 24 }}>
              <p className="text-gray-600 mb-8" style={{ fontSize: 16 }}>
                {results.length}{" "}
                {results.length === 1 ? "Ergebnis" : "Ergebnisse"} für{" "}
                <span
                  style={{
                    fontFamily: "Merriweather, serif",
                    fontSize: 23,
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  &ldquo;{query}&rdquo;
                </span>
              </p>

              <SearchResultsGrid posts={results} />
            </div>
          )}

          {query && results.length === 0 && (
            <div id="search-results" className="text-center py-12 mt-8" style={{ scrollMarginTop: 24 }}>
              <p className="text-lg text-gray-600">
                Keine Ergebnisse für{" "}
                <span
                  style={{
                    fontFamily: "Merriweather, serif",
                    fontSize: 23,
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  &ldquo;{query}&rdquo;
                </span>{" "}
                gefunden.
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
