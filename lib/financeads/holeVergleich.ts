/**
 * Der eine Einstieg: Slug → alles, was ein Vergleich zum Rendern braucht.
 *
 *   { art: "financeads", def, quelle, daten }  eigener Rechner (daten = null, solange kein Snapshot)
 *   { art: "embed", config }                   Fremd-Embed → VergleichEmbed wie bisher
 *   null                                       unbekannter Slug oder CPT ohne Quelle
 *
 * Benutzt von Detailseite, WerkzeugKarte, Statistik-Form, Artikel-Preload, Route und Leo.
 * `react cache` — Metadata und Seite teilen einen Aufruf.
 */
import { cache } from "react";
import { getVergleichBySlug } from "@/lib/wordpress";
import { configAusHtml, quelleAus, type LegacyQuelle } from "./quelle.ts";
import { getVergleichDaten } from "./laden.ts";
import type { KategorieDef, VergleichDaten, VergleichQuelle } from "./typen.ts";
import type { Vergleich } from "@/lib/types";

export type VergleichAuflösung =
  | { art: "financeads"; cpt: Vergleich; def: KategorieDef; quelle: VergleichQuelle; daten: VergleichDaten | null }
  | { art: "embed"; cpt: Vergleich; config: LegacyQuelle }
  | null;

export const holeVergleich = cache(async (slug: string): Promise<VergleichAuflösung> => {
  const cpt = await getVergleichBySlug(slug);
  if (!cpt) return null;
  const q = quelleAus(configAusHtml(cpt.content || ""));
  if (!q) return null;
  if (q.art === "embed") return { art: "embed", cpt, config: q.config };
  const daten = await getVergleichDaten(slug);
  return { art: "financeads", cpt, def: q.def, quelle: q.quelle, daten };
});
