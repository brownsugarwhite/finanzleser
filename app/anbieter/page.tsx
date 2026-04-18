import { getAllAnbieter } from "@/lib/wordpress";
import AnbieterListLayout from "@/components/layout/AnbieterListLayout";

export const revalidate = 300;

export const metadata = {
  title: "Anbieter – finanzleser.de",
  description: "Kontaktdaten von Versicherern und Finanzanbietern auf einen Blick.",
};

export default async function AnbieterOverviewPage() {
  const anbieter = await getAllAnbieter();
  const sorted = [...anbieter].sort((a, b) => a.title.localeCompare(b.title, "de"));
  return <AnbieterListLayout anbieter={sorted} />;
}
