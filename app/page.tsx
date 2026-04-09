import LandingBodyAttr from "@/components/ui/LandingBodyAttr";
import LandingIntro from "@/components/sections/LandingIntro";
import FinanztoolsHero from "@/components/sections/FinanztoolsHero";
import MorphingSection from "@/components/sections/MorphingSection";
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
  }

  return (
    <>
      <style>{`.logo-wrapper{visibility:hidden!important;pointer-events:none!important}.sticky-nav{display:none!important}body{padding-top:0!important}`}</style>
      <LandingBodyAttr />
      <LandingIntro />
      <main className="bg-white scalable-landing">
        <FinanztoolsHero posts={posts} />
        <MorphingSection />
        <MorphingSection variant="inverted" />
        <MorphingSection zIndex={3} />
        <div style={{ position: "relative", zIndex: 999 }}>
          <SearchSection />
          <Footer hideNewsletter />
        </div>
      </main>
    </>
  );
}
