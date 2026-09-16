/**
 * Titel und Adressen aller Werkzeuge als `typ:slug` → { titel, href }, aus den bereits
 * gecachten Listen-Gettern (dieselben, die die Sitemap braucht). Keine Einzelabfragen:
 * beim Build sind die Listen memoisiert, zur Laufzeit liegen sie im Fetch-Cache.
 * Nacheinander abgefragt, damit gegen WordPress nie mehr als drei Anfragen parallel laufen.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAllRechner, getAllChecklisten, getAllVergleiche, getAllDokumente, CONTENT_REVALIDATE } from "@/lib/wordpress";
import { FADEN_INDEX_TAG } from "@/lib/cacheTags";
import { buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl } from "@/lib/urls";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { stripHtml } from "@/lib/seo";

export interface WerkzeugVerweis {
  titel: string;
  href: string;
  /** Veröffentlichungsdatum (ISO), für die Auslese auf der Startseite. Dokumente haben keins. */
  datum?: string;
  /**
   * Kurzbeschreibung — NUR bei Vergleichen gefüllt, für Leos Empfehlungen auf der
   * Startseite.
   *
   * 🚨 Sie stand bis zum 15.09.2026 als `lib/vergleichDescriptions.ts` im Code, weil das
   * Vergleich-CPT kein Excerpt kannte. Seit `finanzleser-cpt-excerpt.php` kann es das,
   * und die Texte liegen im CMS — der Code hält sie nicht mehr doppelt.
   */
  text?: string;
}

/** Über Requests hinweg gecacht (siehe lib/faden/titel.ts): vier paginierte Listen je Render sind zu teuer. */
const werkzeugListe = unstable_cache(
  async (): Promise<[string, WerkzeugVerweis][]> => {
    const out: [string, WerkzeugVerweis][] = [];
    for (const r of await getAllRechner()) out.push([`rechner:${r.slug}`, { titel: decodeHtmlEntities(r.title), href: buildRechnerUrl(r.slug), datum: r.date }]);
    for (const c of await getAllChecklisten()) out.push([`checkliste:${c.slug}`, { titel: decodeHtmlEntities(c.title), href: buildChecklisteUrl(c.slug), datum: c.date }]);
    for (const v of await getAllVergleiche()) out.push([`vergleich:${v.slug}`, { titel: decodeHtmlEntities(v.title), href: buildVergleichUrl(v.slug), datum: v.date, text: v.excerpt ? decodeHtmlEntities(stripHtml(v.excerpt)) : undefined }]);
    for (const d of await getAllDokumente()) out.push([`dokumente:${d.slug}`, { titel: decodeHtmlEntities(d.title), href: buildDokumentUrl(d.slug) }]);
    return out;
  },
  ["faden-werkzeugindex-v3"],
  { revalidate: CONTENT_REVALIDATE, tags: [FADEN_INDEX_TAG] },
);

export const getWerkzeugIndex = cache(async (): Promise<Map<string, WerkzeugVerweis>> => {
  return new Map(await werkzeugListe());
});

/**
 * Bestandszahlen für die Kacheln im Landing-Hero. Zählt nur den bereits gecachten
 * Index aus (`unstable_cache`, siehe oben) — der Aufruf im Layout kostet deshalb
 * keine zusätzliche WP-Abfrage, auch nicht beim Prerendern der 800+ Routen.
 */
export const getWerkzeugZahlen = cache(async (): Promise<{ rechner: number; vergleich: number; checkliste: number }> => {
  const zahlen = { rechner: 0, vergleich: 0, checkliste: 0 };
  for (const key of (await getWerkzeugIndex()).keys()) {
    const typ = key.split(":")[0] as keyof typeof zahlen;
    if (typ in zahlen) zahlen[typ]++;
  }
  return zahlen;
});
