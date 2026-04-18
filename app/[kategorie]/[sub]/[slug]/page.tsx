import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/wordpress";
import { isMainCategory } from "@/lib/categories";
import ArticleLayout from "@/components/layout/ArticleLayout";
import type { Category } from "@/lib/types";

export default async function BeitragPage(props: {
  params: Promise<{ kategorie: string; sub: string; slug: string }>;
}) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug).catch(() => null);

  if (!post) {
    notFound();
  }

  // Find main category (slug is in MAIN_CATEGORY_SLUGS) and subcategory
  const mainCategory = post.categories?.nodes?.find((cat: Category) => isMainCategory(cat.slug));

  // Subcategory = matching the URL param, or first non-main category
  const category = post.categories?.nodes?.find(
    (cat: Category) => cat.slug === params.sub
  ) || post.categories?.nodes?.find(
    (cat: Category) => !isMainCategory(cat.slug)
  ) || post.categories?.nodes[0];

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
      subtitle={post.beitragFelder?.beitragUntertitel}
      excerpt={post.excerpt}
      featuredImage={post.featuredImage?.node}
      category={category}
      mainCategory={params.kategorie}
      mainCategoryName={mainCategory?.name}
      content={post.content}
      contentTableOfContents={!!post.content}
      slug={params.slug}
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
    />
  );
}
