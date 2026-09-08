/**
 * Sprungleiste: der Bestand als flacher Index (Ratgeber, Rubriken, Themen, Werkzeuge,
 * Begriffe) für das Typeahead in der Eingabe. Nur gecachte Listen-Getter, nacheinander
 * (nie mehr als drei Anfragen parallel gegen WordPress); Reihenfolge = Rang.
 */
import { cache } from "react";
import { getAllPosts, getNavItems, getAllGlossar } from "@/lib/wordpress";
import { buildPostUrl, buildGlossarUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { FADEN_AKTIV } from "./flag";
import { getWerkzeugIndex } from "./werkzeugIndex";

export type IndexTyp = "ratgeber" | "rubrik" | "thema" | "rechner" | "vergleich" | "checkliste" | "dokumente" | "begriff";
export interface IndexEintrag { typ: IndexTyp; titel: string; unter?: string; href: string }

export const buildFadenIndex = cache(async (): Promise<IndexEintrag[]> => {
  const out: IndexEintrag[] = [];
  const nav = await getNavItems();
  for (const r of nav) {
    if (!r.submenu?.length) continue;
    out.push({ typ: "rubrik", titel: r.label, href: r.href });
    for (const s of r.submenu) out.push({ typ: "thema", titel: s.label, unter: r.label, href: s.href });
  }
  const posts = await getAllPosts();
  for (const p of posts) out.push({ typ: "ratgeber", titel: decodeHtmlEntities(p.title), unter: p.untertitel ? decodeHtmlEntities(p.untertitel) : undefined, href: buildPostUrl(p) });
  const werkzeuge = await getWerkzeugIndex();
  for (const [key, v] of werkzeuge) out.push({ typ: key.split(":")[0] as IndexTyp, titel: v.titel, href: v.href });
  if (FADEN_AKTIV) {
    for (const g of await getAllGlossar()) out.push({ typ: "begriff", titel: decodeHtmlEntities(g.title), unter: g.rubrik || undefined, href: buildGlossarUrl(g.slug) });
  }
  return out;
});
