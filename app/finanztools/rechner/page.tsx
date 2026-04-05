import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getAllRechner } from "@/lib/wordpress";

// Mapping von rechner_typ → Anzeigename
const TYP_LABELS: Record<string, string> = {
  steuer: "Steuern & Lohn",
  rente: "Rente & Altersvorsorge",
  soziales: "Soziales & Arbeit",
  kredit: "Kredit & Finanzen",
};

// Sortierreihenfolge der Kategorien
const TYP_ORDER = ["steuer", "rente", "soziales", "kredit"];

export default async function RechnerPage() {
  const rechner = await getAllRechner();

  // Nach Typ gruppieren
  const grouped: Record<string, typeof rechner> = {};
  for (const r of rechner) {
    const rawTyp = r.rechnerFelder?.rechnerTyp;
    const typ = Array.isArray(rawTyp) ? rawTyp[0] : rawTyp || "sonstige";
    if (!grouped[typ]) grouped[typ] = [];
    grouped[typ].push(r);
  }

  // Sortieren: bekannte Typen zuerst, dann Rest
  const sortedTypes = [
    ...TYP_ORDER.filter((t) => grouped[t]),
    ...Object.keys(grouped).filter((t) => !TYP_ORDER.includes(t)),
  ];

  const breadcrumbItems = [
    { label: "Finanztools", href: "/finanztools" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Breadcrumb items={breadcrumbItems} />

          <h1 className="text-4xl font-bold mb-6 mt-4">Finanzrechner</h1>
          <p className="text-lg text-gray-600 mb-12">
            Wählen Sie einen unserer {rechner.length} Finanzrechner, um wichtige finanzielle Entscheidungen zu treffen.
          </p>

          <div className="space-y-16">
            {sortedTypes.map((typ) => (
              <section key={typ}>
                <h2
                  className="text-2xl font-bold mb-6 pb-3 border-b-2"
                  style={{ borderColor: "var(--color-tool-rechner)" }}
                >
                  {TYP_LABELS[typ] || typ}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[typ]
                    .sort((a, b) => a.title.localeCompare(b.title, "de"))
                    .map((r) => (
                      <Link
                        key={r.slug}
                        href={`/finanztools/rechner/${r.slug}`}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white"
                        style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-tool-rechner)" }}
                      >
                        <h3 className="font-semibold text-gray-900">
                          {r.title}
                        </h3>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
