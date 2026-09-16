/**
 * Der Snapshot aus WordPress — der einzige Weg, auf dem ein Seiten-Render an
 * financeads-Daten kommt.
 *
 * Warum nicht direkt die API: 1–12 s je Abruf, kein Cache-Header, und ein Build mit
 * ~50 Vergleichsseiten hinge an einem fremden Server. Der Refresh (tools/financeads-
 * refresh.mjs) legt die normalisierten Daten in die WP-Option `finanzleser_vergleich_daten`
 * (mu-plugin finanzleser-vergleiche.php); hier werden sie gelesen und über
 * `unstable_cache` mit dem Tag VERGLEICH_DATEN_TAG gehalten.
 *
 * Regel 11: kein eigener revalidate unter CONTENT_REVALIDATE. Regel „kein Fail-open":
 * ein HTTP-Fehler wirft; nur ein sauberes „kein Snapshot" (404 vom Endpunkt) ist null —
 * das ist eine Existenzaussage der Datenquelle, kein geschluckter Fehler.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { CONTENT_REVALIDATE } from "@/lib/revalidate";
import { VERGLEICH_DATEN_TAG } from "@/lib/cacheTags";
import { zaehleWp } from "@/lib/faden/wpZaehler";
import type { VergleichDaten } from "./typen.ts";

function wpBasis(): string {
  const apiUrl = process.env.WORDPRESS_API_URL;
  if (!apiUrl) throw new Error("WORDPRESS_API_URL fehlt");
  return apiUrl.replace(/\/graphql\/?$/, "");
}

/**
 * REST-Abruf mit Wiederholung — dieselbe Lehre wie beim GraphQL-Client (getClient):
 * unter Build-Last antwortet das IONOS-WordPress mit 502/503, und ein einzelner Fehlschlag
 * darf weder den Build kippen noch (zur Laufzeit) den letzten guten Stand verdrängen.
 * Gemessen 15.09.2026: der erste Build brach an einem 503 auf vergleich-daten ab.
 */
async function wpRest(pfad: string, label: string, versuche = 4): Promise<Response> {
  let letzter: unknown;
  for (let i = 0; i < versuche; i++) {
    try {
      const res = await fetch(`${wpBasis()}${pfad}`, { cache: "no-store", headers: { Accept: "application/json" } });
      if (res.status >= 500 && i < versuche - 1) { letzter = new Error(`${label}: HTTP ${res.status}`); }
      else return res;
    } catch (e) {
      letzter = e;
      if (i === versuche - 1) throw e;
    }
    await new Promise((r) => setTimeout(r, 1500 * 2 ** i));
  }
  throw letzter instanceof Error ? letzter : new Error(`${label}: nicht erreichbar`);
}

async function _holeSnapshot(slug: string): Promise<VergleichDaten | null> {
  zaehleWp("rest:vergleich-daten");
  // Der Data-Cache liegt eine Ebene höher (unstable_cache); der Fetch selbst soll frisch sein.
  const res = await wpRest(`/wp-json/finanzleser/v1/vergleich-daten?slug=${encodeURIComponent(slug)}`, `vergleich-daten ${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`vergleich-daten ${slug}: HTTP ${res.status}`);
  const json = (await res.json()) as { daten?: VergleichDaten | null } | VergleichDaten;
  const daten = "daten" in json ? json.daten : json;
  if (!daten || typeof daten !== "object" || !("varianten" in daten)) return null;
  return daten as VergleichDaten;
}

const snapshotGecacht = unstable_cache(
  async (slug: string) => _holeSnapshot(slug),
  ["vergleich-daten-v1"],
  { revalidate: CONTENT_REVALIDATE, tags: [VERGLEICH_DATEN_TAG] },
);

/** Snapshot eines Vergleichs; `null`, wenn der Refresh noch nie gelaufen ist. */
export const getVergleichDaten = cache(async (slug: string): Promise<VergleichDaten | null> => snapshotGecacht(slug));

/** Alle Snapshots auf einmal (Datenstand-Übersicht, Sitemap-Datum, Landing-Kennzahlen). */
export type VergleichUebersichtEintrag = Pick<VergleichDaten, "slug" | "kategorie" | "klasse" | "anzahl" | "stand" | "geladen"> & { defekt?: boolean };

async function _holeAlle(): Promise<Record<string, VergleichUebersichtEintrag>> {
  zaehleWp("rest:vergleich-daten-alle");
  const res = await wpRest("/wp-json/finanzleser/v1/vergleich-daten", "vergleich-daten (alle)");
  if (!res.ok) throw new Error(`vergleich-daten (alle): HTTP ${res.status}`);
  const json = (await res.json()) as { uebersicht?: Record<string, VergleichUebersichtEintrag> | unknown[] };
  // PHP kodiert ein leeres Array als `[]`, nicht als `{}`.
  return json.uebersicht && !Array.isArray(json.uebersicht) ? json.uebersicht : {};
}

const uebersichtGecacht = unstable_cache(_holeAlle, ["vergleich-daten-uebersicht-v1"], { revalidate: CONTENT_REVALIDATE, tags: [VERGLEICH_DATEN_TAG] });

export const getVergleichUebersicht = cache(async () => uebersichtGecacht());
