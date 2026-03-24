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

  const category = post.categories?.nodes[0];

  // Debug
  console.log("Post slug:", params.slug);
  console.log("Content length:", post.content?.length);
  console.log("Has content:", !!post.content);

  return (
    <ArticleLayout
      title={post.title}
      category={category}
      sidebar={post.content ? <TableOfContents content={post.content} /> : undefined}
    >
      <div className="prose prose-lg max-w-none">
        {post.content && post.content.trim() ? (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
            <p className="text-gray-600 text-lg">Inhalt folgt in Kürze.</p>
          </div>
        )}
      </div>
    </ArticleLayout>
  );
}
