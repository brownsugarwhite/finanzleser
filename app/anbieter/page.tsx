import { getAllAnbieter } from "@/lib/wordpress";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte from "@/components/faden/karten/ListenKarte";
import BlattStart from "@/components/faden/kopf/BlattStart";
import { buildAnbieterUrl } from "@/lib/urls";
import { splitAnbieterTitle } from "@/lib/anbieter-utils";
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
  if (FADEN_AKTIV) {
    const gr = new Map<string, typeof sorted>();
    for (const a of sorted) { const b = a.title.charAt(0).toUpperCase().replace(/[ÄÖÜ]/, (c) => ({ "Ä": "A", "Ö": "O", "Ü": "U" }[c] || c)); (gr.get(b) || gr.set(b, []).get(b)!).push(a); }
    return (
      <KartenKapitel schluessel="blatt:anbieter" titel="Anbieter" kicker="Service · Kontakt, Kündigung, Schaden" beschreibung={`${sorted.length} Versicherer mit Adresse, Telefonnummern und E-Mail für Vertrag, Kündigung und Schadenmeldung.`} krumen={[{ name: "Service", href: "/anbieter" }, { name: "Anbieter", href: "/anbieter" }]} url="/anbieter">
        <BlattStart schluessel="service" a="anbieter" />
        <ListenKarte gruppen={[...gr.entries()].map(([b, liste]) => ({ titel: b, zahl: liste.length, eintraege: liste.map((a) => { const t = splitAnbieterTitle(a.title); return { titel: t.name, href: buildAnbieterUrl(a.slug), meta: t.kicker || undefined }; }) }))} />
      </KartenKapitel>
    );
  }
  return <AnbieterListLayout anbieter={sorted} />;
}
