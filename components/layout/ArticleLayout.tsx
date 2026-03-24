import Header from "./Header";
import Footer from "./Footer";
import Link from "next/link";
import Image from "next/image";

type ArticleLayoutProps = {
  children: React.ReactNode;
  title?: string;
  excerpt?: string;
  featuredImage?: { sourceUrl: string; altText?: string };
  category?: { name: string; slug: string };
  mainCategory?: string; // Hauptkategorie slug
  sidebar?: React.ReactNode;
};

export default function ArticleLayout({ children, title, excerpt, featuredImage, category, mainCategory, sidebar }: ArticleLayoutProps) {
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
              {featuredImage?.sourceUrl && (
                <div className="mb-8 w-full">
                  {/* Meta Info Bar */}
                  <div className="flex justify-between items-center mb-4 text-gray-600">
                    {/* Lesedauer */}
                    <div className="flex items-center gap-1 text-sm" style={{ fontSize: "14px" }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{children ? Math.ceil(children.toString().split(/\s+/).length / 200) : 1} min Lesedauer</span>
                    </div>

                    {/* Share */}
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 transition"
                        title="Auf Facebook teilen"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(title || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-400 transition"
                        title="Auf Twitter teilen"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 002.856-9.86 10.002 10.002 0 01-2.857.856 4.992 4.992 0 00-8.688 4.545 14.001 14.001 0 01-10.166-5.144 4.993 4.993 0 001.547 6.659 4.97 4.97 0 01-2.258-.616v.062a4.993 4.993 0 003.997 4.895 4.997 4.997 0 01-2.252.089 4.994 4.994 0 004.666 3.465 10.003 10.003 0 01-6.177 2.13c-.399 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative w-full h-96">
                    <Image
                      src={featuredImage.sourceUrl}
                      alt={featuredImage.altText || title || "Featured image"}
                      fill
                      className="object-cover rounded"
                      priority
                    />
                  </div>
                </div>
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
