/**
 * Der eine Draht zu `api.financeads.net`.
 *
 * 🚨 Nie aus einem Seiten-Render aufrufen. Ein Abruf dauert 1–12 s (Girokonto 8–11 s,
 * gemessen 15.09.2026) und die Antwort ist bis zu 395 KB groß. Aufrufer sind ausschließlich
 * das Refresh-Skript (tools/financeads-refresh.mjs, außerhalb von Netlify) und der
 * Route-Handler für freie Parameter (app/api/vergleich-daten, mit eigenem Cache).
 *
 * Auth: `api_key` als Query-Parameter reicht (verifiziert), plus `adspace` (24770).
 * Fehler werfen immer — ein stiller Leerwert würde als „keine Angebote" gecacht.
 */
import type { ApiAntwort, ApiVersion } from "./typen.ts";

const BASIS = "https://api.financeads.net/api";

function zugang(): { key: string; adspace: string } {
  const key = (process.env.FINANCEADS_API_KEY || "").trim().split(/\s+/).pop() || "";
  const adspace = (process.env.FINANCEADS_ADSPACE || "").trim().split(/\s+/).pop() || "";
  if (!key || !adspace) throw new Error("FINANCEADS_API_KEY / FINANCEADS_ADSPACE fehlen in der Umgebung");
  return { key, adspace };
}

function url(version: ApiVersion, pfad: string, params: Record<string, string | number | boolean | undefined>): string {
  const { key, adspace } = zugang();
  const q = new URLSearchParams({ api_key: key, adspace, country_iso2: "de" });
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === null) continue;
    // Listenparameter heißen bei financeads `name[]`; eine Variante setzt genau einen Wert.
    q.append(k, String(v));
  }
  return `${BASIS}/${version}/affiliate/${pfad}?${q.toString()}`;
}

async function abrufen(u: string, init: RequestInit, timeoutMs: number, versuche: number): Promise<Response> {
  let letzter: unknown;
  for (let i = 0; i < versuche; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(u, { ...init, signal: ctrl.signal, cache: "no-store" });
      // 5xx → noch ein Versuch; 4xx ist ein Fehler unsererseits (oder ein kaputter Endpunkt) → sofort.
      if (res.status >= 500 && i < versuche - 1) { letzter = new Error(`financeads ${res.status}`); continue; }
      return res;
    } catch (e) {
      letzter = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw letzter instanceof Error ? letzter : new Error("financeads nicht erreichbar");
}

export interface AbrufOptionen { timeoutMs?: number; versuche?: number; limit?: number }

/** Produktliste einer Kategorie. Wirft bei HTTP ≠ 200 oder `success:false`. */
export async function fetchVergleich(version: ApiVersion, kategorie: string, params: Record<string, string | number>, opt: AbrufOptionen = {}): Promise<ApiAntwort> {
  const u = url(version, `products/comparison/${kategorie}`, { ...params, limit: opt.limit ?? 100 });
  const res = await abrufen(u, { headers: { Accept: "application/json" } }, opt.timeoutMs ?? 30000, opt.versuche ?? 2);
  const text = await res.text();
  let json: ApiAntwort;
  try { json = JSON.parse(text) as ApiAntwort; } catch { throw new Error(`financeads ${kategorie}: keine JSON-Antwort (HTTP ${res.status})`); }
  if (!res.ok || !json.success) {
    const msg = Array.isArray(json.message) ? json.message.join("; ") : String(json.message || "");
    throw new Error(`financeads ${kategorie}: HTTP ${res.status} ${msg}`.trim());
  }
  return json;
}

/**
 * Suchvorgang melden. Laut Doku Pflicht, wenn die Daten gecacht werden — also bei uns.
 * `standard` = true, wenn die Voreinstellung gezeigt wird (search_default=1).
 */
export async function searchentryCreate(kennung: string, standard: boolean): Promise<void> {
  const u = url("v1", "comparison/searchentry/create", { search_default: standard ? 1 : 0, comparison_api_kennung: kennung });
  const res = await abrufen(u, { headers: { Accept: "application/json" } }, 8000, 1);
  if (!res.ok) throw new Error(`financeads searchentry: HTTP ${res.status}`);
}

/** Sichtkontakt der gezeigten Produkte melden (views/add). */
export async function viewsAdd(kennung: string, ids: number[]): Promise<void> {
  if (!ids.length) return;
  const u = url("v1", "views/add", { product_ids: ids.join(","), comparison_api_kennung: kennung });
  const res = await abrufen(u, { method: "POST", headers: { Accept: "application/json" } }, 8000, 1);
  if (!res.ok) throw new Error(`financeads views/add: HTTP ${res.status}`);
}
