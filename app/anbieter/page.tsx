import { getAllAnbieter } from "@/lib/wordpress";
import AnbieterListLayout from "@/components/layout/AnbieterListLayout";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const revalidate = 86400;

// buildMetadata setzt den eigenen Canonical — ohne ihn erbte die Seite den
// Root-Canonical (Startseite) aus app/layout.tsx.
export const metadata = buildMetadata({
  title: `Anbieter – ${SITE_NAME}`,
  description: "Kontaktdaten von Versicherern und Finanzanbietern auf einen Blick.",
  path: "/anbieter",
});

export default async function AnbieterOverviewPage() {
  const anbieter = await getAllAnbieter();
  const sorted = [...anbieter].sort((a, b) => a.title.localeCompare(b.title, "de"));
  return <AnbieterListLayout anbieter={sorted} />;
}
