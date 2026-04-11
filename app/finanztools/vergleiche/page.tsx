import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getAllVergleiche } from "@/lib/wordpress";

// Nur Vergleiche mit aktiver URL anzeigen
const ACTIVE_SLUGS = new Set([
  "private-haftpflichtversicherung-vergleich",
  "festgeldvergleich",
  "tagesgeldvergleich",
  "autokredit-vergleich",
  "ratenkredit-vergleich",
  "bausparen-vergleich",
  "baufinanzierung-vergleich",
  "private-krankenversicherung-vergleich",
  "gaspreisvergleich",
  "strompreisvergleich",
  "risikolebensversicherung-vergleich",
  "reisekrankenversicherung-vergleich",
  "fahrradversicherung-vergleich",
  "haus-und-grundbesitzerhaftpflicht-vergleich",
  "unfallversicherung-vergleich",
  "gebaeudeversicherung-vergleich",
  "rechtsschutzversicherung-vergleich",
  "hausratversicherung-vergleich",
  "kfz-versicherung-vergleich",
  "rentenversicherung-vergleich",
  "lebensversicherung-vergleich",
  "photovoltaik-versicherung-vergleich",
  "bussgeldrechner-vergleich",
]);

export default async function VergleichePage() {
  const allVergleiche = await getAllVergleiche();
  const vergleiche = allVergleiche.filter(v => ACTIVE_SLUGS.has(v.slug));

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Finanztools", href: "/finanztools" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          <h1 className="text-4xl font-bold mb-6 mt-4">Vergleiche</h1>
          <p className="text-lg text-gray-600 mb-12">
            Vergleichen Sie aktuelle Angebote und finden Sie die besten Konditionen für Versicherungen, Kredite und Geldanlagen.
          </p>

          {vergleiche.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vergleiche.map((v) => (
                <Link
                  key={v.id}
                  href={`/finanztools/vergleiche/${v.slug}`}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white"
                  style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-tool-vergleiche)" }}
                >
                  <h3 className="font-semibold text-gray-900">
                    {v.title}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">
                Keine Vergleiche verfügbar.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
