import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import CategoryHeader from "@/components/layout/CategoryHeader";
import PageAds from "@/components/layout/PageAds";
import { getAllDokumente, getSiteSettings } from "@/lib/wordpress";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import DokumenteListClient from "./DokumenteListClient";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: `Dokumente – Broschüren & Ratgeber – ${SITE_NAME}`,
  description:
    "Aktuelle Broschüren, Merkblätter, Tabellen und Formulare aus den Bereichen Finanzen, Steuern, Versicherungen und Recht – kostenlos zum Download.",
  path: "/dokumente",
});

export default async function DokumentePage() {
  const dokumente = await getAllDokumente();
  const settings = await getSiteSettings();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Dokumente", href: "#" },
  ];

  return (
    <>
      <main className="min-h-screen bg-white">
        <CategoryHeader
          title="Dokumente"
          breadcrumbItems={breadcrumbItems}
          imageWide="/headers/dokumente_wide.webp"
          imageWideAlt="Dokumente"
          description="Broschüren, Merkblätter, Tabellen und Formulare aus Finanzen, Steuern, Versicherungen und Recht – kostenlos zum Download."
        />
        <div className="scalable-landing">
          <PageAds ads={settings.ads.dokumente} contentWidth={1040} contentClassName="pb-12">
            <DokumenteListClient dokumente={dokumente} />
          </PageAds>
        </div>
      </main>
      <Footer />
    </>
  );
}
