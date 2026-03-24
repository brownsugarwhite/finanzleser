import Image from "next/image";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import type { Post } from "@/lib/types";

type CategoryLayoutProps = {
  title?: string;
  children?: React.ReactNode;
  posts?: Post[];
};

export default function CategoryLayout({ title, children, posts }: CategoryLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {title && <h1 className="text-3xl font-bold mb-8">{title}</h1>}

          {/* Posts Grid (wenn Posts vorhanden) */}
          {posts && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const category = post.categories?.nodes?.[0];
                // Finde Parent-Kategorie (Hauptkategorie)
                const mainCategory = post.categories?.nodes?.find(
                  (cat: any) => cat.parent === null || cat.parent === 0
                );
                const mainCategorySlug = mainCategory?.slug || "beitraege";
                const subCategorySlug = category?.slug || "allgemein";
                const postLink = `/${mainCategorySlug}/${subCategorySlug}/${post.slug}`;

                return (
                  <article
                    key={post.id}
                    className="flex flex-col border border-gray-200 rounded overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Image */}
                    {post.featuredImage?.node?.sourceUrl ? (
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Kein Bild</span>
                      </div>
                    )}

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
          )}

          {/* Children (wenn vorhanden) */}
          {children}

          {/* Empty state */}
          {posts && posts.length === 0 && !children && (
            <div className="text-center py-12 text-gray-400">
              <p>Keine Beiträge gefunden</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
