/**
 * Titel und Adressen für Verweise aus den Faden-Feldern (dazu_passt, Einwürfe).
 *
 * Nur bestehende, gecachte Getter (Regel: keine neuen Abfrageformen). Der Beitrags-
 * index kommt aus getAllPosts() (ISR-Fetch-Cache, wird ohnehin für generateStaticParams
 * gebraucht); Werkzeugtitel liefert lib/articleToolData je Beitrag.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAllPosts, CONTENT_REVALIDATE } from "@/lib/wordpress";
import { FADEN_INDEX_TAG } from "@/lib/cacheTags";
import { buildPostUrl, buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl } from "@/lib/urls";
import type { FadenZiel } from "@/lib/types";

export interface Verweis {
  titel: string;
  href: string;
  typ: FadenZiel["typ"];
}

/**
 * 🚨 Zwei Lagen, beide nötig.
 *
 * `unstable_cache` hält die fertige Tabelle über Requests hinweg im Data-Cache. Ohne sie
 * lief bei JEDEM Render einer Ratgeberseite `getAllPosts()` — eine paginierte Schleife
 * über rund 1.000 Beiträge, also ~11 Cache-Einträge lesen und auspacken, nur um eine
 * Zuordnung slug → { titel, href } zu bauen. Genau solche Sekunden zahlt Netlify
 * (Abrechnung nach GB-Sekunden, siehe CLAUDE.md).
 *
 * `cache()` darüber macht daraus einmal je Request eine Map — die kann `unstable_cache`
 * nicht liefern, es serialisiert nur JSON.
 */
const beitragsListe = unstable_cache(
  async (): Promise<[string, { titel: string; href: string }][]> => {
    const posts = await getAllPosts();
    return posts.map((p) => [p.slug, { titel: p.title, href: buildPostUrl(p) }]);
  },
  ["faden-beitragsindex"],
  { revalidate: CONTENT_REVALIDATE, tags: [FADEN_INDEX_TAG] },
);

export const getBeitragsIndex = cache(async (): Promise<Map<string, { titel: string; href: string }>> => {
  return new Map(await beitragsListe());
});

export async function verweiseAufloesen(ziele: FadenZiel[], toolTitel: Record<string, string> = {}): Promise<Verweis[]> {
  // Fehler werfen lassen (CLAUDE.md, Falle 2): sonst fehlt „Dazu passt“ 24 h lang im ISR-Cache.
  const index = await getBeitragsIndex();
  const out: Verweis[] = [];
  for (const z of ziele) {
    if (z.typ === "post") {
      const p = index.get(z.slug);
      if (p) out.push({ titel: p.titel, href: p.href, typ: "post" });
      continue;
    }
    if (z.typ === "rechner") out.push({ titel: toolTitel[`rechner:${z.slug}`] || `Rechner: ${z.slug}`, href: buildRechnerUrl(z.slug), typ: z.typ });
    else if (z.typ === "checkliste") out.push({ titel: toolTitel[`checkliste:${z.slug}`] || `Checkliste: ${z.slug}`, href: buildChecklisteUrl(z.slug), typ: z.typ });
    else if (z.typ === "vergleich") out.push({ titel: toolTitel[`vergleich:${z.slug}`] || `Vergleich: ${z.slug}`, href: buildVergleichUrl(z.slug), typ: z.typ });
    else if (z.typ === "dokumente") out.push({ titel: toolTitel[`dokumente:${z.slug}`] || `Dokument: ${z.slug}`, href: buildDokumentUrl(z.slug), typ: z.typ });
    else if (z.typ === "glossar") out.push({ titel: z.slug, href: `/glossar/${z.slug}`, typ: z.typ });
  }
  return out;
}
