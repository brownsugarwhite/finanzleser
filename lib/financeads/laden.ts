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

async function _holeSnapshot(slug: string): Promise<VergleichDaten | null> {
  zaehleWp("rest:vergleich-daten");
  const res = await fetch(`${wpBasis()}/wp-json/finanzleser/v1/vergleich-daten?slug=${encodeURIComponent(slug)}`, {
    // Der Data-Cache liegt eine Ebene höher (unstable_cache); der Fetch selbst soll frisch sein.
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
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
async function _holeAlle(): Promise<Record<string, Pick<VergleichDaten, "slug" | "kategorie" | "klasse" | "anzahl" | "stand" | "geladen">>> {
  zaehleWp("rest:vergleich-daten-alle");
  const res = await fetch(`${wpBasis()}/wp-json/finanzleser/v1/vergleich-daten`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`vergleich-daten (alle): HTTP ${res.status}`);
  const json = (await res.json()) as { uebersicht?: Record<string, Pick<VergleichDaten, "slug" | "kategorie" | "klasse" | "anzahl" | "stand" | "geladen">> };
  return json.uebersicht || {};
}

const uebersichtGecacht = unstable_cache(_holeAlle, ["vergleich-daten-uebersicht-v1"], { revalidate: CONTENT_REVALIDATE, tags: [VERGLEICH_DATEN_TAG] });

export const getVergleichUebersicht = cache(async () => uebersichtGecacht());
