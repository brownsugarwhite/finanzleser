import Link from "next/link";
import type { Metadata } from "next";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import ListenKarte, { type ListenGruppe } from "@/components/faden/karten/ListenKarte";
import BlattStart from "@/components/faden/kopf/BlattStart";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/components/seo/JsonLd";
import { buildVergleichUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import { getAllVergleiche } from "@/lib/wordpress";
import { getVergleichUebersicht } from "@/lib/financeads/laden";
import { GRUPPEN_LABEL, kategorieDef } from "@/lib/financeads/registry";
import { formatStand } from "@/lib/financeads/format";
import type { Gruppe } from "@/lib/financeads/typen";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: `Vergleiche – Tarife und Konditionen nebeneinander – ${SITE_NAME}`,
  description: "Tagesgeld, Festgeld, Girokonto, Kreditkarte, Kredit, Baufinanzierung und Versicherungen: die Angebote unserer Partner nebeneinander, mit Stand und Bestwert. Finanzleser erhält eine Provision, die Reihenfolge bleibt redaktionell.",
  path: "/finanztools/vergleiche",
});

const REIHENFOLGE: (Gruppe | "weitere")[] = ["anlegen", "konto", "kredit", "versicherung", "weitere"];

/** Übersicht in Rubriken: financeads-Vergleiche nach Registry-Gruppe mit Kennzahl, Fremd-Embeds unter „Weitere". */
async function gruppen(): Promise<{ titel: string; eintraege: { titel: string; href: string; meta?: string; defekt?: boolean }[] }[]> {
  const [vergleiche, uebersicht] = [await getAllVergleiche(), await getVergleichUebersicht()];
  const nach = new Map<string, { titel: string; href: string; meta?: string; defekt?: boolean }[]>();
  for (const v of vergleiche) {
    const titel = decodeHtmlEntities(v.title).replace(/\s*[–-]?\s*Vergleich$/i, "").trim();
    const u = uebersicht[v.slug];
    const def = u ? kategorieDef(u.kategorie) : null;
    const gruppe: Gruppe | "weitere" = def ? def.gruppe : "weitere";
    const meta = u?.defekt ? "wird überarbeitet" : u && def && u.anzahl ? `${u.anzahl} ${def.mehrzahl} · Stand ${formatStand(u.stand)}` : undefined;
    const liste = nach.get(gruppe) || [];
    liste.push({ titel, href: buildVergleichUrl(v.slug), meta, defekt: !!u?.defekt });
    nach.set(gruppe, liste);
  }
  return REIHENFOLGE.flatMap((g) => {
    const liste = nach.get(g);
    if (!liste?.length) return [];
    liste.sort((a, b) => a.titel.localeCompare(b.titel, "de"));
    return [{ titel: g === "weitere" ? "Weitere Vergleiche unserer Partner" : GRUPPEN_LABEL[g], eintraege: liste }];
  });
}

export default async function VergleichePage() {
  const rubriken = await gruppen();
  const gesamt = rubriken.reduce((n, r) => n + r.eintraege.length, 0);
  const jsonLd = (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Finanztools", path: "/finanztools" }, { name: "Vergleiche", path: "/finanztools/vergleiche" }])} />
      <JsonLd data={itemListSchema(rubriken.flatMap((r) => r.eintraege.map((e) => ({ name: e.titel, path: e.href }))))} />
    </>
  );

  if (FADEN_AKTIV) {
    const listen: ListenGruppe[] = rubriken.map((r) => ({ titel: r.titel, zahl: r.eintraege.length, eintraege: r.eintraege.map((e) => ({ titel: e.titel, href: e.href, meta: e.meta, dot: "vergleich" as const })) }));
    return (
      <>
        {jsonLd}
        <KartenKapitel schluessel="blatt:vergleiche" titel="Vergleiche" kicker="Finanztools · Anzeige · Vergleiche mit Partnerlinks" beschreibung={`${gesamt} Vergleiche, die Tarife unserer Partner nebeneinander — mit Stand und Bestwert. Finanzleser erhält eine Provision, die Reihenfolge bleibt redaktionell.`} krumen={[{ name: "Finanztools", href: "/finanztools" }, { name: "Vergleiche", href: "/finanztools/vergleiche" }]} url="/finanztools/vergleiche">
          <BlattStart schluessel="finanztools" a="vergleich" />
          <ListenKarte gruppen={listen} />
        </KartenKapitel>
      </>
    );
  }

  return (
    <>
      {jsonLd}
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finanztools", href: "/finanztools" }]} />
          <h1 className="text-4xl font-bold mb-6 mt-4">Vergleiche</h1>
          <p className="text-lg text-gray-600 mb-12">
            {gesamt} Vergleiche: die Angebote unserer Partner nebeneinander, mit Stand und Bestwert. Finanzleser erhält bei einem Abschluss eine Provision, die Reihenfolge bleibt redaktionell.
          </p>
          {rubriken.map((r) => (
            <section key={r.titel} className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{r.titel}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {r.eintraege.map((e) => (
                  <Link key={e.href} href={e.href} className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white" style={{ borderLeftWidth: 3, borderLeftColor: "var(--color-tool-vergleiche)" }}>
                    <h3 className="font-semibold text-gray-900">{e.titel}</h3>
                    {e.meta && <p className="text-sm text-gray-600 mt-1">{e.meta}</p>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
