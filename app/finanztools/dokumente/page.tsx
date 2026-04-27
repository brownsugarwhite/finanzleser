import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getAllDokumente } from "@/lib/wordpress";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import DokumenteListClient from "./DokumenteListClient";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: `Dokumente – Broschüren & Ratgeber – ${SITE_NAME}`,
  description:
    "Aktuelle Broschüren, Merkblätter, Tabellen und Formulare aus den Bereichen Finanzen, Steuern, Versicherungen und Recht – kostenlos zum Download.",
  path: "/finanztools/dokumente",
});

export default async function DokumentePage() {
  const dokumente = await getAllDokumente();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Finanztools", href: "/finanztools" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <Breadcrumb items={breadcrumbItems} />

          <h1 className="text-4xl font-bold mb-6 mt-4">Dokumente</h1>
          <p className="text-lg text-gray-600 mb-8">
            Broschüren, Merkblätter, Tabellen und Formulare aus Finanzen, Steuern,
            Versicherungen und Recht – kostenlos zum Download.
          </p>

          <DokumenteListClient dokumente={dokumente} />
        </div>
      </main>
      <Footer />
    </>
  );
}
