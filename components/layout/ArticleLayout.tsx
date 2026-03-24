import Header from "./Header";
import Footer from "./Footer";
import Link from "next/link";

type ArticleLayoutProps = {
  children: React.ReactNode;
  title?: string;
  excerpt?: string;
  category?: { name: string; slug: string };
  mainCategory?: string; // Hauptkategorie slug
  sidebar?: React.ReactNode;
};

export default function ArticleLayout({ children, title, excerpt, category, mainCategory, sidebar }: ArticleLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex gap-8">
            {/* Sidebar (TOC, etc.) */}
            {sidebar && <aside className="hidden lg:block w-64">{sidebar}</aside>}

            {/* Article Content */}
            <div className="flex-1 min-w-0">
              {category && mainCategory && (
                <Link
                  href={`/${mainCategory}/${category.slug}`}
                  className="mb-2 inline-block text-blue-600 hover:text-blue-800 transition"
                  style={{
                    fontFamily: "Merriweather, serif",
                    fontSize: "23px",
                    fontStyle: "italic",
                  }}
                >
                  {category.name}
                </Link>
              )}
              {title && <h1 className="text-3xl font-bold mb-4">{title}</h1>}
              {excerpt && (
                <p
                  className="mb-8 text-gray-600"
                  style={{
                    fontFamily: "Merriweather, serif",
                    fontSize: "18px",
                    fontWeight: "400",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: excerpt.replace(/<[^>]*>/g, ""),
                  }}
                />
              )}
              <article>{children}</article>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
