/**
 * Werkzeug als Karte im Faden: Rechner, Checkliste, Vergleich, Dokumente.
 *
 * Die Körper sind die Komponenten der alten Seite — RechnerEmbed (56 Rechner mit
 * rechner.css), ChecklisteEmbed (Embla-Slider, Download mit Haken), DokumenteEmbed
 * (pdf.js-Vorschau), VergleichEmbed. Hier kommt nur die Karten-Chrome dazu: Kicker mit
 * Farbpunkt, Titel, Leo-Einwurf. Titel und Daten kommen aus dem serverseitigen
 * Preload (lib/articleToolData) oder, wenn das Werkzeug nicht im Beitrag eingebettet
 * ist (Leo-Einwurf), aus den bestehenden gecachten Gettern.
 */
import type { ArticleToolData, DokumentCard } from "@/lib/articleToolData";
import type { Teil } from "@/lib/faden/kette";
import { buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl } from "@/lib/urls";
import { getRechnerBySlug, getChecklisteBySlug, getAllVergleiche, getDokumenteBySlugs } from "@/lib/wordpress";
import { loadChecklisteData, type ChecklisteInlineData } from "@/lib/checklisteData";
import { VERGLEICH_DESCRIPTIONS } from "@/lib/vergleichDescriptions";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { stripHtml } from "@/lib/seo";
import { medienUrl } from "@/lib/faden/medien";
import RechnerEmbed from "@/components/rechner/RechnerEmbed";
import ChecklisteEmbed from "@/components/checkliste/ChecklisteEmbed";
import DokumenteEmbed from "@/components/dokumente/DokumenteEmbed";
import VergleichEmbed from "@/components/vergleich/VergleichEmbed";
import KastenFuss from "./KastenFuss";
import Insel from "./Insel";

type Embed = Extract<Teil, { art: "embed" }>;

const LABEL: Record<Embed["typ"], { typ: string; dot: string; ton: string }> = {
  rechner: { typ: "Rechner", dot: "rechner", ton: "pink" },
  checkliste: { typ: "Checkliste", dot: "checkliste", ton: "lila" },
  vergleich: { typ: "Anzeige · Vergleich mit Partnerlinks", dot: "vergleich", ton: "tuerkis" },
  dokumente: { typ: "Dokumente", dot: "dokumente", ton: "terra" },
};

function titelAus(toolData: ArticleToolData | undefined, typ: Embed["typ"], slug: string): string | undefined {
  const t = toolData?.titles?.[`${typ}:${slug}`];
  return t?.title || undefined;
}

export const toolTitel = {
  eins: titelAus,
  /** Alle vorgeladenen Werkzeugtitel als `typ:slug` → Titel (für Verweise). */
  alle(toolData?: ArticleToolData): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, v] of Object.entries(toolData?.titles || {})) if (v?.title) out[key] = v.title;
    return out;
  },
};

export function werkzeugUrl(typ: Embed["typ"], slug: string): string {
  if (typ === "rechner") return buildRechnerUrl(slug);
  if (typ === "checkliste") return buildChecklisteUrl(slug);
  if (typ === "vergleich") return buildVergleichUrl(slug);
  return buildDokumentUrl(slug);
}

/** Titel eines Werkzeugs: Preload, sonst gecachter Getter (nur für Einwürfe nötig). */
export async function werkzeugTitel(typ: Embed["typ"], slug: string, toolData?: ArticleToolData): Promise<string> {
  const vor = titelAus(toolData, typ, slug);
  if (vor) return vor;
  try {
    if (typ === "rechner") return (await getRechnerBySlug(slug))?.title || slug;
    if (typ === "checkliste") return (await getChecklisteBySlug(slug))?.title || slug;
    if (typ === "vergleich") {
      const v = (await getAllVergleiche()).find((x) => x.slug === slug);
      return v ? decodeHtmlEntities(v.title).replace(/\s*[–-]?\s*Vergleich$/i, "").trim() : (VERGLEICH_DESCRIPTIONS[slug] ? slug : slug);
    }
    const d = (await getDokumenteBySlugs([slug]))[0];
    return d?.title || slug;
  } catch {
    return slug.replace(/-/g, " ");
  }
}

