import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import LandingIntro from "@/components/sections/LandingIntro";
import FinanztoolsHero from "@/components/sections/FinanztoolsHero";
import SubcategorySlider from "@/components/sections/SubcategorySlider";
import StickySparkHeading from "@/components/ui/StickySparkHeading";
import Footer from "@/components/layout/Footer";
import { getAllPosts, getCategoryWithChildren, getPostsByCategory, getAllRechner, getAllChecklisten } from "@/lib/wordpress";
import type { Post, Rechner, Checkliste } from "@/lib/types";

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

export default async function LandingPage() {
  let posts: Post[] = [];
  let rechner: Rechner[] = [];
  let checklisten: Checkliste[] = [];
  let kategorieBlocks: KategorieBlock[] = [];

  try {
    const [allPosts, allRechner, allChecklisten, ...mainCats] = await Promise.all([
      getAllPosts(),
      getAllRechner(),
      getAllChecklisten(),
      ...RATGEBER_KATEGORIEN.map((k) => getCategoryWithChildren(k.slug)),
    ]);
    posts = allPosts;
    rechner = allRechner;
    checklisten = allChecklisten;

    // Posts pro Subkategorie vorladen (parallel über alle 4 Hauptkategorien)
    kategorieBlocks = await Promise.all(
      RATGEBER_KATEGORIEN.map(async (kat, i) => {
        const main = mainCats[i];
        const children = main?.children ?? [];
        const results = await Promise.all(
          children.map(async (cat) => ({
            slug: cat.slug,
            posts: await getPostsByCategory(cat.slug).catch(() => []),
          }))
        );
        const categoryPosts: Record<string, Post[]> = {};
        results.forEach(({ slug, posts: p }) => { categoryPosts[slug] = p; });
        return { slug: kat.slug, heading: kat.heading, children, categoryPosts } as KategorieBlock;
      })
    );
  } catch (error) {
    console.error("Fehler beim Laden der Beiträge:", error);
  }

  return (
    <>
      <style>{`.logo-wrapper{transform:translateX(-280px);pointer-events:none}.logo-claim{display:none}.sticky-nav{display:none!important}body{padding-top:0!important}[data-flip-id="maya"]{visibility:hidden}`}</style>
      <LandingBodyAttr />
      <LandingIntro />
      <main className="bg-white scalable-landing">
        <FinanztoolsHero posts={posts} rechner={rechner} checklisten={checklisten} />

        <section style={{ width: "100%", padding: "80px 0 120px" }}>
          <StickySparkHeading title="Ratgeber" as="h2" />

          {kategorieBlocks.map((block) => (
            block.children.length > 0 && (
              <div key={block.slug} style={{ marginTop: 80 }}>
                <div style={{
                  maxWidth: 1200,
                  margin: "0 auto",
                  padding: "0 40px",
                  boxSizing: "border-box",
                }}>
                  <h3 style={{
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontSize: 28,
                    color: "var(--color-text-primary)",
                    letterSpacing: "0.01em",
                    lineHeight: 1.3,
                    margin: "0 0 23px",
                  }}>
                    {block.heading}
                  </h3>
                </div>
                <SubcategorySlider
                  categories={block.children}
                  parentSlug={block.slug}
                  allCategoryPosts={block.categoryPosts}
                />
              </div>
            )
          ))}
        </section>

        <div style={{ position: "relative", zIndex: 999 }}>
          <Footer hideNewsletter />
        </div>
      </main>
    </>
  );
}
