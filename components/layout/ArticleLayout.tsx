import Footer from "./Footer";
import Link from "next/link";
import InlineSVG from "@/components/ui/InlineSVG";
import Author from "@/components/ui/Author";
import Spacer from "@/components/ui/Spacer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import RechnerEmbed from "@/components/rechner/RechnerEmbed";

type ArticleLayoutProps = {
  children: React.ReactNode;
  title?: string;
  excerpt?: string;
  featuredImage?: { sourceUrl: string; altText?: string };
  category?: { name: string; slug: string };
  mainCategory?: string; // Hauptkategorie slug
  mainCategoryName?: string; // Hauptkategorie name
  sidebar?: React.ReactNode;
  contentTableOfContents?: React.ReactNode;
  beitragRechner?: Array<{ slug: string; title: string }>;
  author?: {
    name: string;
    role?: string;
    date?: string;
    imageUrl?: string;
    colorVariant?: 1 | 2 | 3 | 4 | 5 | 6;
  };
};

export default function ArticleLayout({ children, title, excerpt, featuredImage, category, mainCategory, mainCategoryName, sidebar, contentTableOfContents, beitragRechner, author }: ArticleLayoutProps) {
  const breadcrumbItems = mainCategory && category ? [
    { label: mainCategoryName || mainCategory, href: `/${mainCategory}` },
    { label: category.name, href: `/${mainCategory}/${category.slug}` }
  ] : undefined;
  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="pb-12" style={{ paddingTop: 23 }}>
          <div className="flex">
            {/* Sidebar Left (TOC + DotLine) */}
            {sidebar}

            {/* Article Content */}
            <div style={{ width: "100%", maxWidth: "850px", flexShrink: 0, margin: "0 auto", padding: "0 50px" }}>
              <Breadcrumb items={breadcrumbItems} />
              {category && mainCategory && (
                <Link
                  href={`/${mainCategory}/${category.slug}`}
                  className="mb-2 inline-block transition hover:opacity-80"
                  style={{
                    color: "var(--color-brand-secondary)",
                    fontFamily: "Merriweather, serif",
                    fontSize: "23px",
                    fontStyle: "italic",
                  }}
                >
                  {category.name}
                </Link>
              )}
              {title && <h1 className="font-bold mb-4" style={{ fontSize: "42px", lineHeight: "1.3em" }}>{title}</h1>}
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
                      <img src="/icons/time_icon.svg" alt="" style={{ width: 13, height: 13, opacity: 0.5 }} />
                      <span>{children ? Math.ceil(children.toString().split(/\s+/).length / 200) : 1} min Lesedauer</span>
                    </div>

                    {/* Share */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ fontSize: "14px" }}>Teilen</span>
                      <a
                        href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 transition"
                        title="Auf Facebook teilen"
                      >
                        <img src="/icons/facebook_icon.svg" alt="" style={{ width: 20, height: 20 }} />
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(title || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-400 transition"
                        title="Auf Twitter teilen"
                      >
                        <img src="/icons/twitter_icon.svg" alt="" style={{ width: 16, height: 16 }} />
                      </a>
                    </div>
                  </div>

                  {/* Visual */}
                  <div className="w-full h-96 mb-2 flex items-center justify-center rounded overflow-hidden bg-gray-50">
                    <InlineSVG
                      src={featuredImage.sourceUrl}
                      alt={featuredImage.altText || title || "Featured image"}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>

                  {/* Image Caption/Alt Text */}
                  {featuredImage.altText && (
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--color-text-medium)",
                        marginBottom: "1.5em",
                      }}
                    >
                      {featuredImage.altText}
                    </p>
                  )}
                </div>
              )}
              {author && (
                <div className="pt-6 mb-8">
                  <Author
                    name={author.name}
                    role={author.role}
                    date={author.date}
                    imageUrl={author.imageUrl}
                    colorVariant={author.colorVariant}
                  />
                </div>
              )}
              {contentTableOfContents}
              <Spacer />
              <article>{children}</article>
              {beitragRechner && beitragRechner.length > 0 && (
                <div style={{ marginTop: "60px" }}>
                  {beitragRechner.map((rechner) => (
                    <div key={rechner.slug}>
                      <RechnerEmbed slug={rechner.slug} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Right — flexibel, schrumpft */}
            <div className="block" style={{ width: "100%", flexShrink: 1 }} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
