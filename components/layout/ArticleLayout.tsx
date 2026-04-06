import Footer from "./Footer";
import ArticleClient from "./ArticleClient";

type ArticleLayoutProps = {
  title?: string;
  excerpt?: string;
  featuredImage?: { sourceUrl: string; altText?: string };
  category?: { name: string; slug: string };
  mainCategory?: string;
  mainCategoryName?: string;
  content?: string;
  contentTableOfContents?: boolean;
  author?: {
    name: string;
    role?: string;
    date?: string;
    imageUrl?: string;
    colorVariant?: 1 | 2 | 3 | 4 | 5 | 6;
  };
};

export default function ArticleLayout(props: ArticleLayoutProps) {
  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="pb-12" style={{ paddingTop: 0 }}>
          <ArticleClient {...props} />
        </div>
      </main>
      <Footer />
    </>
  );
}
