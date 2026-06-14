import "server-only";
import { getRechnerBySlug, getChecklisteBySlug, getDokumenteBySlugs } from "@/lib/wordpress";
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

export interface ArticleToolData {
  /** Tool-Titel/-Beschreibung, Key = `${type}:${slug}` */
  titles: Record<string, ToolTitle>;
  /** Geparste Checklisten-Daten, Key = slug */
  checklisten: Record<string, ChecklisteInlineData>;
  /** Dokument-Karten, Key = normalisierte Slug-Liste (`slugs.join(",")`) */
  dokumente: Record<string, DokumentCard[]>;
}

export const EMPTY_TOOL_DATA: ArticleToolData = { titles: {}, checklisten: {}, dokumente: {} };

// Gleiches Block-Muster wie in components/sections/ArticleContent.tsx (Slug-Tools).
const BLOCK_RE =
  /<div\s+data-finanzleser-(rechner|checkliste|vergleich|dokumente)="([^"]+)"[^>]*><\/div>|<!-- wp:finanzleser\/(vergleich) \{"slug":"([^"]+)"\} \/-->/g;

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
    const res = await fetch(`${wpUrl}/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(slug)}&_fields=title,excerpt`);
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
export async function getArticleToolData(content?: string): Promise<ArticleToolData> {
  if (!content) return EMPTY_TOOL_DATA;
  const refs = parseToolRefs(content);
  const titles: Record<string, ToolTitle> = {};
  const checklisten: Record<string, ChecklisteInlineData> = {};
  const dokumente: Record<string, DokumentCard[]> = {};

  await Promise.all([
    ...refs.rechner.map(async (slug) => {
      try {
        const r = await getRechnerBySlug(slug);
        titles[`rechner:${slug}`] = {
          title: r?.title || "",
          excerpt: r?.excerpt || r?.rechnerFelder?.beschreibung || "",
        };
      } catch { /* Client-Fallback */ }
    }),
    ...refs.checkliste.map(async (slug) => {
      try {
        const c = await getChecklisteBySlug(slug);
        titles[`checkliste:${slug}`] = {
          title: c?.title || "",
          excerpt: c?.excerpt || c?.checklisten?.checklistenBeschreibung || "",
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
  ]);

  return { titles, checklisten, dokumente };
}
