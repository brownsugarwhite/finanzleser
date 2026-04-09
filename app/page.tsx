import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import LandingIntro from "@/components/sections/LandingIntro";
import FinanztoolsHero from "@/components/sections/FinanztoolsHero";
import MorphingSection from "@/components/sections/MorphingSection";
import SubcategorySlider from "@/components/sections/SubcategorySlider";
import SearchSection from "@/components/sections/SearchSection";
import Footer from "@/components/layout/Footer";
import { getAllPosts, getCategoryWithChildren, getPostsByCategory } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

export default async function LandingPage() {
  let posts: Post[] = [];
  let insuranceCategory: Awaited<ReturnType<typeof getCategoryWithChildren>> = null;
  let categoryPosts: Record<string, Post[]> = {};

  try {
    [posts, insuranceCategory] = await Promise.all([
      getAllPosts(),
      getCategoryWithChildren('versicherungen'),
    ]);

    // Alle Kategorie-Beiträge vorladen
    if (insuranceCategory?.children) {
      const results = await Promise.all(
        insuranceCategory.children.map(async (cat) => ({
          slug: cat.slug,
          posts: await getPostsByCategory(cat.slug),
        }))
      );
      results.forEach(({ slug, posts: p }) => { categoryPosts[slug] = p; });
    }
  } catch (error) {
    console.error("Fehler beim Laden der Beiträge:", error);
  }

  return (
    <>
      <style>{`.logo-wrapper{visibility:hidden!important;pointer-events:none!important}.sticky-nav{display:none!important}body{padding-top:0!important}[data-flip-id="maya"]{visibility:hidden}`}</style>
      <LandingBodyAttr />
      <LandingIntro />
      <main className="bg-white scalable-landing">
        <FinanztoolsHero posts={posts} />
        <MorphingSection heading="Unsere Finanzratgeber" text="Wir bringen Klarheit in deine Entscheidungen">
          {insuranceCategory && insuranceCategory.children.length > 0 && (
            <SubcategorySlider
              categories={insuranceCategory.children}
              parentSlug="versicherungen"
              allCategoryPosts={categoryPosts}
            />
          )}
        </MorphingSection>
        <MorphingSection variant="inverted" heading="Versicherungsratgeber" text="Versicherungen verstehen und Besser entscheiden" />
        <MorphingSection zIndex={3} heading="Steuerratgeber" text="Mehr Durchblick, mehr Geld behalten" />
        <div style={{ position: "relative", zIndex: 999 }}>
          <SearchSection />
          <Footer hideNewsletter />
        </div>
      </main>
    </>
  );
}
