import Link from "next/link";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte from "@/components/faden/karten/ListenKarte";
import BlattStart from "@/components/faden/kopf/BlattStart";
import { buildRechnerUrl } from "@/lib/urls";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getAllRechner } from "@/lib/wordpress";
import { TYP_LABELS, TYP_ORDER } from "@/lib/rechnerCategories";

export const revalidate = 86400;

export default async function RechnerPage() {
  const rechner = await getAllRechner();
  if (FADEN_AKTIV) {
    const gr: Record<string, typeof rechner> = {};
    for (const r of rechner) { const t = (Array.isArray(r.rechnerTyp) ? r.rechnerTyp[0] : r.rechnerTyp) || "sonstige"; (gr[t] ||= []).push(r); }
    const typen = [...TYP_ORDER.filter((t) => gr[t]), ...Object.keys(gr).filter((t) => !TYP_ORDER.includes(t))];
    return (
      <KartenKapitel schluessel="blatt:rechner" titel="Rechner" kicker="Finanztools" beschreibung={`${rechner.length} Rechner, alle rechnen als Karte im Faden.`} krumen={[{ name: "Finanztools", href: "/finanztools" }, { name: "Rechner", href: "/finanztools/rechner" }]} url="/finanztools/rechner">
        <BlattStart schluessel="finanztools" a="rechner" />
        <ListenKarte gruppen={typen.map((t) => ({ titel: TYP_LABELS[t] || t, zahl: gr[t].length, eintraege: gr[t].sort((a, b) => a.title.localeCompare(b.title, "de")).map((r) => ({ titel: r.title, href: buildRechnerUrl(r.slug), dot: "rechner" as const })) }))} />
      </KartenKapitel>
    );
  }

  // Nach Typ gruppieren
  const grouped: Record<string, typeof rechner> = {};
  for (const r of rechner) {
    const rawTyp = r.rechnerTyp;
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
    { label: "Home", href: "/" },
    { label: "Finanztools", href: "/finanztools" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
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
