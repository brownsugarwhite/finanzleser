/**
 * Glossar-Übersicht: alle Begriffe A–Z als Listenkarte, dazu das Nachschlagewerk im
 * Registerblatt (Service · Glossar). Nur mit NEXT_PUBLIC_FADEN=1.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getAllGlossar } from "@/lib/wordpress";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { buildGlossarUrl } from "@/lib/urls";
import type { GlossarEintrag } from "@/lib/types";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte from "@/components/faden/karten/ListenKarte";
import BlattStart from "@/components/faden/kopf/BlattStart";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: `Glossar – Finanzbegriffe erklärt – ${SITE_NAME}`,
  description: "Finanzbegriffe kurz erklärt, mit Quelle, passendem Ratgeber und Werkzeug: von Abfindung bis Zinseszins.",
  path: "/glossar",
});

const UMLAUT: Record<string, string> = { "Ä": "A", "Ö": "O", "Ü": "U" };

export default async function GlossarUebersicht() {
  if (!FADEN_AKTIV) notFound();
  const alle = await getAllGlossar();
  const gruppen = new Map<string, GlossarEintrag[]>();
  for (const e of alle) {
    const b = decodeHtmlEntities(e.title).charAt(0).toUpperCase().replace(/[ÄÖÜ]/, (c) => UMLAUT[c] || c);
    (gruppen.get(b) || gruppen.set(b, []).get(b)!).push(e);
  }
  return (
    <KartenKapitel schluessel="blatt:glossar" titel="Glossar" kicker={`Service · ${alle.length} Begriffe`} beschreibung="Jeder Begriff mit Erklärung, Quelle, passendem Ratgeber und Werkzeug. Grüne Begriffe im Text öffnen dieselbe Erklärung an Ort und Stelle; die Sitzung merkt sie sich rechts." krumen={[{ name: "Service", href: "/glossar" }, { name: "Glossar", href: "/glossar" }]} url="/glossar">
      <BlattStart schluessel="service" a="glossar" />
      <ListenKarte gruppen={[...gruppen.entries()].map(([b, liste]) => ({ titel: b, zahl: liste.length, eintraege: liste.map((e) => ({ titel: decodeHtmlEntities(e.title), href: buildGlossarUrl(e.slug), meta: e.rubrik || undefined })) }))} />
    </KartenKapitel>
  );
}
