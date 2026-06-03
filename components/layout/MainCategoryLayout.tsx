import Footer from "./Footer";
import CategoryHeader from "./CategoryHeader";
import SubcategorySlider from "@/components/sections/SubcategorySlider";
import type { Post } from "@/lib/types";

interface MainCategoryLayoutProps {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imageWide?: string;
  categoryChildren: Array<{ name: string; slug: string; count: number; image?: string }>;
  posts: Post[];
  allCategoryPosts?: Record<string, Post[]>;
}

export default function MainCategoryLayout({
  name,
  slug,
  description,
  imageWide,
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
        <CategoryHeader title={name} description={description} breadcrumbItems={breadcrumbItems} imageWide={imageWide}>
          {categoryChildren.length > 0 && (
            <SubcategorySlider
              categories={categoryChildren.map((c) => ({ name: c.name, slug: c.slug, count: c.count, image: c.image }))}
              parentSlug={slug}
              allCategoryPosts={allCategoryPosts}
            />
          )}
        </CategoryHeader>
      </main>
      <div className="scalable-landing">
        <Footer />
      </div>
    </>
  );
}
