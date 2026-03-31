import Header from "@/components/layout/Header";
import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import LandingHero from "@/components/sections/LandingHero";
import HeroSection from "@/components/sections/HeroSection";
import SubcategorySlider from "@/components/sections/SubcategorySlider";
import ArticleSlider from "@/components/sections/ArticleSlider";
import FeaturedPosts from "@/components/sections/FeaturedPosts";
import FinanztoolSection from "@/components/sections/FinanztoolSection";
import SearchSection from "@/components/sections/SearchSection";
import SubBanner from "@/components/ui/SubBanner";
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
    <main className="bg-white">
      <LandingBodyAttr />
      <Header />
      <LandingHero />

      <SubBanner text="Mit neu überarbeiteten Rechnern, Vergleichen und Checklisten haben Sie die volle Kontrolle über Ihre Finanzen!" />

      <HeroSection />
      <FinanztoolSection />
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
  );
}
