import Footer from "@/components/layout/Footer";
import FinanztoolsGrid from "@/components/sections/FinanztoolsGrid";
import { getToolCategories } from "@/lib/wordpress";

export const metadata = {
  title: "Finanztools - Rechner, Checklisten & Vergleiche",
  description:
    "Nutze unsere kostenlosen Finanztools: Rechner für Steuern und Geldanlage, praktische Checklisten und hilfreiche Vergleichstabellen.",
};

export default async function FinanztoolsPage() {
  const categories = await getToolCategories();

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Finanztools
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Kostenlose Rechner, Checklisten und Vergleichstabellen für deine
              finanziellen Entscheidungen
            </p>
          </div>

          <FinanztoolsGrid categories={categories} />
        </div>
      </main>
      <Footer />
    </>
  );
}
