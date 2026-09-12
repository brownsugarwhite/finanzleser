/** Übersicht der Lebenslagen (Kapitel je Ereignis). Nur mit NEXT_PUBLIC_FADEN=1. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen } from "@/lib/faden/optionen";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte from "@/components/faden/karten/ListenKarte";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: `Lebenslagen: Was jetzt zu tun ist – ${SITE_NAME}`,
  description: "Ein Kind kommt, ein Hund zieht ein, der erste Job: die Schritte in der Reihenfolge, in der sie kommen, mit Rechnern, Checklisten und Ratgebern.",
  path: "/lebenslagen",
});

export default async function LebenslagenUebersicht() {
  if (!FADEN_AKTIV) notFound();
  const { lebensereignisse } = await getFadenOptionen();
  return (
    <KartenKapitel schluessel="blatt:lebenslagen" titel="Lebenslagen" kicker={`Ratgeber · ${lebensereignisse.length} Ereignisse`} beschreibung="Jedes Ereignis als Zeitleiste: Anträge, Fristen und Versicherungsfragen in der Reihenfolge, in der sie kommen." krumen={[{ name: "Ratgeber", href: "/" }, { name: "Lebenslagen", href: "/lebenslagen" }]} url="/lebenslagen">
      <ListenKarte gruppen={[{ eintraege: lebensereignisse.map((e) => ({ titel: e.titel, untertitel: e.phasen.map((p) => p.titel).join(" · "), href: `/lebenslagen/${e.key}`, dot: "checkliste" as const })) }]} />
    </KartenKapitel>
  );
}
