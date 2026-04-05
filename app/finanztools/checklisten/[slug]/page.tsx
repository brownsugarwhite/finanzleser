import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import InteraktiveCheckliste from "@/components/checkliste/InteraktiveCheckliste";
import { getAllChecklisten, getChecklisteBySlug } from "@/lib/wordpress";
import { parsePDF } from "@/lib/checklisteParser";
import type { ChecklisteData } from "@/components/checkliste/types";
import type { CheckboxPosition } from "@/lib/checklisteParser";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const checklisten = await getAllChecklisten();
  return checklisten.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const checkliste = await getChecklisteBySlug(slug);

  if (!checkliste) {
    return {
      title: "Checkliste nicht gefunden",
      description: "Die angeforderte Checkliste existiert nicht.",
    };
  }

  return {
    title: `${checkliste.title} – Checkliste`,
    description:
      checkliste.checklisten?.checklistenBeschreibung ||
      `Interaktive Checkliste: ${checkliste.title}`,
  };
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

  const beschreibung =
    checkliste.checklisten?.checklistenBeschreibung || "";

  const breadcrumbItems = [
    { label: "Finanztools", href: "/finanztools" },
    { label: "Checklisten", href: "/finanztools/checklisten" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
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

          {/* 2-Column: Visual links + Slider rechts */}
          {parsedData && parsedData.sektionen.length > 0 ? (
            <div className="checkliste-2col">
              {/* Links: Visual Platzhalter */}
              <div className="checkliste-visual">
                <div style={{
                  width: "100%",
                  aspectRatio: "3 / 4",
                  background: "var(--color-bg-subtle)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-medium)",
                  fontSize: 14,
                  position: "sticky",
                  top: 100,
                }}>
                  Visual
                </div>
              </div>

              {/* Rechts: Slider */}
              <div>
                <InteraktiveCheckliste data={parsedData} pdfUrl={pdfUrl} slug={slug} checkboxPositions={checkboxPositions} />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>
                Keine Checklisten-Daten verfügbar.
                {pdfUrl && (
                  <>
                    {" "}
                    <a
                      href={pdfUrl}
                      download
                      className="underline"
                      style={{ color: "var(--color-tool-checklisten)" }}
                    >
                      PDF herunterladen
                    </a>
                  </>
                )}
              </p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
