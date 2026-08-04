import Footer from "./Footer";
import ArticleClient from "./ArticleClient";
import RelatedPostsSection from "@/components/sections/RelatedPostsSection";
import { getSiteSettings, getRelatedPosts } from "@/lib/wordpress";
import type { ArticleToolData } from "@/lib/articleToolData";
import type { Post } from "@/lib/types";

type ArticleLayoutProps = {
  title?: string;
  subtitle?: string;
  excerpt?: string;
  featuredImage?: { sourceUrl: string; altText?: string };
  category?: { name: string; slug: string };
  mainCategory?: string;
  mainCategoryName?: string;
  content?: string;
  contentTableOfContents?: boolean;
  slug?: string;
  author?: {
    name: string;
    role?: string;
    date?: string;
    imageUrl?: string;
    colorVariant?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  toolData?: ArticleToolData;
};

function extractLatestPostsBlock(content?: string): { categoryIds: number[]; postsToShow: number } | null {
  if (!content) return null;
  const m = content.match(/<!-- wp:latest-posts (\{[\s\S]*?\}) \/-->/);
  if (!m) return null;
  try {
    const attrs = JSON.parse(m[1]);
    const categoryIds: number[] = (attrs.categories || [])
      .map((c: { id?: number }) => c.id)
      .filter((n: unknown): n is number => typeof n === "number");
    const postsToShow: number = attrs.postsToShow || 10;
    return { categoryIds, postsToShow };
  } catch {
    return null;
  }
}

export default async function ArticleLayout(props: ArticleLayoutProps) {
  const relatedBlock = extractLatestPostsBlock(props.content);

  // Related-Posts serverseitig (ISR) statt Client-Fetch — spart eine Function-
  // Invocation pro Artikel-View und liefert die Links im initialen HTML (SEO).
  let relatedPosts: Post[] = [];
  if (relatedBlock && relatedBlock.categoryIds.length > 0) {
    relatedPosts = await getRelatedPosts(relatedBlock.categoryIds, relatedBlock.postsToShow + 1)
      .then((p) => (props.slug ? p.filter((x) => x.slug !== props.slug) : p).slice(0, relatedBlock.postsToShow))
      .catch(() => []); // WP-Ausfall → Sektion entfällt still (wie bisher beim Client-Fallback)
  }
  // Werbe-Settings (gecacht/dedupliziert mit dem Aufruf in app/layout.tsx).
  // Quelle jetzt ads.article (Fallback auf Legacy article_ads ist im Merge gelöst).
  const { ads } = await getSiteSettings();
  const articleAds = { top: ads.article.top, rails: ads.article.rails, mid: !!ads.article.mid };

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="pb-12" style={{ paddingTop: 0 }}>
          <ArticleClient {...props} articleAds={articleAds} />
        </div>
        {relatedPosts.length > 0 && <RelatedPostsSection posts={relatedPosts} />}
      </main>
      <Footer />
    </>
  );
}
