import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getAllChecklisten } from "@/lib/wordpress";

export default async function ChecklistenPage() {
  const checklisten = await getAllChecklisten();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Finanztools", href: "/finanztools" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          <h1 className="text-4xl font-bold mb-6 mt-4">Checklisten</h1>
          <p className="text-lg text-gray-600 mb-12">
            Unsere interaktiven Schritt-für-Schritt Checklisten helfen Ihnen bei wichtigen finanziellen Entscheidungen.
          </p>

          {checklisten.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {checklisten.map((c) => {
                const beschreibung = c.checklisten?.checklistenBeschreibung || "";
                return (
                  <Link
                    key={c.id}
                    href={`/finanztools/checklisten/${c.slug}`}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white"
                    style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-tool-checklisten)" }}
                  >
                    <h3 className="font-semibold text-gray-900">
                      {c.title}
                    </h3>
                    {beschreibung && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {beschreibung}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                Keine Checklisten verfügbar.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
