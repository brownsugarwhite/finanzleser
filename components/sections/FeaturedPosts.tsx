import Link from "next/link";
import InlineSVG from "@/components/ui/InlineSVG";
import VisualLottie from "@/components/ui/VisualLottie";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";

type FeaturedPostsProps = {
  posts: Post[];
};

export default function FeaturedPosts({ posts }: FeaturedPostsProps) {
  if (!posts || posts.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8">Aktuelle Beiträge</h2>
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">Keine Beiträge verfügbar</p>
          </div>
        </div>
      </section>
    );
  }

  const featuredPosts = posts.slice(0, 6);
  const firstCategory = (post: Post) => post.categories?.nodes?.[0];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8">Aktuelle Beiträge</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts.map((post) => {
            const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
            const category = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || firstCategory(post);
            const mainCategorySlug = mainCategory?.slug || "beitraege";
            const subCategorySlug = category?.slug || "allgemein";
            const postLink = `/${mainCategorySlug}/${subCategorySlug}/${post.slug}`;

            return (
              <article
                key={post.id}
                className="flex flex-col border border-gray-200 rounded overflow-hidden hover:shadow-lg transition"
              >
                {/* Visual */}
                <div className="h-48 flex items-center justify-center overflow-hidden p-4 relative">
                  {post.featuredImage?.node?.sourceUrl ? (
                    <InlineSVG
                      src={post.featuredImage.node.sourceUrl}
                      alt={post.featuredImage.node.altText || post.title}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <VisualLottie seed={post.slug} />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  {category && (
                    <span className="inline-block text-xs font-semibold text-blue-600 mb-2 w-fit">
                      {category.name}
                    </span>
                  )}

                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{post.title}</h3>

                  <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                    {post.excerpt?.replace(/<[^>]*>/g, "") || ""}
                  </p>

                  <Link
                    href={postLink}
                    className="text-blue-600 text-sm font-semibold hover:text-blue-800 transition"
                  >
                    Lesen →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
