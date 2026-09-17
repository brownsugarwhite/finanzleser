/**
 * Begriffskapitel: /glossar/<slug>. Erklärung, Quelle, Varianten, Ratgeber, Werkzeug und
 * die vorbereitete Leo-Frage stehen im SSR-HTML; JSON-LD DefinedTerm + BreadcrumbList.
 * Ohne NEXT_PUBLIC_FADEN=1 gibt es die Route nicht (404, keine Prerender-Parameter).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getAllGlossar, getGlossarBySlug } from "@/lib/wordpress";
import { buildMetadata, stripHtml, truncate, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { buildGlossarUrl } from "@/lib/urls";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";
import KartenKapitel from "@/components/faden/KartenKapitel";
import BegriffKarte from "@/components/faden/karten/BegriffKarte";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  if (!FADEN_AKTIV) return [];
  return (await getAllGlossar()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = FADEN_AKTIV ? await getGlossarBySlug(slug) : null;
  if (!e) return { title: `Begriff nicht gefunden – ${SITE_NAME}`, robots: { index: false, follow: false } };
  return buildMetadata({
    title: `${decodeHtmlEntities(e.title)} – Glossar – ${SITE_NAME}`,
    description: truncate(stripHtml(e.content), 160),
    path: buildGlossarUrl(slug),
  });
}

export default async function BegriffSeite({ params }: Props) {
  if (!FADEN_AKTIV) notFound();
  const { slug } = await params;
  const e = await getGlossarBySlug(slug);
  if (!e) notFound();
  const titel = decodeHtmlEntities(e.title);
  const pfad = buildGlossarUrl(slug);
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        name: titel,
        description: stripHtml(e.content),
        url: absoluteUrl(pfad),
        inDefinedTermSet: { "@type": "DefinedTermSet", name: "Finanzleser Glossar", url: absoluteUrl("/glossar") },
      }} />
      <JsonLd data={breadcrumbSchema([{ name: "Service", path: "/glossar" }, { name: "Glossar", path: "/glossar" }, { name: titel, path: pfad }])} />
      <KartenKapitel schluessel={`begriff:${slug}`} titel={titel} kicker={`Glossar${e.rubrik ? ` · ${e.rubrik}` : ""}`} krumen={[{ name: "Service", href: "/glossar" }, { name: "Glossar", href: "/glossar" }]} url={pfad}>
        <BegriffKarte eintrag={e} />
      </KartenKapitel>
    </>
  );
}
