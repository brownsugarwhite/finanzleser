import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FADEN_AKTIV } from "@/lib/faden/flag";
import KartenKapitel from "@/components/faden/KartenKapitel";
import Insel from "@/components/faden/kette/Insel";
import Weiterlesen from "@/components/faden/kette/Weiterlesen";
import Statistik from "@/components/statistik/Statistik";
import VergleichKoerper from "@/components/vergleich/VergleichKoerper";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageAds from "@/components/layout/PageAds";
import { JsonLd, breadcrumbSchema, faqSchema, webPageSchema } from "@/components/seo/JsonLd";
import { getAllVergleiche, getSiteSettings } from "@/lib/wordpress";
import { holeVergleich } from "@/lib/financeads/holeVergleich";
import { defLite } from "@/lib/financeads/registry";
import { kurzSatz } from "@/lib/financeads/format";
import { parseContent } from "@/lib/articleHtml";
import { extractFaqPairs } from "@/lib/articleFaq";
import { parseStatistik } from "@/lib/statistik/schema";
import { buildMetadata, SITE_NAME, stripHtml, absoluteUrl } from "@/lib/seo";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { cleanDescription } from "@/lib/content-utils";
import type { FadenFrage } from "@/lib/types";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

/** Anzeige-Titel ohne „… Vergleich"-Suffix (Konvention der CPT-Titel). */
function anzeigeTitel(title: string): string {
  return decodeHtmlEntities(title).replace(/\s*[–-]?\s*Vergleich$/i, "").trim();
}

/**
 * Der Redaktionstext des CPT, geteilt am Quelle-Block: was davor steht, erscheint über der
 * Liste, was danach steht, darunter. Statistik-Blöcke (finanzleser/statistik) werden im
 * Faden als Form gerendert; auf der alten Seite bleibt nur die Prosa (ihr CSS ist auf
 * .faden-shell gescoped).
 */
function redaktion(content: string) {
  const html = content || "";
  const i = html.search(/<div class="fl-vergleich-src"[^>]*>\s*<\/div>/);
  const davor = i >= 0 ? html.slice(0, i) : html;
  const danach = i >= 0 ? html.slice(i).replace(/<div class="fl-vergleich-src"[^>]*>\s*<\/div>/, "") : "";
  const teile = (h: string) => parseContent(h).filter((t) => (t.type === "html" && stripHtml(t.value).trim()) || t.type === "statistik");
  return { davor: teile(davor), danach: teile(danach) };
}

function Teile({ teile, faden }: { teile: ReturnType<typeof parseContent>; faden: boolean }) {
  return (
    <>
      {teile.map((t, i) => {
        if (t.type === "statistik") {
          if (!faden) return null;
          const st = parseStatistik(t.value);
          return st ? <Insel key={i} typ="statistik-block" werte={st}><Statistik st={st} /></Insel> : null;
        }
        if (t.type === "html") return <div key={i} className="prose vgl-redaktion" dangerouslySetInnerHTML={{ __html: t.value }} />;
        return null;
      })}
    </>
  );
}

async function lade(slug: string) {
  const v = await holeVergleich(slug);
  if (!v) return null;
  const title = anzeigeTitel(v.cpt.title);
  const excerpt = stripHtml(v.cpt.excerpt || "").trim();
  const def = v.art === "financeads" ? defLite(v.def) : null;
  const daten = v.art === "financeads" ? v.daten : null;
  const satz = def ? kurzSatz(def, daten) : "";
  const fragen: FadenFrage[] = (v.cpt.faden?.leoFragen ?? []).filter((f) => f.frage && f.antwort);
  return { v, title, excerpt, def, daten, satz, fragen, defekt: v.art === "financeads" && !!v.def.defekt };
}

export async function generateStaticParams() {
  return (await getAllVergleiche()).map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await lade(slug);
  const title = d?.title || slug;
  const beschreibung = d ? [d.satz, d.excerpt].filter(Boolean).join(" ") : "";
  return buildMetadata({
    title: `${title} – Vergleich – ${SITE_NAME}`,
    description: beschreibung || `Vergleichen Sie aktuelle Angebote: ${title}`,
    path: `/finanztools/vergleiche/${slug}`,
    // Unbekannt → 404 (notFound); defekter Endpunkt → Seite bleibt, aber ohne Index.
    noIndex: !d || d.defekt,
  });
}

