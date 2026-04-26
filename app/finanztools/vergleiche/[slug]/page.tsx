import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import { getAllVergleiche } from "@/lib/wordpress";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

// Titel und Beschreibungen für die aktiven Vergleiche
const VERGLEICH_DATA: Record<string, { title: string; desc: string }> = {
  "private-haftpflichtversicherung-vergleich": { title: "Private Haftpflichtversicherung", desc: "Vergleichen Sie aktuelle Tarife für die private Haftpflichtversicherung und finden Sie den besten Schutz zum günstigsten Preis." },
  "festgeldvergleich": { title: "Festgeld", desc: "Vergleichen Sie Festgeld-Angebote und sichern Sie sich die besten Zinsen für Ihre Geldanlage." },
  "tagesgeldvergleich": { title: "Tagesgeld", desc: "Finden Sie die besten Tagesgeld-Konditionen und profitieren Sie von attraktiven Zinsen bei täglicher Verfügbarkeit." },
  "autokredit-vergleich": { title: "Autokredit", desc: "Vergleichen Sie Autokredite und finden Sie die günstigste Finanzierung für Ihr Wunschfahrzeug." },
  "ratenkredit-vergleich": { title: "Ratenkredit", desc: "Vergleichen Sie Ratenkredite verschiedener Anbieter und sparen Sie durch den besten effektiven Jahreszins." },
  "bausparen-vergleich": { title: "Bausparen", desc: "Vergleichen Sie Bauspartarife und finden Sie den optimalen Bausparvertrag mit staatlicher Förderung." },
  "baufinanzierung-vergleich": { title: "Baufinanzierung", desc: "Vergleichen Sie Baufinanzierungen und sichern Sie sich die besten Bauzinsen für Ihr Eigenheim." },
  "private-krankenversicherung-vergleich": { title: "Private Krankenversicherung", desc: "Vergleichen Sie PKV-Tarife und finden Sie die private Krankenversicherung mit dem besten Preis-Leistungs-Verhältnis." },
  "gaspreisvergleich": { title: "Gaspreise", desc: "Vergleichen Sie Gastarife und wechseln Sie zu einem günstigeren Anbieter. Sparen Sie sofort bei Ihren Energiekosten." },
  "strompreisvergleich": { title: "Strompreise", desc: "Vergleichen Sie Stromtarife und senken Sie Ihre Stromkosten durch einen einfachen Anbieterwechsel." },
  "risikolebensversicherung-vergleich": { title: "Risikolebensversicherung", desc: "Vergleichen Sie Risikolebensversicherungen und sichern Sie Ihre Familie im Todesfall finanziell ab." },
  "reisekrankenversicherung-vergleich": { title: "Reisekrankenversicherung", desc: "Vergleichen Sie Reisekrankenversicherungen und reisen Sie weltweit mit optimalem Versicherungsschutz." },
  "fahrradversicherung-vergleich": { title: "Fahrradversicherung", desc: "Vergleichen Sie Fahrradversicherungen und schützen Sie Ihr Fahrrad vor Diebstahl und Beschädigung." },
  "haus-und-grundbesitzerhaftpflicht-vergleich": { title: "Haus- und Grundbesitzerhaftpflicht", desc: "Vergleichen Sie Haus- und Grundbesitzerhaftpflichtversicherungen und sichern Sie sich als Eigentümer ab." },
  "unfallversicherung-vergleich": { title: "Unfallversicherung", desc: "Vergleichen Sie private Unfallversicherungen und schützen Sie sich vor den finanziellen Folgen eines Unfalls." },
  "gebaeudeversicherung-vergleich": { title: "Gebäudeversicherung", desc: "Vergleichen Sie Wohngebäudeversicherungen und schützen Sie Ihre Immobilie vor Feuer, Wasser und Sturm." },
  "rechtsschutzversicherung-vergleich": { title: "Rechtsschutzversicherung", desc: "Vergleichen Sie Rechtsschutzversicherungen und sichern Sie sich gegen hohe Anwalts- und Gerichtskosten ab." },
  "hausratversicherung-vergleich": { title: "Hausratversicherung", desc: "Vergleichen Sie Hausratversicherungen und schützen Sie Ihr Hab und Gut zum besten Preis." },
  "kfz-versicherung-vergleich": { title: "Kfz-Versicherung", desc: "Vergleichen Sie Kfz-Versicherungen und finden Sie den günstigsten Tarif für Haftpflicht, Teil- und Vollkasko." },
  "rentenversicherung-vergleich": { title: "Rentenversicherung", desc: "Vergleichen Sie private Rentenversicherungen und finden Sie die beste Altersvorsorge für Ihre Bedürfnisse." },
  "lebensversicherung-vergleich": { title: "Lebensversicherung", desc: "Vergleichen Sie Lebensversicherungen und finden Sie den passenden Schutz für Ihre Familie und Altersvorsorge." },
  "photovoltaik-versicherung-vergleich": { title: "Photovoltaik-Versicherung", desc: "Vergleichen Sie Photovoltaik-Versicherungen und schützen Sie Ihre Solaranlage vor Schäden und Ertragsausfällen." },
  "bussgeldrechner-vergleich": { title: "Bußgeldrechner", desc: "Berechnen Sie Bußgelder, Punkte und Fahrverbote für Verkehrsverstöße mit dem aktuellen Bußgeldkatalog 2026." },
};

export async function generateStaticParams() {
  const vergleiche = await getAllVergleiche();
  return vergleiche
    .filter(v => VERGLEICH_DATA[v.slug])
    .map(v => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = VERGLEICH_DATA[slug];
  const title = data?.title || slug;

  return buildMetadata({
    title: `${title} – Vergleich – ${SITE_NAME}`,
    description: data?.desc || `Vergleichen Sie aktuelle Angebote: ${title}`,
    path: `/finanztools/vergleiche/${slug}`,
    noIndex: !data,
  });
}

export default async function VergleichDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = VERGLEICH_DATA[slug];
  const title = data?.title || slug;

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
    { label: "Home", href: "/" },
    { label: "Finanztools", href: "/finanztools" },
    { label: "Vergleiche", href: "/finanztools/vergleiche" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div style={{ maxWidth: 1000 }} className="mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          <Link
            href="/finanztools/vergleiche"
            className="mb-2 inline-block transition hover:opacity-80"
            style={{
              color: "var(--color-tool-vergleiche)",
              fontFamily: "Merriweather, serif",
              fontSize: "23px",
              fontStyle: "italic",
            }}
          >
            Vergleich
          </Link>

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
