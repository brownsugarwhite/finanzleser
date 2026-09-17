import type { Metadata } from "next";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte from "@/components/faden/karten/ListenKarte";
import BlattStart from "@/components/faden/kopf/BlattStart";
import { buildDokumentUrl } from "@/lib/urls";
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
  if (FADEN_AKTIV) {
    const gr = new Map<string, typeof dokumente>();
    for (const d of dokumente) { const k = d.dokumentKategorien?.nodes?.[0]?.name || "Weitere Dokumente"; (gr.get(k) || gr.set(k, []).get(k)!).push(d); }
    return (
      <KartenKapitel schluessel="blatt:dokumente" titel="Dokumente" kicker="Service · Vorlagen und Formulare" beschreibung={`${dokumente.length} Dokumente mit Vorschau und Download; Leo erklärt die Felder auf Nachfrage.`} krumen={[{ name: "Service", href: "/dokumente" }, { name: "Dokumente", href: "/dokumente" }]} url="/dokumente">
        <BlattStart schluessel="service" a="dokumente" />
        <ListenKarte gruppen={[...gr.entries()].map(([k, liste]) => ({ titel: k, zahl: liste.length, eintraege: liste.map((d) => ({ titel: d.title, href: buildDokumentUrl(d.slug), dot: "dokumente" as const })).sort((a, b) => a.titel.localeCompare(b.titel, "de")) }))} />
      </KartenKapitel>
    );
  }
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
