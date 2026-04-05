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
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Kategorie */}
          <Link
            href="/finanztools/checklisten"
            className="inline-block mt-4 text-sm font-medium"
            style={{
              color: "var(--color-tool-checklisten)",
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
            }}
          >
            Checklisten
          </Link>

          {/* Titel */}
          <h1
            className="mt-2 mb-4 font-bold"
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
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
                color: "var(--color-text-medium)",
                lineHeight: 1.6,
              }}
            >
              {beschreibung}
            </p>
          )}

          {/* Interaktive Checkliste */}
          {parsedData && parsedData.sektionen.length > 0 ? (
            <InteraktiveCheckliste data={parsedData} pdfUrl={pdfUrl} slug={slug} checkboxPositions={checkboxPositions} />
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

          {/* Disclaimer */}
          <p className="mt-12 text-xs text-gray-400">
            Hinweis: Diese Checkliste ersetzt keine professionelle Beratung. Für
            komplexe Fragen empfehlen wir die Unterstützung durch einen
            Fachmann.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
