import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";

export default async function KategoriePage(props: { params: Promise<{ kategorie: string }> }) {
  const params = await props.params;

  // 1. Zuerst prüfen: ist es ein Post-Slug (legacy URL)?
  const post = await getPostBySlug(params.kategorie).catch(() => null);
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

  // 2. Sonst: Kategorie-Seite mit Post-Liste
  const posts = await getPostsByCategory(params.kategorie).catch(() => []);
  if (posts.length === 0) {
    notFound();
  }

  return <CategoryLayout title={params.kategorie} posts={posts} />;
}
