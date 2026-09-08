/**
 * Spielseite: /spiele/<slug>. Stufe 1 kennt das Finanzwort des Tages (finanzwort-YYYY-MM-DD),
 * jede Ausgabe hat ihre eigene Adresse. Ohne NEXT_PUBLIC_FADEN=1 gibt es die Route nicht
 * (404, keine Prerender-Parameter). Das Lösungswort steht nicht im HTML – es reist nur als
 * Prop der Client-Komponente (RSC-Payload); Beschreibung und Metadaten nennen es nicht.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getAllSpiele } from "@/lib/wordpress";
import { spielNummer } from "@/lib/faden/spiele";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import type { Spiel } from "@/lib/types";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";
import KartenKapitel from "@/components/faden/KartenKapitel";
import FinanzwortKarte, { spielwort } from "@/components/faden/spiele/FinanzwortKarte";
import { spielUrl } from "@/components/faden/spiele/spielUrl";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

/** Freigegebenes Finanzwort zu einem Slug (aus der einen gecachten Spiele-Abfrage). */
async function finanzwortNachSlug(slug: string): Promise<Spiel | null> {
  return (await getAllSpiele()).find((s) => s.slug === slug && s.typ === "finanzwort" && s.status !== "entwurf") || null;
}

function datumLesbar(datum: string | null): string {
  if (!datum) return "";
  const [j, m, t] = datum.split("-").map(Number);
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(Date.UTC(j, m - 1, t, 12)));
}

export async function generateStaticParams() {
  if (!FADEN_AKTIV) return [];
  return (await getAllSpiele()).filter((s) => s.typ === "finanzwort" && s.status !== "entwurf").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const spiel = FADEN_AKTIV ? await finanzwortNachSlug(slug) : null;
  if (!spiel) return { title: `Spiel nicht gefunden – ${SITE_NAME}`, robots: { index: false, follow: false } };
  const nr = await spielNummer(spiel);
  const laenge = spielwort(spiel.felder.wort).length;
  return buildMetadata({
    title: `Finanzwort des Tages #${nr} – ${SITE_NAME}`,
    description: `Ein Begriff aus dem Glossar, ${laenge} Buchstaben, sechs Versuche, teilbar wie Wordle. Finanzwort #${nr}${spiel.datum ? ` vom ${datumLesbar(spiel.datum)}` : ""}.`,
    path: spielUrl(slug),
  });
}

export default async function SpielSeite({ params }: Props) {
  if (!FADEN_AKTIV) notFound();
  const { slug } = await params;
  const spiel = await finanzwortNachSlug(slug);
  if (!spiel) notFound();
  const nr = await spielNummer(spiel);
  const pfad = spielUrl(slug);
  const titel = `Finanzwort des Tages #${nr}`;
  const krumen = [{ name: "Service", href: "/glossar" }, { name: "Spiele", href: pfad }, { name: "Finanzwort", href: pfad }];
  return (
    <>
      <JsonLd data={breadcrumbSchema(krumen.map((k) => ({ name: k.name, path: k.href })))} />
      <KartenKapitel schluessel={`spiel:${slug}`} titel={titel} kicker={`Spiel${spiel.datum ? ` · ${datumLesbar(spiel.datum)}` : ""}`} beschreibung="Ein Begriff aus dem Glossar, sechs Versuche, teilbar wie Wordle." krumen={krumen} url={pfad}>
        <FinanzwortKarte spiel={spiel} />
      </KartenKapitel>
    </>
  );
}
