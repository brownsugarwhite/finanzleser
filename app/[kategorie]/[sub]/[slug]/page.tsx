import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import TableOfContents from "@/components/sections/TableOfContents";
import ArticleTableOfContents from "@/components/sections/ArticleTableOfContents";

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

  // Format date as "02. März 2026"
  const formattedDate = new Date(post.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Assign color variant to author based on ID (1-6)
  const getColorVariant = (authorId?: string): 1 | 2 | 3 | 4 | 5 | 6 => {
    if (!authorId) return 1;
    const hash = authorId.charCodeAt(0) + authorId.charCodeAt(authorId.length - 1);
    return ((hash % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  };

  return (
    <ArticleLayout
      title={post.title}
      excerpt={post.excerpt}
      featuredImage={post.featuredImage?.node}
      category={category}
      mainCategory={params.kategorie}
      author={
        post.author?.node
          ? {
              name: post.author.node.name || "",
              role: "Autorin bei Finanzleser.de",
              date: formattedDate,
              imageUrl: post.author.node.avatar?.url,
              colorVariant: getColorVariant(post.author.node.id),
            }
          : undefined
      }
      sidebar={post.content ? <TableOfContents content={post.content} /> : undefined}
      contentTableOfContents={
        post.content ? (
          <ArticleTableOfContents content={post.content} tools={post.beitragFelder?.beitragRechner} />
        ) : undefined
      }
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
