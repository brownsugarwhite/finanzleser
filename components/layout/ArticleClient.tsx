"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
import ArticleAdRails from "./ArticleAdRails";
import AdSlot from "@/components/ui/AdSlot";
import type { ArticleAdsSettings } from "@/lib/types";
import type { ArticleToolData } from "@/lib/articleToolData";
import { ScrollTrigger } from "@/lib/gsapConfig";
import { useArticleToc } from "@/lib/hooks/useArticleToc";
import { buildArticleTocItems } from "@/lib/articleTocBuilder";
import { extractArticleHeader } from "@/lib/articleHeader";
import { notifyTargetMounted } from "@/lib/morphTransition";

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
  articleAds?: ArticleAdsSettings;
  toolData?: ArticleToolData;
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
  articleAds,
  toolData,
}: ArticleClientProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tocVisible, setTocVisible] = useState(false);
  const toc = useArticleToc();

  // Seiten-TOC erst einblenden, wenn das In-Body-TOC oben aus dem Bild gescrollt ist.
  useEffect(() => {
    const el = document.getElementById("article-inline-toc");
    if (!el) {
      setTocVisible(true); // kein In-Body-TOC (kurzer Artikel) → Sidebar dauerhaft sichtbar
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "center top+=60", // etwas früher als „genau zur Hälfte oben raus"
      onLeave: () => setTocVisible(true),
      onEnterBack: () => setTocVisible(false),
    });
    setTocVisible(el.getBoundingClientRect().top + el.offsetHeight / 2 < 60); // initialer Zustand (Reload mitten im Artikel)
    return () => st.kill();
  }, [toc.items.length]);

  // Morph-Ziele: der MorphTransitionLayer morpht Visual + fetten + kursiven Titel
  // aus der angeklickten Card hierher. Refs auf die drei Header-Elemente.
  const morphVisualRef = useRef<HTMLDivElement>(null);
  const morphSubtitleRef = useRef<HTMLHeadingElement>(null);
  const morphTitleRef = useRef<HTMLHeadingElement>(null);
  // Gate: erst NACHDEM isMobile aufgelöst ist (Layout = row vs column steht) dem
  // Morph die Ziele melden — sonst misst der Morph das Row-Layout (isMobile=false beim
  // ersten Render) und springt danach ins Column-Layout. Während des Morphs ist die
  // neue Seite verdeckt, der Row→Column-Wechsel ist also unsichtbar.
  const [morphReady, setMorphReady] = useState(false);

  // Nach dem Mount (vor Paint) dem Morph-Controller melden — no-op wenn kein
  // Morph aktiv ist (normale Navigation).
  useLayoutEffect(() => {
    if (!morphReady) return;
    notifyTargetMounted({
      visual: morphVisualRef.current,
      bold: morphSubtitleRef.current,
      italic: morphTitleRef.current,
    });
  }, [morphReady]);

  // Redaktions-Konvention v2: echter Titel = WP-Titel-Feld (title-Prop). Untertitel
  // (1. h2) + Beschreibung (<p> darunter) stehen am Content-Anfang; Body beginnt beim
  // 2. h2. Herausziehen; alte Beiträge (kein Content-h2) fallen auf die WP-Felder zurück.
  const header = useMemo(() => extractArticleHeader(content), [content]);
  const displayTitle = header?.subtitle ?? subtitle;        // fetter Untertitel (42px)
  const displayDescription = header?.description ?? excerpt; // Beschreibungszeile
  const bodyContent = header?.body ?? content;              // Fließtext ab 2. h2

  // Inline-TOC server-seitig vorbauen (pure, läuft SSR + Client identisch) → kein
  // Layout-Shift / Nachrutschen beim ersten Aufruf.
  const inlineTocItems = useMemo(() => buildArticleTocItems(bodyContent), [bodyContent]);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    const parts = window.location.pathname.split("/").filter(Boolean);
    setPageSlug(parts[parts.length - 1] || "");
  }, []);

  useLayoutEffect(() => {
    // Artikel-Layout bricht ab 1024px auf Column um (Header + Finanztools),
    // synchron mit den CSS-Breakpoints (Sidebar aus, Mobile-TOC an).
    // useLayoutEffect + setMorphReady: Layout VOR dem Morph-Mess-Zeitpunkt festlegen.
    const mql = window.matchMedia("(max-width: 1024px)");
    setIsMobile(mql.matches);
    setMorphReady(true); // jetzt steht das Layout → Morph darf die Ziele messen
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
          visible={tocVisible}
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
        <ArticleElementWrapper variant="hero" collapsed={collapsed}>
          <Breadcrumb items={breadcrumbItems} />
          {(() => {
            const titleEl = title ? (
              <h1
                ref={morphTitleRef}
                data-morph-target="article-title"
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

            const subtitleEl = displayTitle ? (
              <h2 ref={morphSubtitleRef} data-morph-target="article-subtitle" data-toc-exclude className="article-subtitle font-bold mb-4" style={{ fontSize: isMobile ? "32px" : "42px", lineHeight: "1.3em" }}>{displayTitle}</h2>
            ) : null;

            // Schmale Screens: statt fixer 384px-Höhe ein FESTES Aspect-Ratio (volle
            // Breite), das zur Auflösung passt — so morpht das Card-Visual sauber dorthin
            // (kein Stretch in eine hohe Box). Desktop bleibt bei h-96 in der 50%-Spalte.
            const visualMobileStyle: React.CSSProperties = { width: "100%", aspectRatio: "16 / 10" };
            const visualEl = (
              <>
                {featuredImage?.sourceUrl ? (
                  <div
                    ref={morphVisualRef}
                    data-morph-target="article-visual"
                    data-morph-img={featuredImage.sourceUrl}
                    className={`article-hero-visual ${isMobile ? "" : "h-96"} flex items-center justify-center rounded overflow-hidden`}
                    style={isMobile ? visualMobileStyle : undefined}
                  >
                    <InlineSVG
                      src={featuredImage.sourceUrl}
                      alt={featuredImage.altText || title || "Featured image"}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div
                    ref={morphVisualRef}
                    data-morph-target="article-visual"
                    className={`article-hero-visual ${isMobile ? "" : "h-96"} rounded overflow-hidden`}
                    style={isMobile ? { ...visualMobileStyle, backgroundColor: "rgba(0, 0, 0, 0.08)" } : { backgroundColor: "rgba(0, 0, 0, 0.08)" }}
                  />
                )}
              </>
            );

            const excerptEl = displayDescription ? (
              <p
                className="mb-8 text-gray-600"
                style={{
                  fontFamily: "Merriweather, serif",
                  fontSize: "18px",
                  fontWeight: "400",
                }}
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const text = displayDescription.replace(/<[^>]*>/g, "");
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
                  <span>{bodyContent ? Math.ceil(bodyContent.split(/\s+/).length / 200) : 1} min Lesedauer</span>
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
            <Spacer noMargin maxWidth="100%" />
          </div>
        </ArticleElementWrapper>

        {/* Relativer Bereich ab Top-Banner abwärts: trägt die absolut positionierten
            Werbe-Rails, damit sie oben NEBEN dem Leaderboard starten (nicht erst im Body). */}
        <div className="article-body-region" style={{ position: "relative", width: "100%" }}>
          <ArticleAdRails collapsed={collapsed} show={!!articleAds?.rails && !!(bodyContent && bodyContent.trim())} />

          {/* Werbung: Leaderboard unter dem Hero/Heading, vor dem Body */}
          {articleAds?.top && (
            <ArticleElementWrapper variant="wide" collapsed={collapsed}>
              <div className="article-ad-top" style={{ margin: "18px 0 32px" }}>
                <AdSlot format={isMobile ? "mobile" : "leaderboard"} />
              </div>
            </ArticleElementWrapper>
          )}

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
            {contentTableOfContents && bodyContent && (
              <ArticleTableOfContents content={bodyContent} initialItems={inlineTocItems} />
            )}
            <div style={{ width: "100%", height: "1px", background: "var(--color-text-medium)" }} />
          </ArticleElementWrapper>

          {/* Artikel-Inhalt: je Chunk ein ElementWrapper */}
          {bodyContent && bodyContent.trim() ? (
            <>
              <ArticleContent content={bodyContent} collapsed={collapsed} currentSlug={pageSlug} showMidAd={!!articleAds?.mid} toolData={toolData} />
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
        </div>
      </article>
    </div>
  );
}
