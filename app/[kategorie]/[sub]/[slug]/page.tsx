import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";

export default async function BeitragPage({
  params,
}: {
  params: { kategorie: string; sub: string; slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

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
