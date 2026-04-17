import Footer from "./Footer";
import ArticleClient from "./ArticleClient";
import RelatedPostsSection from "@/components/sections/RelatedPostsSection";

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

export default function ArticleLayout(props: ArticleLayoutProps) {
  const relatedBlock = extractLatestPostsBlock(props.content);

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="pb-12" style={{ paddingTop: 0 }}>
          <ArticleClient {...props} />
        </div>
        {relatedBlock && relatedBlock.categoryIds.length > 0 && (
          <RelatedPostsSection
            categoryIds={relatedBlock.categoryIds}
            excludeSlug={props.slug}
            postsToShow={relatedBlock.postsToShow}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
