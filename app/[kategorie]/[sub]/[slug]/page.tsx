import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug } from "@/lib/wordpress";
import { isMainCategory } from "@/lib/categories";
import ArticleLayout from "@/components/layout/ArticleLayout";
import type { Category } from "@/lib/types";
import { buildMetadata, stripHtml, SITE_NAME, absoluteUrl } from "@/lib/seo";
import { JsonLd, articleSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

export const revalidate = 3600;

type RouteParams = { kategorie: string; sub: string; slug: string };

export async function generateMetadata(
  props: { params: Promise<RouteParams> }
): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostBySlug(params.slug).catch(() => null);
  if (!post) return { title: `Nicht gefunden – ${SITE_NAME}` };

  const mainCategory = post.categories?.nodes?.find((c: Category) => isMainCategory(c.slug));
  return buildMetadata({
    title: `${post.title} – ${SITE_NAME}`,
    description: stripHtml(post.excerpt || post.beitragFelder?.beitragUntertitel),
    path: `/${params.kategorie}/${params.sub}/${params.slug}`,
    image: post.featuredImage?.node?.sourceUrl,
    imageAlt: post.featuredImage?.node?.altText || post.title,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.date,
    ...(mainCategory && {}),
  });
}

export default async function BeitragPage(props: {
  params: Promise<RouteParams>;
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

  const articlePath = `/${params.kategorie}/${params.sub}/${params.slug}`;
  const breadcrumbItems = [
    { name: "Startseite", path: "/" },
    ...(mainCategory ? [{ name: mainCategory.name, path: `/${params.kategorie}` }] : []),
    ...(category ? [{ name: category.name, path: `/${params.kategorie}/${params.sub}` }] : []),
    { name: post.title, path: articlePath },
  ];

  return (
    <>
      <JsonLd data={articleSchema({
        headline: post.title,
        description: stripHtml(post.excerpt),
        url: absoluteUrl(articlePath),
        image: post.featuredImage?.node?.sourceUrl,
        datePublished: post.date,
        dateModified: post.date,
        authorName: post.author?.node?.name,
        section: mainCategory?.name,
      })} />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
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
    </>
  );
}
