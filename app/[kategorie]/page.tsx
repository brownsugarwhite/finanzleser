import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory, getCategoryWithChildren, getCategoryBySlug, getAnbieterBySlug } from "@/lib/wordpress";
import ArticleLayout from "@/components/layout/ArticleLayout";
import AnbieterLayout from "@/components/layout/AnbieterLayout";
import CategoryLayout from "@/components/layout/CategoryLayout";
import MainCategoryLayout from "@/components/layout/MainCategoryLayout";
import type { Post } from "@/lib/types";

export default async function KategoriePage(props: { params: Promise<{ kategorie: string }> }) {
  const params = await props.params;

  // 1. Zuerst prüfen: ist es ein Post-Slug (legacy URL)?
  const post = await getPostBySlug(params.kategorie).catch(() => null);
  if (post) {
    return (
      <ArticleLayout title={post.title} subtitle={post.beitragFelder?.beitragUntertitel} content={post.content} />
    );
  }

  // 1a. Ist es ein Anbieter-Slug (legacy URL, /advocard-rechtsschutzversicherung-kontakt/ etc.)?
  const anbieter = await getAnbieterBySlug(params.kategorie).catch(() => null);
  if (anbieter) {
    return <AnbieterLayout title={anbieter.title} content={anbieter.content} />;
  }

  // 2. Prüfen: ist es eine Hauptkategorie mit Child-Kategorien?
  const categoryWithChildren = await getCategoryWithChildren(params.kategorie).catch(() => null);
  if (categoryWithChildren && categoryWithChildren.children && categoryWithChildren.children.length > 0) {
    // Posts pro Subkategorie vorladen (für SubcategorySlider)
    const allCategoryPosts: Record<string, Post[]> = {};
    const results = await Promise.all(
      categoryWithChildren.children.map(async (cat) => ({
        slug: cat.slug,
        posts: await getPostsByCategory(cat.slug).catch(() => []),
      }))
    );
    results.forEach(({ slug, posts }) => { allCategoryPosts[slug] = posts; });

    return (
      <MainCategoryLayout
        name={categoryWithChildren.name}
        slug={params.kategorie}
        description={categoryWithChildren.description}
        image={categoryWithChildren.image}
        categoryChildren={categoryWithChildren.children}
        posts={categoryWithChildren.posts}
        allCategoryPosts={allCategoryPosts}
      />
    );
  }

  // 3. Sonst: Subkategorie-Seite mit Post-Liste
  const posts = await getPostsByCategory(params.kategorie).catch(() => []);
  if (!posts || posts.length === 0) {
    notFound();
  }

  const category = await getCategoryBySlug(params.kategorie).catch(() => null);
  return (
    <CategoryLayout
      title={category?.name || params.kategorie}
      titleSlug={params.kategorie}
      description={category?.description}
      image={category?.image}
      mainCategoryName={category?.parent?.name}
      mainCategorySlug={category?.parent?.slug}
      posts={posts}
    />
  );
}
