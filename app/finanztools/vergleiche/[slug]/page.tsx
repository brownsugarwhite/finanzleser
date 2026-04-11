import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import { getAllVergleiche } from "@/lib/wordpress";

type Props = {
  params: Promise<{ slug: string }>;
};

// Beschreibungen für die 19 aktiven Vergleiche
const VERGLEICH_DATA: Record<string, { desc: string }> = {
  "private-haftpflichtversicherung-vergleich": { desc: "Vergleichen Sie aktuelle Tarife für die private Haftpflichtversicherung und finden Sie den besten Schutz zum günstigsten Preis." },
  "festgeldvergleich": { desc: "Vergleichen Sie Festgeld-Angebote und sichern Sie sich die besten Zinsen für Ihre Geldanlage." },
  "tagesgeldvergleich": { desc: "Finden Sie die besten Tagesgeld-Konditionen und profitieren Sie von attraktiven Zinsen bei täglicher Verfügbarkeit." },
  "autokredit-vergleich": { desc: "Vergleichen Sie Autokredite und finden Sie die günstigste Finanzierung für Ihr Wunschfahrzeug." },
  "ratenkredit-vergleich": { desc: "Vergleichen Sie Ratenkredite verschiedener Anbieter und sparen Sie durch den besten effektiven Jahreszins." },
  "bausparen-vergleich": { desc: "Vergleichen Sie Bauspartarife und finden Sie den optimalen Bausparvertrag mit staatlicher Förderung." },
  "baufinanzierung-vergleich": { desc: "Vergleichen Sie Baufinanzierungen und sichern Sie sich die besten Bauzinsen für Ihr Eigenheim." },
  "private-krankenversicherung-vergleich": { desc: "Vergleichen Sie PKV-Tarife und finden Sie die private Krankenversicherung mit dem besten Preis-Leistungs-Verhältnis." },
  "gaspreisvergleich": { desc: "Vergleichen Sie Gastarife und wechseln Sie zu einem günstigeren Anbieter. Sparen Sie sofort bei Ihren Energiekosten." },
  "strompreisvergleich": { desc: "Vergleichen Sie Stromtarife und senken Sie Ihre Stromkosten durch einen einfachen Anbieterwechsel." },
  "risikolebensversicherung-vergleich": { desc: "Vergleichen Sie Risikolebensversicherungen und sichern Sie Ihre Familie im Todesfall finanziell ab." },
  "reisekrankenversicherung-vergleich": { desc: "Vergleichen Sie Reisekrankenversicherungen und reisen Sie weltweit mit optimalem Versicherungsschutz." },
  "fahrradversicherung-vergleich": { desc: "Vergleichen Sie Fahrradversicherungen und schützen Sie Ihr Fahrrad vor Diebstahl und Beschädigung." },
  "haus-und-grundbesitzerhaftpflicht-vergleich": { desc: "Vergleichen Sie Haus- und Grundbesitzerhaftpflichtversicherungen und sichern Sie sich als Eigentümer ab." },
  "unfallversicherung-vergleich": { desc: "Vergleichen Sie private Unfallversicherungen und schützen Sie sich vor den finanziellen Folgen eines Unfalls." },
  "gebaeudeversicherung-vergleich": { desc: "Vergleichen Sie Wohngebäudeversicherungen und schützen Sie Ihre Immobilie vor Feuer, Wasser und Sturm." },
  "rechtsschutzversicherung-vergleich": { desc: "Vergleichen Sie Rechtsschutzversicherungen und sichern Sie sich gegen hohe Anwalts- und Gerichtskosten ab." },
  "hausratversicherung-vergleich": { desc: "Vergleichen Sie Hausratversicherungen und schützen Sie Ihr Hab und Gut zum besten Preis." },
  "kfz-versicherung-vergleich": { desc: "Vergleichen Sie Kfz-Versicherungen und finden Sie den günstigsten Tarif für Haftpflicht, Teil- und Vollkasko." },
};

export async function generateStaticParams() {
  const vergleiche = await getAllVergleiche();
  return vergleiche
    .filter(v => VERGLEICH_DATA[v.slug])
    .map(v => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const data = VERGLEICH_DATA[slug];

  return {
    title: title,
    description: data?.desc || `Vergleichen Sie aktuelle Angebote: ${title}`,
  };
}

export default async function VergleichDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = VERGLEICH_DATA[slug];
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  if (!data) {
    return (
      <>
        <main className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-6">Vergleich nicht verfügbar</h1>
            <p className="text-lg text-gray-600">Dieser Vergleich ist aktuell nicht verfügbar.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbItems = [
    { label: "Finanztools", href: "/finanztools" },
    { label: "Vergleiche", href: "/finanztools/vergleiche" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div style={{ maxWidth: 1000 }} className="mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          <h1 className="font-bold mb-4" style={{ fontSize: "42px", lineHeight: "1.3em" }}>
            {title}
          </h1>

          <p
            className="mb-8 text-gray-600"
            style={{
              fontFamily: "Merriweather, serif",
              fontSize: "18px",
              fontWeight: "400",
            }}
          >
            {data.desc}
          </p>

          <VergleichEmbed slug={slug} />

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Alle Angaben sind unverbindlich. Vergleichsergebnisse werden von externen Anbietern bereitgestellt. Für verbindliche Angebote wenden Sie sich direkt an den jeweiligen Anbieter.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
