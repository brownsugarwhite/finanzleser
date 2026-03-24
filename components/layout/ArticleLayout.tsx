import Header from "./Header";
import Footer from "./Footer";

type ArticleLayoutProps = {
  children: React.ReactNode;
  title?: string;
  sidebar?: React.ReactNode;
};

export default function ArticleLayout({ children, title, sidebar }: ArticleLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex gap-8">
            {/* Sidebar (TOC, etc.) */}
            {sidebar && <aside className="w-64">{sidebar}</aside>}

            {/* Article Content */}
            <div className="flex-1">
              {title && <h1 className="text-3xl font-bold mb-8">{title}</h1>}
              <article>{children}</article>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