export default async function VergleichDetailPage({ params }: Props) {
  const { slug } = await params;
  const d = await lade(slug);
  // notFound() statt eigenem „nicht verfügbar"-Rendering — sonst HTTP 200 auf jeden
  // erfundenen Slug (Soft-404). Siehe app/finanztools/rechner/[slug]/page.tsx.
  if (!d) notFound();

  const { v, title, excerpt, def, daten, satz, fragen } = d;
  const pfad = `/finanztools/vergleiche/${slug}`;
  const { davor, danach } = redaktion(v.cpt.content || "");
  const beschreibung = cleanDescription([satz, excerpt].filter(Boolean).join(" "));

  // FAQPage: Frage-Antwort-Paare aus dem CPT-Text plus Leos Fragen (Muster der Beitragsseite).
  const faqPairs = [...extractFaqPairs(v.cpt.content)];
  const bekannt = new Set(faqPairs.map((f) => f.q.trim().toLowerCase()));
  for (const f of fragen) {
    const frage = f.frage.trim(); const antwort = stripHtml(f.antwort).trim();
    if (!frage || !antwort || bekannt.has(frage.toLowerCase())) continue;
    bekannt.add(frage.toLowerCase()); faqPairs.push({ q: frage, a: antwort });
  }
  // ItemList: die Angebote der Voreinstellung mit Namen — keine Affiliate-Links, kein Product/Offer.
  const standard = daten?.varianten[0];
  const itemList = standard && def ? {
    "@context": "https://schema.org", "@type": "ItemList",
    name: `${title} – ${standard.produkte.length} ${def.mehrzahl}`,
    numberOfItems: standard.produkte.length,
    itemListElement: standard.produkte.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: `${p.anbieter} ${p.tarif}`.trim() })),
  } : null;
  const dateModified = daten?.stand || v.cpt.modified || v.cpt.date;
  const krumen = [{ name: "Finanztools", path: "/finanztools" }, { name: "Vergleiche", path: "/finanztools/vergleiche" }, { name: title, path: pfad }];

  const jsonLd = (
    <>
      <JsonLd data={{ ...webPageSchema({ name: `${title} – Vergleich`, description: beschreibung, path: pfad }), ...(dateModified ? { dateModified } : {}) }} />
      <JsonLd data={breadcrumbSchema(krumen)} />
      {itemList && <JsonLd data={itemList} />}
      {faqPairs.length > 0 && <JsonLd data={faqSchema(faqPairs)} />}
    </>
  );

  if (FADEN_AKTIV) {
    return (
      <>
        {jsonLd}
        <KartenKapitel schluessel={`vergleich:${slug}`} titel={title} kicker="Anzeige · Vergleich mit Partnerlinks" beschreibung={beschreibung} krumen={[{ name: "Finanztools", href: "/finanztools" }, { name: "Vergleiche", href: "/finanztools/vergleiche" }]} url={pfad}>
          <Teile teile={davor} faden />
          <VergleichKoerper slug={slug} skin="faden" mitSaeulen />
          <Teile teile={danach} faden />
          {fragen.length > 0 && (
            <section className="vgl-fragen">
              <span className="kicker kicker--gruen">Dazu wird oft gefragt</span>
              <Insel typ="weiterlesen" werte={fragen}><Weiterlesen fragen={fragen} /></Insel>
            </section>
          )}
        </KartenKapitel>
      </>
    );
  }

  const settings = await getSiteSettings();
  return (
    <>
      {jsonLd}
      <main className="min-h-screen bg-white">
        <PageAds
          ads={settings.ads.vergleich}
          variant="tool"
          contentWidth={1200}
          contentClassName="pb-12"
          heading={
            <>
              <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finanztools", href: "/finanztools" }, { label: "Vergleiche", href: "/finanztools/vergleiche" }]} />
              <Link href="/finanztools/vergleiche" className="cpt-eyebrow mb-2 inline-block transition hover:opacity-80" style={{ color: "var(--color-tool-vergleiche)", fontFamily: "Merriweather, serif", fontSize: "23px", fontStyle: "italic" }}>
                Vergleich
              </Link>
              <h1 className="cpt-title font-bold mb-4" style={{ fontSize: "42px", lineHeight: "1.3em" }}>{title}</h1>
              <p className="cpt-desc mb-8 text-gray-600" style={{ fontFamily: "Merriweather, serif", fontSize: "18px", fontWeight: "400" }}>{beschreibung}</p>
            </>
          }
        >
          <Teile teile={davor} faden={false} />
          <VergleichKoerper slug={slug} skin="alt" />
          <Teile teile={danach} faden={false} />
          {fragen.length > 0 && (
            <section className="vgl-fragen vgl-fragen--alt mt-12">
              <h2 className="text-2xl font-bold mb-4">Dazu wird oft gefragt</h2>
              {fragen.map((f, i) => (
                <details key={i} className="vgl-frage">
                  <summary>{f.frage}</summary>
                  <div className="prose" dangerouslySetInnerHTML={{ __html: f.antwort }} />
                </details>
              ))}
            </section>
          )}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Alle Angaben sind unverbindlich. {def ? "Die Angebote stammen von unserem Partner financeads; für einen Abschluss gelangen Sie über den Link zum Anbieter." : "Vergleichsergebnisse werden von externen Anbietern bereitgestellt."} Für verbindliche Angebote wenden Sie sich direkt an den jeweiligen Anbieter.
            </p>
          </div>
        </PageAds>
      </main>
      <Footer />
    </>
  );
}
