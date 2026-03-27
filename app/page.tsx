import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import CategorySlider from "@/components/sections/CategorySlider";
import FeaturedPosts from "@/components/sections/FeaturedPosts";
import FinanztoolSection from "@/components/sections/FinanztoolSection";
import SearchSection from "@/components/sections/SearchSection";
import Footer from "@/components/layout/Footer";
import { getAllPosts, getPostsByCategory } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

export default async function LandingPage() {
  let posts: Post[] = [];
  let sliderPosts: Post[] = [];

  try {
    [posts, sliderPosts] = await Promise.all([
      getAllPosts(),
      getPostsByCategory('altersvorsorge'),
    ]);
  } catch (error) {
    console.error("Fehler beim Laden der Beiträge:", error);
  }

  return (
    <main className="bg-white">
      <Header />
      <HeroSection />
      <FinanztoolSection />
      <CategorySlider posts={sliderPosts} />
      <FeaturedPosts posts={posts} />
      <SearchSection />
      <Footer />
    </main>
  );
}
