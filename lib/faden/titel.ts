/**
 * Titel und Adressen für Verweise aus den Faden-Feldern (dazu_passt, Einwürfe).
 *
 * Nur bestehende, gecachte Getter (Regel: keine neuen Abfrageformen). Der Beitrags-
 * index kommt aus getAllPosts() (ISR-Fetch-Cache, wird ohnehin für generateStaticParams
 * gebraucht); Werkzeugtitel liefert lib/articleToolData je Beitrag.
 */
import { cache } from "react";
import { getAllPosts } from "@/lib/wordpress";
import { buildPostUrl, buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl } from "@/lib/urls";
import type { FadenZiel } from "@/lib/types";

export interface Verweis {
  titel: string;
  href: string;
  typ: FadenZiel["typ"];
}

export const getBeitragsIndex = cache(async (): Promise<Map<string, { titel: string; href: string }>> => {
  const posts = await getAllPosts();
  const map = new Map<string, { titel: string; href: string }>();
  for (const p of posts) map.set(p.slug, { titel: p.title, href: buildPostUrl(p) });
  return map;
});

export async function verweiseAufloesen(ziele: FadenZiel[], toolTitel: Record<string, string> = {}): Promise<Verweis[]> {
  const index = await getBeitragsIndex().catch(() => new Map<string, { titel: string; href: string }>());
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
