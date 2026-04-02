import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import LandingIntro from "@/components/sections/LandingIntro";
import FinanztoolsHero from "@/components/sections/FinanztoolsHero";
import SubcategorySlider from "@/components/sections/SubcategorySlider";
import ArticleSlider from "@/components/sections/ArticleSlider";
import FeaturedPosts from "@/components/sections/FeaturedPosts";
import SearchSection from "@/components/sections/SearchSection";
import Footer from "@/components/layout/Footer";
import { getAllPosts, getPostsByCategory, getCategoryWithChildren } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

export default async function LandingPage() {
  let posts: Post[] = [];
  let sliderPosts: Post[] = [];
  let insuranceCategory: Awaited<ReturnType<typeof getCategoryWithChildren>> = null;

  try {
    [posts, sliderPosts, insuranceCategory] = await Promise.all([
      getAllPosts(),
      getPostsByCategory('altersvorsorge'),
      getCategoryWithChildren('versicherungen'),
    ]);
  } catch (error) {
    console.error("Fehler beim Laden der Beiträge:", error);
  }

  return (
    <>
      <LandingBodyAttr />
      <LandingIntro />
      <main className="bg-white scalable-landing">
        <FinanztoolsHero />
        {insuranceCategory && insuranceCategory.children.length > 0 && (
          <SubcategorySlider
            categories={insuranceCategory.children}
            parentSlug="versicherungen"
          />
        )}
        <ArticleSlider posts={sliderPosts} />
        <FeaturedPosts posts={posts} />
        <SearchSection />
        <Footer hideNewsletter />
      </main>
    </>
  );
}
