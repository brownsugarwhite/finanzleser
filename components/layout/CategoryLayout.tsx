import InlineSVG from "@/components/ui/InlineSVG";
import Footer from "./Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ArticleList from "@/components/sections/ArticleList";
import type { Post } from "@/lib/types";

function SmallSpark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
    </svg>
  );
}

function LargeSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
    </svg>
  );
}

type CategoryLayoutProps = {
  title?: string;
  titleSlug?: string;
  description?: string;
  image?: string;
  mainCategoryName?: string;
  mainCategorySlug?: string;
  children?: React.ReactNode;
  posts?: Post[];
};

export default function CategoryLayout({ title, titleSlug, description, image, mainCategoryName, mainCategorySlug, children, posts }: CategoryLayoutProps) {
  const breadcrumbItems = mainCategorySlug && titleSlug ? [
    { label: "Home", href: "/" },
    { label: mainCategoryName || mainCategorySlug, href: `/${mainCategorySlug}` },
    { label: title || titleSlug, href: `/${mainCategorySlug}/${titleSlug}` }
  ] : undefined;
  return (
    <>
      <main className="min-h-screen bg-white">
        {/* Dekorativer Doppel-Frame */}
        <div style={{
          width: "100%",
          height: "200vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* Visual Platzhalter */}
          <div style={{
            width: "80%",
            height: 250,
            background: "rgba(0, 0, 0, 0.06)",
            marginBottom: 40,
          }} />
          {/* H1 mit Sparks und Linien — sticky über den Frames */}
          {title && (
            <div style={{
              position: "sticky",
              top: 100,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: 0,
              width: "100vw",
              padding: "0 40px",              
            }}>
              {/* Linie links */}
              <div style={{
                flex: 1,
                height: 1,
                background: "var(--color-text-primary)",
              }} />
              {/* Sparks links */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                <SmallSpark />
                <LargeSpark />
              </div>
              {/* Titel */}
              <h1 className="category-title" style={{
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: 42,
                color: "var(--color-text-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                margin: 0,
                padding: "0 8px",
              }}>
                {title}
              </h1>
              {/* Sparks rechts */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                <LargeSpark />
                <SmallSpark />
              </div>
              {/* Linie rechts */}
              <div style={{
                flex: 1,
                height: 1,
                background: "var(--color-text-primary)",
              }} />
            </div>
          )}
          <div style={{
            width: "80%",
            height: "100vh",
            position: "sticky",
            top: 120,
            background: "transparent",
            border: "1px solid var(--color-text-medium)",
            borderRadius: 100,
            zIndex: 5,
          }} />
          <div style={{
            width: "90%",
            height: "100vh",
            position: "sticky",
            top: 200,
            background: "var(--color-bg-page)",
            border: "1px solid var(--color-text-medium)",
            borderRadius: 120,
            zIndex: 4,
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-12" style={{ paddingTop: 23 }}>
          <Breadcrumb items={breadcrumbItems} />

          {/* Titelbild */}
          {image && (
            <div style={{ width: '100%', maxHeight: '300px', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <InlineSVG
                src={image}
                alt={title || ''}
                style={{ maxWidth: '400px', width: '100%', height: '100%', maxHeight: '300px' }}
              />
            </div>
          )}

          {title && <h1 className="text-3xl font-bold mb-4">{title}</h1>}
          {description && (
            <p style={{
              fontFamily: 'Merriweather, serif',
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'var(--color-text-medium)',
              marginBottom: '32px',
            }}>
              {description}
            </p>
          )}

          {/* Posts Liste */}
          {posts && posts.length > 0 && (
            <ArticleList posts={posts} mainCategorySlug={mainCategorySlug} />
          )}

          {/* Children (wenn vorhanden) */}
          {children}

          {/* Empty state */}
          {posts && posts.length === 0 && !children && (
            <div className="text-center py-12 text-gray-400">
              <p>Keine Beiträge gefunden</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
