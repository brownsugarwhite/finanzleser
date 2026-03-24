import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import TableOfContents from "@/components/sections/TableOfContents";

export default async function BeitragPage(props: {
  params: Promise<{ kategorie: string; sub: string; slug: string }>;
}) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <ArticleLayout
      title={post.title}
      sidebar={post.content ? <TableOfContents content={post.content} /> : undefined}
    >
      <div className="prose prose-lg max-w-none">
        {post.content && (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        )}
      </div>
    </ArticleLayout>
  );
}
