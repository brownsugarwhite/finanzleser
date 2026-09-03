import "server-only";
import { getRechnerBySlug, getChecklisteBySlug, getDokumenteBySlugs, CONTENT_REVALIDATE } from "@/lib/wordpress";
import { VERGLEICH_DESCRIPTIONS } from "@/lib/vergleichDescriptions";
import { stripHtml } from "@/lib/seo";
import { loadChecklisteData, type ChecklisteInlineData } from "@/lib/checklisteData";

export interface ToolTitle {
  title: string;
  excerpt: string;
}

export interface DokumentCard {
  slug: string;
  title: string;
  beschreibung: string;
  pdfUrl: string;
  fileName?: string;
  fileSize?: number | string;
  kategorie?: string;
}

export interface BeitragPdf {
  pdfUrl: string;
  pdfTitle: string;
}

export interface ArticleToolData {
  /** Tool-Titel/-Beschreibung, Key = `${type}:${slug}` */
  titles: Record<string, ToolTitle>;
  /** Geparste Checklisten-Daten, Key = slug */
  checklisten: Record<string, ChecklisteInlineData>;
  /** Dokument-Karten, Key = normalisierte Slug-Liste (`slugs.join(",")`) */
  dokumente: Record<string, DokumentCard[]>;
  /**
   * Beitrags-PDF (ACF `beitrag_pdf`). `null` = geprüft, keins vorhanden.
   * `undefined` = nicht vorgeladen → PdfPreview fällt auf /api/beitrag-pdf zurück.
   */
  beitragPdf?: BeitragPdf | null;
}

export const EMPTY_TOOL_DATA: ArticleToolData = { titles: {}, checklisten: {}, dokumente: {} };

