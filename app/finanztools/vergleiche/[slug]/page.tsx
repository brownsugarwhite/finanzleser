import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import { getAllVergleiche } from "@/lib/wordpress";
import { VERGLEICH_DESCRIPTIONS } from "@/lib/vergleichDescriptions";
import { buildMetadata, SITE_NAME, stripHtml } from "@/lib/seo";
import { decodeHtmlEntities } from "@/lib/html-utils";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

// Titel + Beschreibung kommen aus dem vergleich-CPT (Title/Excerpt). Fallback:
// kuratierte Beschreibung. Anzeige-Titel ohne „… Vergleich"-Suffix.
async function getVergleichMeta(slug: string): Promise<{ title: string; desc: string } | null> {
  const all = await getAllVergleiche();
  const v = all.find((x) => x.slug === slug);
  if (!v) return null;
  const title = decodeHtmlEntities(v.title).replace(/\s*[–-]?\s*Vergleich$/i, "").trim();
  const excerpt = stripHtml(v.excerpt || "").trim();
  return { title, desc: excerpt || VERGLEICH_DESCRIPTIONS[slug] || `Vergleichen Sie aktuelle Angebote: ${title}` };
}

export async function generateStaticParams() {
  const vergleiche = await getAllVergleiche();
  return vergleiche.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getVergleichMeta(slug);
  const title = meta?.title || slug;

  return buildMetadata({
    title: `${title} – Vergleich – ${SITE_NAME}`,
    description: meta?.desc || `Vergleichen Sie aktuelle Angebote: ${title}`,
    path: `/finanztools/vergleiche/${slug}`,
    noIndex: !meta,
  });
}

export default async function VergleichDetailPage({ params }: Props) {
  const { slug } = await params;
  const meta = await getVergleichMeta(slug);
  const title = meta?.title || slug;

  if (!meta) {
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
            {meta.desc}
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