async function dokumentKarten(slugs: string[], toolData?: ArticleToolData): Promise<DokumentCard[]> {
  const vor = toolData?.dokumente?.[slugs.join(",")];
  if (vor && vor.length) return vor.map((d) => ({ ...d, pdfUrl: medienUrl(d.pdfUrl) }));
  try {
    const docs = await getDokumenteBySlugs(slugs);
    return docs.map((d) => ({
      slug: d.slug,
      title: d.title,
      beschreibung: stripHtml(d.excerpt),
      pdfUrl: medienUrl(d.pdfFile?.mediaItemUrl || ""),
      fileName: d.pdfFile?.mediaDetails?.file?.split("/").pop(),
      fileSize: d.pdfFile?.fileSize,
      kategorie: d.dokumentKategorien?.nodes?.[0]?.name || "",
    }));
  } catch {
    return [];
  }
}

export default async function WerkzeugKarte({
  teil, toolData, ohneTitel, checklisteDaten, imInhalt,
}: {
  teil: Embed;
  toolData?: ArticleToolData;
  /** Eigener Eintrag im Inhaltsverzeichnis (Block am Beitragsende): Titel und Typ als data-Attribute. */
  imInhalt?: boolean;
  /** Auf der eigenen Seite des Werkzeugs steht der Titel schon im h1. */
  ohneTitel?: boolean;
  /** Bereits geparste Checkliste (Detailseite), spart einen zweiten PDF-Parse. */
  checklisteDaten?: ChecklisteInlineData | null;
}) {
  const lab = LABEL[teil.typ];
  const slugs = teil.slugs && teil.slugs.length ? teil.slugs : [teil.slug];
  const titel = teil.typ === "dokumente" && slugs.length > 1 ? "Dokumente zum Ratgeber" : await werkzeugTitel(teil.typ, teil.slug, toolData);

  let koerper: React.ReactNode = null;
  if (teil.typ === "rechner") {
    koerper = <Insel typ="rechner" arg={teil.slug}><RechnerEmbed slug={teil.slug} noVisual /></Insel>;
  } else if (teil.typ === "checkliste") {
    let daten = checklisteDaten ?? toolData?.checklisten?.[teil.slug] ?? null;
    if (!daten) { try { daten = await loadChecklisteData(teil.slug); } catch { daten = null; } }
    koerper = <Insel typ="checkliste" arg={teil.slug}><ChecklisteEmbed slug={teil.slug} noVisual initialData={daten} /></Insel>;
  } else if (teil.typ === "dokumente") {
    const karten = await dokumentKarten(slugs, toolData);
    koerper = <Insel typ="dokumente" arg={slugs.join(",")}><DokumenteEmbed slugs={slugs} initialDokumente={karten.length ? karten : null} /></Insel>;
  } else {
    koerper = <Insel typ="vergleich" arg={teil.slug}><VergleichEmbed slug={teil.slug} /></Insel>;
  }

  return (
    <div id={`werkzeug-${teil.typ}-${teil.slug}`} className={`kasten kasten--${lab.ton} kasten--inline kasten--${teil.typ}`} data-werkzeug={`${teil.typ}:${teil.slug}`} data-toc-titel={imInhalt ? titel : undefined} data-toc-typ={imInhalt ? teil.typ : undefined}>
      {teil.grund && <div className="einwurf einwurf--inline">Leo wirft ein: {teil.grund}</div>}
      <span className="kicker kicker--tool kicker--gruen"><i className={`dot dot--${lab.dot}`} />{lab.typ}{teil.nachtrag ? " · zum Ratgeber" : ohneTitel ? "" : " · in der Kette"}</span>
      {!ohneTitel && <h3>{titel}</h3>}
      <div className="kasten__koerper article-tool-embed article-finanztool">{koerper}</div>
      {!ohneTitel && <Insel typ="kasten-fuss" werte={{ titel, url: werkzeugUrl(teil.typ, slugs[0]), kastenId: `werkzeug-${teil.typ}-${teil.slug}`, eigeneSeite: true }}><KastenFuss titel={titel} url={werkzeugUrl(teil.typ, slugs[0])} kastenId={`werkzeug-${teil.typ}-${teil.slug}`} eigeneSeite /></Insel>}
    </div>
  );
}
