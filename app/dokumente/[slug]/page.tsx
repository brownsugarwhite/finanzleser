import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import DokumentPreview from "@/components/dokument/DokumentPreview";
import DokumentDownload from "@/components/dokument/DokumentDownload";
import { getAllDokumente, getDokumentBySlug } from "@/lib/wordpress";
import { buildMetadata, stripHtml, SITE_NAME } from "@/lib/seo";

export const revalidate = 86400;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const dokumente = await getAllDokumente();
  return dokumente.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dokument = await getDokumentBySlug(slug);

  if (!dokument) {
    return {
      title: `Dokument nicht gefunden – ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  return buildMetadata({
    title: `${dokument.title} – Dokument – ${SITE_NAME}`,
    description:
      stripHtml(dokument.excerpt) ||
      `Dokument zum Download: ${dokument.title}`,
    path: `/dokumente/${slug}`,
  });
}

export default async function DokumentDetailPage({ params }: Props) {
  const { slug } = await params;
  const dokument = await getDokumentBySlug(slug);

  if (!dokument) {
    return (
      <>
        <main className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-6">Dokument nicht gefunden</h1>
            <p className="text-lg text-gray-600">
              Das angeforderte Dokument existiert nicht.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pdfUrl = dokument.pdfFile?.mediaItemUrl || "";
  const fileName = dokument.pdfFile?.mediaDetails?.file?.split("/").pop();
  const beschreibung = stripHtml(dokument.excerpt);
  const kategorie = dokument.dokumentKategorien?.nodes?.[0];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Dokumente", href: "/dokumente" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div style={{ maxWidth: 1200 }} className="mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          {/* 2-Column (50/50): Dokumentvorschau im Rahmen mit Eck-Winkeln links,
              Heading + Beschreibung + Download rechts (oben, linksbündig). */}
          <div className="dokument-detail-grid">
            <div className="dokument-detail-preview">
              <div className="dok-card-frame">
                <div className="dok-card-sheet">
                  <DokumentPreview slug={slug} pdfUrl={pdfUrl} title={dokument.title} />
                </div>
              </div>
            </div>

            <div className="dokument-detail-info">
              {/* Eyebrow */}
              <Link
                href="/dokumente"
                className="cpt-eyebrow"
                style={{
                  display: "inline-block",
                  marginBottom: 8,
                  color: "var(--color-tool-dokumente)",
                  fontFamily: "Merriweather, serif",
                  fontSize: "23px",
                  fontStyle: "italic",
                  transition: "opacity 0.2s",
                }}
              >
                {kategorie ? `Dokumente · ${kategorie.name}` : "Dokumente"}
              </Link>

              {/* Titel */}
              <h1
                className="cpt-title"
                style={{
                  fontSize: "42px",
                  lineHeight: "1.3em",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                {dokument.title}
              </h1>

              {/* Beschreibung */}
              {beschreibung && (
                <p
                  className="cpt-desc"
                  style={{
                    fontSize: "18px",
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-text-primary)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {beschreibung}
                </p>
              )}

              <div className="dokument-detail-download">
                <DokumentDownload
                  pdfUrl={pdfUrl}
                  fileName={fileName}
                  fileSize={dokument.pdfFile?.fileSize}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
