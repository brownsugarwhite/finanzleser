import { Suspense } from "react";
import dynamic from "next/dynamic";
import LandingIntro from "@/components/sections/LandingIntro";
import FinanztoolsHero from "@/components/sections/FinanztoolsHero";
import SparkHeading from "@/components/ui/SparkHeading";
import Footer from "@/components/layout/Footer";
import { getLatestPosts, getCategoryWithChildren, getPostsByCategory } from "@/lib/wordpress";
import type { Post } from "@/lib/types";
import { CATEGORY_ICONS as RATGEBER_ICONS } from "@/lib/categoryIcons";

// Below-the-fold — lazy code-split, damit embla-carousel-Chunk nicht im
// Initial-Bundle der Landing landet.
const RatgeberCategoryBlock = dynamic(() => import("@/components/sections/RatgeberCategoryBlock"), {
  loading: () => <div style={{ width: "100%", minHeight: 280 }} />,
});

export const revalidate = 3600;

const RATGEBER_KATEGORIEN: Array<{ slug: string; heading: string }> = [
  { slug: "finanzen", heading: "Finanzratgeber" },
  { slug: "versicherungen", heading: "Versicherungsratgeber" },
  { slug: "steuern", heading: "Steuerratgeber" },
  { slug: "recht", heading: "Rechtsratgeber" },
];

type KategorieBlock = {
  slug: string;
  heading: string;
  children: Awaited<ReturnType<typeof getCategoryWithChildren>> extends infer R
    ? R extends { children: infer C } ? C : never
    : never;
  categoryPosts: Record<string, Post[]>;
};

export default function LandingPage() {
  return (
    <>
      <style>{`.logo-wrapper{pointer-events:none}.logo-claim{display:none}.sticky-nav{display:none!important}body{padding-top:0!important}[data-flip-id="leo"]{visibility:hidden}`}</style>
      <LandingIntro />
      <main className="bg-white">
        <Suspense fallback={null}>
          <FinanztoolsHeroSection />
        </Suspense>

        <Suspense fallback={null}>
          <RatgeberSection />
        </Suspense>

        <div className="scalable-landing">
          <Footer />
        </div>
      </main>
    </>
  );
}

async function FinanztoolsHeroSection() {
  // Nur die neuesten Beiträge laden — die Hero-Sidebar nutzt ausschließlich
  // latestPosts (max. 4). Früher wurde zusätzlich getAllPosts() (sequenzielle
  // Pagination ALLER ~1000+ Beiträge, 10+ verkettete Requests) nur als Fallback
  // geladen — das blockierte/timeoutete den SSR der Landing bei kaltem WordPress
  // und führte zu „Beiträge erst nach Reload sichtbar".
  // KEIN try/catch-Swallow: würde den Laufzeit-Leer-Schutz aushebeln (leere Hero-Sidebar
  // backen statt letzten guten Stand zu behalten). Fehler propagieren → ISR behält den
  // letzten Stand / Build retried (staticGenerationRetryCount).
  const latestPosts = await getLatestPosts(10);
  return (
    <div className="scalable-landing">
      <FinanztoolsHero latestPosts={latestPosts} />
    </div>
  );
}

async function RatgeberSection() {
  // KEIN try/catch-Swallow und KEIN .catch(()=>[]) pro Subkategorie: beides würde den
  // Laufzeit-Leer-Schutz aushebeln und leere Kategorie-Slider backen. Fehler propagieren
  // → ISR behält letzten guten Stand / Build retried, statt „leeren Slider" zu cachen.
  const mainCats = await Promise.all(
    RATGEBER_KATEGORIEN.map((k) => getCategoryWithChildren(k.slug))
  );
  const kategorieBlocks: KategorieBlock[] = await Promise.all(
    RATGEBER_KATEGORIEN.map(async (kat, i) => {
      const main = mainCats[i];
      const children = main?.children ?? [];
      const results = await Promise.all(
        children.map(async (cat) => ({
          slug: cat.slug,
          posts: await getPostsByCategory(cat.slug),
        }))
      );
      const categoryPosts: Record<string, Post[]> = {};
      results.forEach(({ slug, posts: p }) => { categoryPosts[slug] = p; });
      return { slug: kat.slug, heading: kat.heading, children, categoryPosts } as KategorieBlock;
    })
  );

  return (
    <section id="ratgeber-section" style={{ width: "100%", padding: "0 0 120px", marginTop: -30 }}>
      {/* Heading bewusst außerhalb von .scalable-landing — bleibt beim Menü-Open
          in seinem eigenen Stacking-Context auf Root-Ebene und damit immer
          über dem ProgressiveBlur. SparkHeading bringt seinen eigenen
          .spark-heading-wrapper mit (max-width 1200, height 60, padding). */}
      <SparkHeading title="Ratgeber" as="h2" fadeSectionId="ratgeber-section" />

      <div className="scalable-landing" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: "1200px", padding: "0 clamp(20px, 4vw, 40px)", boxSizing: "border-box" }}>
          <p style={{
            width: "100%",
            maxWidth: 600,
            margin: "23px auto 0",
            fontFamily: "Merriweather, serif",
            fontSize: 18,
            fontStyle: "italic",
            lineHeight: 1.65,
            color: "var(--color-text-medium)",
            textAlign: "center",
          }}>
            Fundiertes Wissen für bessere Finanzentscheidungen. Unsere Ratgeber zu Steuern, Versicherungen, Geldanlage und Recht sind praxisnah formuliert, regelmäßig aktualisiert und kostenlos abrufbar.
          </p>
        </div>
      </div>

      <div className="scalable-landing">
        {kategorieBlocks.map((block) => (
          block.children.length > 0 && (
            <RatgeberCategoryBlock
              key={block.slug}
              heading={block.heading}
              iconSrc={RATGEBER_ICONS[block.slug]}
              categories={block.children}
              parentSlug={block.slug}
              allCategoryPosts={block.categoryPosts}
            />
          )
        ))}
      </div>
    </section>
  );
}
