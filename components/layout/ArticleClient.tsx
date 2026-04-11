"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import InlineSVG from "@/components/ui/InlineSVG";
import Author from "@/components/ui/Author";
import Spacer from "@/components/ui/Spacer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ArticleSidebar from "./ArticleSidebar";
import ArticleTableOfContents from "@/components/sections/ArticleTableOfContents";
import ArticleContent from "@/components/sections/ArticleContent";

function WideContainer({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", paddingRight: collapsed ? 120 : 430 }}>
      <div style={{ width: "100%", minWidth: "80vw", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "80vw" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function CenteredContainer({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", paddingRight: collapsed ? 120 : 430 }}>
      <div style={{ width: "100%", minWidth: 550, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 750 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { WideContainer, CenteredContainer };

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

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const breadcrumbItems = mainCategory && category ? [
    { label: "Home", href: "/" },
    { label: mainCategoryName || mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1), href: `/${mainCategory}` },
    { label: category.name, href: `/${mainCategory}/${category.slug}` }
  ] : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
      {/* sidebar_container */}
      {content && (
        <ArticleSidebar
          content={content}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      )}

      {/* article_container */}
      <article style={{ width: "100%", display: "flex", flexDirection: "column" }}>
        {/* Breadcrumb */}
        <WideContainer collapsed={collapsed}>
          <Breadcrumb items={breadcrumbItems} />
        </WideContainer>

        {/* Header: Visual links, Text rechts */}
        <WideContainer collapsed={collapsed}>
          <div style={{ width: "100%", display: "flex", flexDirection: "row", gap: "36px" }}>
            {/* Visual links */}
            <div style={{ flexShrink: 0, width: "50%", height: "100%" }}>
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
            </div>

            {/* Text rechts */}
            <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {title && (
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
              )}
              {subtitle && (
                <h2 data-toc-exclude className="font-bold mb-4" style={{ fontSize: "42px", lineHeight: "1.3em" }}>{subtitle}</h2>
              )}
              {excerpt && (
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
              )}
              {/* Lesedauer / Share */}
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
            </div>
          </div>
          <div style={{ marginTop: 50, marginBottom: 23 }}>
            <Spacer noMargin />
          </div>
        </WideContainer>

        {/* Centered: Autor, TOC */}
        <CenteredContainer collapsed={collapsed}>
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
        </CenteredContainer>

        {/* Artikel-Inhalt: alternating wide/centered Container */}
        {content && content.trim() ? (
          <ArticleContent content={content} collapsed={collapsed} />
        ) : (
          <CenteredContainer collapsed={collapsed}>
            <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
              <p className="text-gray-600 text-lg">Inhalt folgt in Kürze.</p>
            </div>
          </CenteredContainer>
        )}
      </article>
    </div>
  );
}
