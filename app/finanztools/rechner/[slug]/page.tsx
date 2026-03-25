import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RechnerEmbed from "@/components/rechner/RechnerEmbed";

const RECHNER = [
  { slug: "brutto-netto", title: "Brutto-Netto-Rechner" },
  { slug: "kredit", title: "Kreditrechner" },
  { slug: "mehrwertsteuer", title: "Mehrwertsteuer-Rechner" },
  { slug: "inflation", title: "Inflationsrechner" },
  { slug: "zinseszins", title: "Zinseszins-Rechner" },
  { slug: "stundenlohn", title: "Stundenlohn-Rechner" },
  { slug: "kindergeld", title: "Kindergeld-Rechner" },
  { slug: "wohngeld", title: "Wohngeld-Rechner" },
  { slug: "tilgung", title: "Tilgungsrechner" },
  { slug: "einkommensteuer", title: "Einkommensteuer-Rechner" },
  { slug: "rente", title: "Renten-Rechner" },
  { slug: "erbschaftsteuer", title: "Erbschaftsteuer-Rechner" },
  { slug: "unterhalt", title: "Unterhalts-Rechner" },
  { slug: "elterngeld", title: "Elterngeld-Rechner" },
  { slug: "kfz-steuer", title: "KFZ-Steuer-Rechner" },
  { slug: "abfindung", title: "Abfindungs-Rechner" },
  { slug: "kurzarbeitsgeld", title: "Kurzarbeitsgeld-Rechner" },
];

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return RECHNER.map((rechner) => ({
    slug: rechner.slug,
  }));
}

export function generateMetadata({ params }: Props) {
  const { slug } = params as { slug: string };
  const rechner = RECHNER.find((r) => r.slug === slug);
  return {
    title: rechner?.title || "Rechner",
    description: `Nutzen Sie unseren ${rechner?.title || "Finanzrechner"} um Ihre Berechnungen durchzuführen.`,
  };
}

export default async function RechnerDetailPage({ params }: Props) {
  const { slug } = params as { slug: string };
  const rechner = RECHNER.find((r) => r.slug === slug);

  if (!rechner) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-6">Rechner nicht gefunden</h1>
            <p className="text-lg text-gray-600">Der angeforderte Rechner existiert nicht.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-6">{rechner.title}</h1>

          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <RechnerEmbed slug={rechner.slug} />
          </div>

          <div className="text-center text-sm text-gray-500 py-4 border-t border-gray-200">
            <p>Alle Rechner sind Schätzungen und können rechtliche oder steuerliche Beratung nicht ersetzen.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
