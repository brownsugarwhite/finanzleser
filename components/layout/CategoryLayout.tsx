import Header from "./Header";
import Footer from "./Footer";

type CategoryLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function CategoryLayout({ children, title }: CategoryLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {title && <h1 className="text-3xl font-bold mb-8">{title}</h1>}
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
