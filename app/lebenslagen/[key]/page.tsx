/**
 * Lebenslage als Kapitel (z. B. „Ein Kind kommt“): Phasen mit Schritten aus dem CMS
 * (mu-plugin finanzleser-faden, Option faden_lebensereignisse). Nur mit NEXT_PUBLIC_FADEN=1.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import { getFadenOptionen } from "@/lib/faden/optionen";
import { verweiseAufloesen } from "@/lib/faden/titel";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import KartenKapitel from "@/components/faden/KartenKapitel";
import EreignisKarte, { type EreignisZiel } from "@/components/faden/karten/EreignisKarte";

export const revalidate = 86400;

export async function generateStaticParams() {
  if (!FADEN_AKTIV) return [];
  const { lebensereignisse } = await getFadenOptionen();
  return lebensereignisse.map((e) => ({ key: e.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const { lebensereignisse } = await getFadenOptionen();
  const e = lebensereignisse.find((x) => x.key === key);
  if (!e) return {};
  const schritte = e.phasen.reduce((n, p) => n + p.schritte.length, 0);
  return buildMetadata({
    title: `${e.titel}: Was jetzt zu tun ist – ${SITE_NAME}`,
    description: `${schritte} Schritte in der Reihenfolge, in der sie kommen: ${e.phasen.map((p) => p.titel).join(", ")}. Mit Rechnern, Checklisten und Ratgebern von finanzleser.de.`,
    path: `/lebenslagen/${e.key}`,
  });
}

export default async function LebenslageSeite({ params }: { params: Promise<{ key: string }> }) {
  if (!FADEN_AKTIV) notFound();
  const { key } = await params;
  const { lebensereignisse, waechterRegeln } = await getFadenOptionen();
  const e = lebensereignisse.find((x) => x.key === key);
  if (!e) notFound();
  // Ziel-Adressen je Schritt (Beiträge über den gecachten Beitragsindex, Werkzeuge über lib/urls).
  const ziele: Record<string, EreignisZiel> = {};
  for (const p of e.phasen) for (const s of p.schritte) {
    const k = `${s.typ}:${s.slug}`;
    if (ziele[k]) continue;
    const [v] = await verweiseAufloesen([{ typ: s.typ as "post" | "rechner" | "checkliste" | "vergleich" | "dokumente" | "glossar", slug: s.slug }]);
    if (v) ziele[k] = { href: v.href, titel: v.titel };
  }
  const schritte = e.phasen.reduce((n, p) => n + p.schritte.length, 0);
  const url = `/lebenslagen/${e.key}`;
  return (
    <KartenKapitel schluessel={`lebenslage:${e.key}`} titel={`${e.titel}: Was jetzt zu tun ist`} kicker="Lebenslage" beschreibung={`${schritte} Schritte in ${e.phasen.length} Phasen, in der Reihenfolge, in der sie kommen. Leo hakt mit ab und stellt die Wecker.`} krumen={[{ name: "Ratgeber", href: "/" }, { name: "Lebenslagen", href: "/lebenslagen" }]} url={url}>
      <div className="kasten kasten--lila" id={`kasten-lebenslage-${e.key}`}>
        <span className="kicker kicker--tool kicker--gruen"><i className="dot dot--checkliste" />Lebensereignis</span>
        <h3>{e.titel}</h3>
        <EreignisKarte ereignis={e} ziele={ziele} regeln={waechterRegeln} />
      </div>
    </KartenKapitel>
  );
}
