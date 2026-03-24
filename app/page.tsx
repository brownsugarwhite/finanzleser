import Header from "@/components/layout/Header";
import HeroSection from "@/components/sections/HeroSection";
import CategorySlider from "@/components/sections/CategorySlider";
import FeaturedPosts from "@/components/sections/FeaturedPosts";
import ToolsTeaser from "@/components/sections/ToolsTeaser";
import NewsletterBanner from "@/components/sections/NewsletterBanner";
import AIAgentTeaser from "@/components/sections/AIAgentTeaser";
import SearchSection from "@/components/sections/SearchSection";
import Footer from "@/components/layout/Footer";
import { getAllPosts } from "@/lib/wordpress";
import type { Post } from "@/lib/types";

export default async function LandingPage() {
  let posts: Post[] = [];

  try {
    posts = await getAllPosts();
  } catch (error) {
    console.error("Fehler beim Laden der Beiträge:", error);
    // Fallback: leeres Array wenn WordPress nicht erreichbar
  }

  return (
    <main className="bg-white">
      <Header />
      <HeroSection />
      <ToolsTeaser />
      <CategorySlider />
      <FeaturedPosts posts={posts} />
      <NewsletterBanner />
      <AIAgentTeaser />
      <SearchSection />
      <Footer />
    </main>
  );
}
