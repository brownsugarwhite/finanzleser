/**
 * Titel und Adressen aller Werkzeuge als `typ:slug` → { titel, href }, aus den bereits
 * gecachten Listen-Gettern (dieselben, die die Sitemap braucht). Keine Einzelabfragen:
 * beim Build sind die Listen memoisiert, zur Laufzeit liegen sie im Fetch-Cache.
 * Nacheinander abgefragt, damit gegen WordPress nie mehr als drei Anfragen parallel laufen.
 */
import { cache } from "react";
import { getAllRechner, getAllChecklisten, getAllVergleiche, getAllDokumente } from "@/lib/wordpress";
import { buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";

export interface WerkzeugVerweis { titel: string; href: string }

export const getWerkzeugIndex = cache(async (): Promise<Map<string, WerkzeugVerweis>> => {
  const m = new Map<string, WerkzeugVerweis>();
  for (const r of await getAllRechner()) m.set(`rechner:${r.slug}`, { titel: decodeHtmlEntities(r.title), href: buildRechnerUrl(r.slug) });
  for (const c of await getAllChecklisten()) m.set(`checkliste:${c.slug}`, { titel: decodeHtmlEntities(c.title), href: buildChecklisteUrl(c.slug) });
  for (const v of await getAllVergleiche()) m.set(`vergleich:${v.slug}`, { titel: decodeHtmlEntities(v.title), href: buildVergleichUrl(v.slug) });
  for (const d of await getAllDokumente()) m.set(`dokumente:${d.slug}`, { titel: decodeHtmlEntities(d.title), href: buildDokumentUrl(d.slug) });
  return m;
});