// Gleiches Block-Muster wie in components/sections/ArticleContent.tsx (Slug-Tools).
const BLOCK_RE =
  /<div\s+[^>]*?data-finanzleser-(rechner|checkliste|vergleich|dokumente)="([^"]+)"[^>]*>\s*<\/div>|<!-- wp:finanzleser\/(vergleich) \{"slug":"([^"]+)"\} \/-->/g;

interface ToolRefs {
  rechner: string[];
  checkliste: string[];
  vergleich: string[];
  dokumente: string[]; // jeweils rohe (kommagetrennte) Slug-Liste
}

export function parseToolRefs(content: string): ToolRefs {
  const rechner = new Set<string>();
  const checkliste = new Set<string>();
  const vergleich = new Set<string>();
  const dokumente = new Set<string>();
  const re = new RegExp(BLOCK_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const type = m[1] || m[3];
    const val = m[2] || m[4];
    if (!val) continue;
    if (type === "rechner") rechner.add(val);
    else if (type === "checkliste") checkliste.add(val);
    else if (type === "vergleich") vergleich.add(val);
    else if (type === "dokumente") dokumente.add(val);
  }
  return { rechner: [...rechner], checkliste: [...checkliste], vergleich: [...vergleich], dokumente: [...dokumente] };
}

function normalizeDokSlugs(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
}

async function loadVergleichTitle(slug: string): Promise<ToolTitle> {
  const fallback = VERGLEICH_DESCRIPTIONS[slug] || "";
  const wpUrl = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");
  try {
    // WICHTIG: revalidate setzen — ein ungecachtes fetch() ist in Next 15 `no-store`
    // und macht JEDEN Artikel mit Vergleich dynamisch (kein SSG → on-demand-Cold-Render).
    // Freshness via ISR + On-Demand-Revalidate. CONTENT_REVALIDATE, damit dieser Fetch
    // nicht das Segment-Intervall der Artikelroute nach unten zieht (Next nimmt das Minimum).
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(slug)}&_fields=title,excerpt`, { next: { revalidate: CONTENT_REVALIDATE } });
    const posts = await res.json();
    const wpExcerpt = (posts[0]?.excerpt?.rendered || "").trim();
    return { title: posts[0]?.title?.rendered || "", excerpt: wpExcerpt || fallback };
  } catch {
    return { title: "", excerpt: fallback };
  }
}

/**
 * Serverseitiger Prefetch ALLER Finanztool-Daten eines Beitrags (außer Vergleich-
 * Widget-Embeds, die client-lazy bleiben). So rendern Rechner/Checkliste/Dokumente
 * + Tool-Überschriften sofort (ISR), ohne Client-Roundtrip und ohne Layoutshift.
 * Jeder Teil ist einzeln try/catch-gekapselt → fehlende Daten = Client-Fallback,
 * nichts bricht.
 */
/**
 * Beitrags-PDF (ACF-Feld `beitrag_pdf`) serverseitig auflösen.
 *
 * Vorher lud PdfPreview das per useEffect über /api/beitrag-pdf — und zwar auf JEDEM
 * der 202 Artikel-Views, auch wenn der Beitrag gar kein PDF hat. Das ist dieselbe
 * Situation wie bei Checklisten/Dokumenten/Tool-Titeln, die alle schon vorgeladen
 * werden. Die API-Route bleibt als Client-Fallback bestehen.
 *
 * Rückgabe: `null` heißt „geprüft, kein PDF" — davon lebt der Guard in PdfPreview.
 * Bei einem WP-Fehler werfen wir NICHT, sondern liefern `null`; der Client-Fallback
 * hat dann noch eine zweite Chance.
 */
async function loadBeitragPdf(slug: string): Promise<BeitragPdf | null> {
  const wpUrl = (process.env.WORDPRESS_API_URL || "http://finanzleser.local/graphql").replace("/graphql", "");
  try {
    const res = await fetch(
      `${wpUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,meta`,
      { next: { revalidate: CONTENT_REVALIDATE } },
    );
    if (!res.ok) return null;
    const posts = await res.json();
    // Frueher `acf.beitrag_pdf` — ohne ACF gibt es kein acf-Objekt mehr, der Wert
    // steht jetzt als registriertes Post-Meta unter `meta`.
    const attachmentId = posts?.[0]?.meta?.beitrag_pdf;
    if (!attachmentId) return null;

    const attachRes = await fetch(
      `${wpUrl}/wp-json/wp/v2/media/${attachmentId}?_fields=source_url,title`,
      { next: { revalidate: CONTENT_REVALIDATE } },
    );
    if (!attachRes.ok) return null;
    const attachment = await attachRes.json();
    if (!attachment?.source_url) return null;

    return { pdfUrl: attachment.source_url, pdfTitle: attachment.title?.rendered || "PDF-Dokument" };
  } catch {
    return null;
  }
}

export async function getArticleToolData(content?: string, slug?: string): Promise<ArticleToolData> {
  if (!content) return EMPTY_TOOL_DATA;
  const refs = parseToolRefs(content);
  let beitragPdf: BeitragPdf | null | undefined;
  const titles: Record<string, ToolTitle> = {};
  const checklisten: Record<string, ChecklisteInlineData> = {};
  const dokumente: Record<string, DokumentCard[]> = {};

  await Promise.all([
    ...refs.rechner.map(async (slug) => {
      try {
        const r = await getRechnerBySlug(slug);
        titles[`rechner:${slug}`] = {
          title: r?.title || "",
          excerpt: r?.excerpt || r?.beschreibung || "",
        };
      } catch { /* Client-Fallback */ }
    }),
    ...refs.checkliste.map(async (slug) => {
      try {
        const c = await getChecklisteBySlug(slug);
        titles[`checkliste:${slug}`] = {
          title: c?.title || "",
          excerpt: c?.excerpt || c?.beschreibung || "",
        };
      } catch { /* Client-Fallback */ }
      try {
        const d = await loadChecklisteData(slug);
        if (d) checklisten[slug] = d;
      } catch { /* Client-Fallback */ }
    }),
    ...refs.vergleich.map(async (slug) => {
      try {
        titles[`vergleich:${slug}`] = await loadVergleichTitle(slug);
      } catch { /* Client-Fallback */ }
    }),
    ...refs.dokumente.map(async (raw) => {
      try {
        const slugs = normalizeDokSlugs(raw);
        if (!slugs.length) return;
        const docs = await getDokumenteBySlugs(slugs);
        dokumente[slugs.join(",")] = docs.map((d) => ({
          slug: d.slug,
          title: d.title,
          beschreibung: stripHtml(d.excerpt),
          pdfUrl: d.pdfFile?.mediaItemUrl || "",
          fileName: d.pdfFile?.mediaDetails?.file?.split("/").pop(),
          fileSize: d.pdfFile?.fileSize,
          kategorie: d.dokumentKategorien?.nodes?.[0]?.name || "",
        }));
      } catch { /* Client-Fallback */ }
    }),
    // Läuft parallel zu den Tool-Fetches mit, kostet also keine zusätzliche Latenz.
    ...(slug ? [loadBeitragPdf(slug).then((r) => { beitragPdf = r; })] : []),
  ]);

  return { titles, checklisten, dokumente, beitragPdf };
}
