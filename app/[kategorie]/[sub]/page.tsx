import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPostsByCategory, getCategoryBySlug } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(
  props: { params: Promise<{ kategorie: string; sub: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const cat = await getCategoryBySlug(params.sub).catch(() => null);
  if (cat) {
    return buildMetadata({
      title: `${cat.name} – ${SITE_NAME}`,
      description: stripHtml(cat.description) || `Ratgeber zu ${cat.name}.`,
      path: `/${params.kategorie}/${params.sub}`,
      image: cat.image,
    });
  }
  const post = await getPostBySlug(params.sub).catch(() => null);
  if (post) {
    return buildMetadata({
      title: `${post.title} – ${SITE_NAME}`,
      description: stripHtml(post.excerpt),
      path: `/${params.kategorie}/${params.sub}`,
      image: post.featuredImage?.node?.sourceUrl,
      type: "article",
      publishedTime: post.date,
    });
  }
  return { title: `${params.sub} – ${SITE_NAME}` };
}

export default async function SubkategoriePage(props: { params: Promise<{ kategorie: string; sub: string }> }) {
  const params = await props.params;

  // 1. Zuerst prüfen: ist es eine Kategorie-Seite?
  const categoryPosts = await getPostsByCategory(params.sub).catch(() => []);
  if (categoryPosts.length > 0) {
    const category = await getCategoryBySlug(params.sub).catch(() => null);
    const mainCategory = category?.parent ? category.parent : { name: params.kategorie, slug: params.kategorie };
    return (
      <CategoryLayout
        title={category?.name || params.sub}
        titleSlug={params.sub}
        description={category?.description}
        image={category?.image}
        mainCategoryName={mainCategory?.name}
        mainCategorySlug={mainCategory?.slug}
        posts={categoryPosts}
      />
    );
  }

  // 2. Sonst: prüfen ob es ein Post-Slug ist
  const post = await getPostBySlug(params.sub).catch(() => null);
  if (post) {
    return (
      <ArticleLayout title={post.title} subtitle={post.beitragFelder?.beitragUntertitel} content={post.content} />
    );
  }

  // 3. Nichts gefunden
  notFound();
}
