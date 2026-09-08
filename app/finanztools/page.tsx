import Footer from "@/components/layout/Footer";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte from "@/components/faden/karten/ListenKarte";
import BlattStart from "@/components/faden/kopf/BlattStart";
import Breadcrumb from "@/components/ui/Breadcrumb";
import FinanztoolsGrid from "@/components/sections/FinanztoolsGrid";
import { getToolCategories } from "@/lib/wordpress";

export const revalidate = 86400;

export const metadata = {
  title: "Finanztools - Rechner, Checklisten & Vergleiche",
  description:
    "Nutze unsere kostenlosen Finanztools: Rechner für Steuern und Geldanlage, praktische Checklisten und hilfreiche Vergleichstabellen.",
};

export default async function FinanztoolsPage() {
  const categories = await getToolCategories();
  if (FADEN_AKTIV) {
    return (
      <KartenKapitel schluessel="blatt:finanztools" titel="Finanztools" kicker="Rechner · Vergleiche · Checklisten" beschreibung="Alle Werkzeuge öffnen als Karte im Faden und rechnen dort: mit Quelle, ohne Anmeldung." krumen={[{ name: "Finanztools", href: "/finanztools" }]} url="/finanztools">
        <BlattStart schluessel="finanztools" />
        <ListenKarte gruppen={[{ eintraege: categories.map((c) => ({ titel: c.label, href: c.href, meta: `${c.count} Einträge`, dot: (c.href.includes("rechner") ? "rechner" : c.href.includes("vergleich") ? "vergleich" : c.href.includes("checklist") ? "checkliste" : "dokumente") as "rechner" | "vergleich" | "checkliste" | "dokumente" })) }]} />
      </KartenKapitel>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finanztools", href: "/finanztools" }]} />
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
