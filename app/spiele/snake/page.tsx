/**
 * Snake — /spiele/snake.
 *
 * Ein statisches Segment schlägt in Next die dynamische Nachbarroute `[slug]`, deshalb
 * gibt es keine Kollision; deren `generateStaticParams` filtert ohnehin auf
 * `typ === "finanzwort"`. Anders als das Finanzwort ist Snake kein CMS-Spiel: kein Datum,
 * keine Redaktionsfelder, kein Eintrag in `Spiel["typ"]`. Es steht immer bereit.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";
import KartenKapitel from "@/components/faden/KartenKapitel";
import SnakeKarte from "@/components/faden/spiele/SnakeKarte";
import { spielUrl } from "@/components/faden/spiele/spielUrl";

export const revalidate = 86400;

const PFAD = spielUrl("snake");

export function generateMetadata(): Metadata {
  if (!FADEN_AKTIV) return { title: `Spiel nicht gefunden – ${SITE_NAME}`, robots: { index: false, follow: false } };
  return buildMetadata({
    title: `Snake – ${SITE_NAME}`,
    description: "Der Klassiker vom Tastenhandy, im Zeitungssatz: Münzen sammeln, Schulden meiden. Pfeiltasten oder WASD, Leertaste pausiert.",
    path: PFAD,
  });
}

export default function SnakeSeite() {
  if (!FADEN_AKTIV) notFound();
  const krumen = [{ name: "Service", href: "/glossar" }, { name: "Spiele", href: PFAD }, { name: "Snake", href: PFAD }];
  return (
    <>
      <JsonLd data={breadcrumbSchema(krumen.map((k) => ({ name: k.name, path: k.href })))} />
      <KartenKapitel
        schluessel="spiel:snake"
        titel="Snake"
        kicker="Spiel · immer offen"
        beschreibung="Münzen sammeln, Schulden meiden. Je länger die Schlange, desto schwerer wird es, sich selbst aus dem Weg zu gehen."
        krumen={krumen}
        url={PFAD}
      >
        <SnakeKarte />
      </KartenKapitel>
    </>
  );
}
