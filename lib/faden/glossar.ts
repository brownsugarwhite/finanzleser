/**
 * Glossar für den Faden: Index aller Begriffe (ein gecachter Listen-Getter), aufgelöste
 * Verweise (Ratgeber, Werkzeug) und die schlanke Form, die Klickmenü, Sitzungsleiste
 * und Nachschlagewerk brauchen.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAllGlossar, CONTENT_REVALIDATE } from "@/lib/wordpress";
import { FADEN_INDEX_TAG } from "@/lib/cacheTags";
import { stripTags } from "@/lib/articleHtml";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { buildGlossarUrl } from "@/lib/urls";
import type { GlossarEintrag } from "@/lib/types";
import { getBeitragsIndex } from "./titel";
import { getWerkzeugIndex } from "./werkzeugIndex";

export type WerkzeugTyp = "rechner" | "checkliste" | "vergleich" | "dokumente";

/** Was Klickmenü, Sitzungsleiste und Nachschlagewerk über einen Begriff wissen müssen. */
export interface BegriffDaten {
  slug: string;
  titel: string;
  erkl: string;
  quelle: string;
  url: string;
  rubrik: string;
  ratgeber: { titel: string; href: string } | null;
  tool: { typ: WerkzeugTyp; titel: string; href: string } | null;
  frage: string;
  antwort: string;
}

/** Zeile fürs Nachschlagewerk (A–Z, Suche): klein genug für alle 587 auf einmal. */
export interface BegriffZeile { slug: string; titel: string; kurz: string; rubrik: string; ratgeber: boolean; tool: WerkzeugTyp | "" }

/** Über Requests hinweg gecacht (siehe lib/faden/titel.ts): 587 Begriffe je Render auspacken ist zu teuer. */
const glossarListe = unstable_cache(
  async (): Promise<GlossarEintrag[]> => getAllGlossar(),
  ["faden-glossarindex"],
  { revalidate: CONTENT_REVALIDATE, tags: [FADEN_INDEX_TAG] },
);

export const getGlossarIndex = cache(async (): Promise<Map<string, GlossarEintrag>> => {
  const alle = await glossarListe();
  return new Map(alle.map((e) => [e.slug, e]));
});

/** "checkliste/elternunterhalt" → { typ, slug }; "dokument" wird zu "dokumente". */
export function toolTeile(tool: string | undefined | null): { typ: WerkzeugTyp; slug: string } | null {
  const m = (tool || "").trim().match(/^(rechner|checkliste|vergleich|dokumente?)[/:]\s*([a-z0-9-]+)$/i);
  if (!m) return null;
  const typ = m[1].toLowerCase();
  return { typ: (typ === "dokument" ? "dokumente" : typ) as WerkzeugTyp, slug: m[2].toLowerCase() };
}

const TOOL_LABEL: Record<WerkzeugTyp, string> = { rechner: "Rechner", checkliste: "Checkliste", vergleich: "Vergleich", dokumente: "Dokument" };

export function begriffZeile(e: GlossarEintrag): BegriffZeile {
  const text = stripTags(e.content || "");
  return {
    slug: e.slug,
    titel: decodeHtmlEntities(e.title),
    kurz: text.length > 110 ? text.slice(0, 108).replace(/\s+\S*$/, "") + " …" : text,
    rubrik: e.rubrik,
    ratgeber: !!e.ratgeber,
    tool: toolTeile(e.tool)?.typ || "",
  };
}

/** Verweise einmal auflösen (Beitragsindex + Werkzeugindex) und mehrere Begriffe abbilden. */
export async function loeseBegriffe(eintraege: GlossarEintrag[]): Promise<BegriffDaten[]> {
  if (!eintraege.length) return [];
  const posts = await getBeitragsIndex();
  const werkzeuge = await getWerkzeugIndex();
  return eintraege.map((e) => {
    const r = e.ratgeber ? posts.get(e.ratgeber) : undefined;
    const tt = toolTeile(e.tool);
    const w = tt ? werkzeuge.get(`${tt.typ}:${tt.slug}`) : undefined;
    return {
      slug: e.slug,
      titel: decodeHtmlEntities(e.title),
      erkl: stripTags(e.content || ""),
      quelle: e.quelle || "",
      url: buildGlossarUrl(e.slug),
      rubrik: e.rubrik,
      ratgeber: r ? { titel: r.titel, href: r.href } : null,
      tool: tt && w ? { typ: tt.typ, titel: w.titel || TOOL_LABEL[tt.typ], href: w.href } : null,
      frage: e.frage || "",
      antwort: e.antwort || "",
    };
  });
}

export async function loeseBegriff(e: GlossarEintrag): Promise<BegriffDaten> {
  return (await loeseBegriffe([e]))[0];
}
