"use client";

import { useState, useEffect } from "react";
import InlineSVG from "@/components/ui/InlineSVG";
import Author from "@/components/ui/Author";
import Spacer from "@/components/ui/Spacer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ArticleSidebar from "./ArticleSidebar";
import ArticleElementWrapper from "./ArticleElementWrapper";
import ArticleTableOfContents from "@/components/sections/ArticleTableOfContents";
import ArticleContent from "@/components/sections/ArticleContent";
import PdfPreview from "@/components/ui/PdfPreview";
import MobileTocIndicator from "./MobileTocIndicator";
import MobileTocOverlay from "./MobileTocOverlay";
import { useArticleToc } from "@/lib/hooks/useArticleToc";

type ArticleClientProps = {
  title?: string;
  subtitle?: string;
  excerpt?: string;
  featuredImage?: { sourceUrl: string; altText?: string };
  category?: { name: string; slug: string };
  mainCategory?: string;
  mainCategoryName?: string;
  content?: string;
  contentTableOfContents?: boolean;
  author?: {
    name: string;
    role?: string;
    date?: string;
    imageUrl?: string;
    colorVariant?: 1 | 2 | 3 | 4 | 5 | 6;
  };
};

export default function ArticleClient({
  title,
  subtitle,
  excerpt,
  featuredImage,
  category,
  mainCategory,
  mainCategoryName,
  content,
  contentTableOfContents,
  author,
}: ArticleClientProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const toc = useArticleToc();

  useEffect(() => {
    setCurrentUrl(window.location.href);
    const parts = window.location.pathname.split("/").filter(Boolean);
    setPageSlug(parts[parts.length - 1] || "");
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const breadcrumbItems = mainCategory && category ? [
    { label: "Home", href: "/" },
    { label: mainCategoryName || mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1), href: `/${mainCategory}` },
    { label: category.name, href: `/${mainCategory}/${category.slug}` }
  ] : undefined;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Absolut positioniertes TOC (aus dem Flow raus) — Desktop */}
      {content && (
        <ArticleSidebar
          items={toc.items}
          activeId={toc.activeId}
          scrollProgress={toc.scrollProgress}
          scrollToId={toc.scrollToId}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      )}

      {/* Mobile-only: Indicator + Overlay (Sidebar ist auf Mobile via CSS versteckt) */}
      {content && (
        <>
          <MobileTocIndicator
            items={toc.items}
            activeId={toc.activeId}
            scrollProgress={toc.scrollProgress}
            isOpen={tocOpen}
            onToggle={() => setTocOpen((v) => !v)}
          />
          <MobileTocOverlay
            items={toc.items}
            activeId={toc.activeId}
            scrollProgress={toc.scrollProgress}
            scrollToId={toc.scrollToId}
            isOpen={tocOpen}
            onClose={() => setTocOpen(false)}
          />
        </>
      )}

      {/* Main-Wrapper: Folge von Element-Wrappern */}
      <article style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        {/* Breadcrumb + Hero-Block + Spacer (zusammen in einem Wrapper) */}
        <ArticleElementWrapper variant="wide" collapsed={collapsed}>
          <Breadcrumb items={breadcrumbItems} />
          {(() => {
            const titleEl = title ? (
              <h1
                className="article-title"
                style={{
                  color: "var(--color-brand-secondary)",
                  fontFamily: "Merriweather, serif",
                  fontSize: "23px",
                  fontStyle: "italic",
                  marginBottom: "8px",
                  display: "inline-block",
                }}
              >
                {title}
              </h1>
            ) : null;

            const subtitleEl = subtitle ? (
              <h2 data-toc-exclude className="article-subtitle font-bold mb-4" style={{ fontSize: isMobile ? "32px" : "42px", lineHeight: "1.3em" }}>{subtitle}</h2>
            ) : null;

            const visualEl = (
              <>
                {featuredImage?.sourceUrl ? (
                  <div className="h-96 flex items-center justify-center rounded overflow-hidden bg-gray-50">
                    <InlineSVG
                      src={featuredImage.sourceUrl}
                      alt={featuredImage.altText || title || "Featured image"}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="h-96 rounded overflow-hidden" style={{ backgroundColor: "rgba(0, 0, 0, 0.08)" }} />
                )}
                {featuredImage?.altText && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--color-text-medium)",
                      marginTop: "8px",
                    }}
                  >
                    {featuredImage.altText}
                  </p>
                )}
              </>
            );

            const excerptEl = excerpt ? (
              <p
                className="mb-8 text-gray-600"
                style={{
                  fontFamily: "Merriweather, serif",
                  fontSize: "18px",
                  fontWeight: "400",
                }}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const text = excerpt.replace(/<[^>]*>/g, "");
                    if (text.length <= 200) return text;
                    const truncated = text.slice(0, 200).replace(/\s+\S*$/, "");
                    return truncated + " ...";
                  })(),
                }}
              />
            ) : null;

            const metaEl = (
              <div className="flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-1 text-sm" style={{ fontSize: "14px" }}>
                  <img src="/icons/time_icon.svg" alt="" style={{ width: 13, height: 13, opacity: 0.5 }} />
                  <span>{content ? Math.ceil(content.split(/\s+/).length / 200) : 1} min Lesedauer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ fontSize: "14px" }}>Teilen</span>
                  <a
                    href={`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-600 transition"
                    title="Auf Facebook teilen"
                  >
                    <img src="/icons/facebook_icon.svg" alt="" style={{ width: 20, height: 20 }} />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-400 transition"
                    title="Auf Twitter teilen"
                  >
                    <img src="/icons/twitter_icon.svg" alt="" style={{ width: 16, height: 16 }} />
                  </a>
                </div>
              </div>
            );

            if (isMobile) {
              return (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {titleEl}
                  {subtitleEl}
                  <div>{visualEl}</div>
                  {excerptEl}
                  {metaEl}
                </div>
              );
            }

            return (
              <div style={{ width: "100%", display: "flex", flexDirection: "row", gap: "36px" }}>
                {/* Visual links */}
                <div style={{ flexShrink: 0, width: "50%", height: "100%" }}>
                  {visualEl}
                </div>
                {/* Text rechts */}
                <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {titleEl}
                  {subtitleEl}
                  {excerptEl}
                  {metaEl}
                </div>
              </div>
            );
          })()}
          <div style={{ marginTop: 50, marginBottom: 23 }}>
            <Spacer noMargin />
          </div>
        </ArticleElementWrapper>

        {/* Autor + inline-TOC + Trenner */}
        <ArticleElementWrapper variant="centered" collapsed={collapsed}>
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
          {contentTableOfContents && content && (
            <ArticleTableOfContents content={content} />
          )}
          <div style={{ width: "100%", height: "1px", background: "var(--color-text-medium)" }} />
        </ArticleElementWrapper>

        {/* Artikel-Inhalt: je Chunk ein ElementWrapper */}
        {content && content.trim() ? (
          <>
            <ArticleContent content={content} collapsed={collapsed} currentSlug={pageSlug} />
            {pageSlug && (
              <ArticleElementWrapper variant="centered" collapsed={collapsed}>
                <PdfPreview slug={pageSlug} />
              </ArticleElementWrapper>
            )}
          </>
        ) : (
          <ArticleElementWrapper variant="centered" collapsed={collapsed}>
            <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
              <p className="text-gray-600 text-lg">Inhalt folgt in Kürze.</p>
            </div>
          </ArticleElementWrapper>
        )}
      </article>
    </div>
  );
}
