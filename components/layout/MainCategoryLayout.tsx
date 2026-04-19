import Footer from "./Footer";
import CategoryHeader from "./CategoryHeader";
import SubcategorySlider from "@/components/sections/SubcategorySlider";
import type { Post } from "@/lib/types";

interface MainCategoryLayoutProps {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  categoryChildren: Array<{ name: string; slug: string; count: number; image?: string }>;
  posts: Post[];
  allCategoryPosts?: Record<string, Post[]>;
}

export default function MainCategoryLayout({
  name,
  slug,
  description,
  categoryChildren,
  allCategoryPosts = {},
}: MainCategoryLayoutProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: name, href: `/${slug}` }
  ];
  return (
    <>
      <main className="min-h-screen bg-white">
        <CategoryHeader title={name} description={description} breadcrumbItems={breadcrumbItems}>
          {categoryChildren.length > 0 && (
            <SubcategorySlider
              categories={categoryChildren.map((c) => ({ name: c.name, slug: c.slug, count: c.count, image: c.image }))}
              parentSlug={slug}
              allCategoryPosts={allCategoryPosts}
            />
          )}
        </CategoryHeader>
      </main>
      <Footer />
    </>
  );
}
