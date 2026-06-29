import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ChecklisteEmbed from "@/components/checkliste/ChecklisteEmbed";
import PageAds from "@/components/layout/PageAds";
import { getAllChecklisten, getChecklisteBySlug, getSiteSettings } from "@/lib/wordpress";
import { parsePDF } from "@/lib/checklisteParser";
import type { ChecklisteData } from "@/components/checkliste/types";
import type { CheckboxPosition } from "@/lib/checklisteParser";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";
import { cleanDescription } from "@/lib/content-utils";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const checklisten = await getAllChecklisten();
  return checklisten.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const checkliste = await getChecklisteBySlug(slug);

  if (!checkliste) {
    return {
      title: `Checkliste nicht gefunden – ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  return buildMetadata({
    title: `${checkliste.title} – Checkliste – ${SITE_NAME}`,
    description: stripHtml(
      checkliste.excerpt || checkliste.checklisten?.checklistenBeschreibung
    ) || `Interaktive Checkliste: ${checkliste.title}`,
    path: `/finanztools/checklisten/${slug}`,
  });
}

export default async function ChecklisteDetailPage({ params }: Props) {
  const { slug } = await params;
  const checkliste = await getChecklisteBySlug(slug);

  if (!checkliste) {
    return (
      <>
        <main className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-6">
              Checkliste nicht gefunden
            </h1>
            <p className="text-lg text-gray-600">
              Die angeforderte Checkliste existiert nicht.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // PDF holen und parsen
  const pdfUrl =
    checkliste.checklisten?.checklistePdf?.node?.mediaItemUrl || "";
  let parsedData: ChecklisteData | null = null;
  let checkboxPositions: CheckboxPosition[] = [];

  if (pdfUrl) {
    try {
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await parsePDF(buffer);
      parsedData = result.data;
      checkboxPositions = result.checkboxPositions;
    } catch (error) {
      console.error(`Error parsing PDF for "${slug}":`, error);
    }
  }

  const beschreibung = cleanDescription(
    checkliste.excerpt || checkliste.checklisten?.checklistenBeschreibung
  );

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Finanztools", href: "/finanztools" },
    { label: "Checklisten", href: "/finanztools/checklisten" },
  ];

  const settings = await getSiteSettings();
  // Serverseitig geparste PDF-Daten an den Embed reichen → kein Client-Refetch.
  const initialData = parsedData && parsedData.sektionen.length > 0
    ? { data: parsedData, checkboxPositions, pdfUrl }
    : null;

  return (
    <>
      <main className="min-h-screen bg-white">
        <PageAds
          ads={settings.ads.checkliste}
          variant="tool"
          contentWidth={728}
          contentClassName="pb-12"
          heading={
            <>
              {/* Breadcrumb */}
              <Breadcrumb items={breadcrumbItems} />

              {/* Kategorie */}
              <Link
                href="/finanztools/checklisten"
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                  color: "var(--color-tool-checklisten)",
                  fontFamily: "Merriweather, serif",
                  fontSize: "23px",
                  fontStyle: "italic",
                  transition: "opacity 0.2s",
                }}
              >
                Checklisten
              </Link>

              {/* Titel */}
              <h1
                style={{
                  fontSize: "42px",
                  lineHeight: "1.3em",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                {checkliste.title}
              </h1>

              {/* Beschreibung */}
              {beschreibung && (
                <p
                  className="mb-8"
                  style={{
                    fontSize: "18px",
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-text-primary)",
                    lineHeight: 1.6,
                  }}
                >
                  {beschreibung}
                </p>
              )}
            </>
          }
        >
          {/* Checkliste ohne Visual, 850px. Aktions-Portal (PDF) inline unter der Liste. */}
          <ChecklisteEmbed slug={slug} noVisual initialData={initialData} />
        </PageAds>
      </main>
      <Footer />
    </>
  );
}
