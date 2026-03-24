import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";

export default async function SubkategoriePage(props: { params: Promise<{ kategorie: string; sub: string }> }) {
  const params = await props.params;

  // 1. Zuerst prüfen: ist es ein Post-Slug?
  const post = await getPostBySlug(params.sub).catch(() => null);
  if (post) {
    return (
      <ArticleLayout title={post.title}>
        <div className="prose prose-lg max-w-none">
          {post.content && (
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          )}
        </div>
      </ArticleLayout>
    );
  }

  // 2. Sonst: Kategorie-Seite
  const categoryPosts = await getPostsByCategory(params.sub).catch(() => []);

  if (categoryPosts.length === 0) {
    notFound();
  }

  return <CategoryLayout title={params.sub} posts={categoryPosts} />;
}
