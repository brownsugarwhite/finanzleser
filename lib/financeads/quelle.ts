/**
 * Die Konfiguration eines Vergleichs, wie der Block `finanzleser/vergleich-quelle` sie
 * als base64-JSON im CPT ablegt. Zwei Formen leben nebeneinander:
 *   { embedType: "financeads", kategorie, fest, vor, … }  → eigener Rechner (dieses Modul)
 *   { embedType: "iframe"|"raw"|…, iframeUrl|rawHtml|scriptConfig } → Fremd-Embed (VergleichEmbed)
 */
import type { KategorieDef, VergleichQuelle } from "./typen.ts";
import { kategorieDef } from "./registry.ts";

export interface LegacyQuelle {
  embedType?: string;
  iframeUrl?: string;
  scriptConfig?: Record<string, string>;
  rawHtml?: string;
}

export type Quelle = { art: "financeads"; quelle: VergleichQuelle; def: KategorieDef } | { art: "embed"; config: LegacyQuelle } | null;

export function dekodiereConfig(b64: string): Record<string, unknown> | null {
  try {
    const json = typeof Buffer !== "undefined"
      ? Buffer.from(b64, "base64").toString("utf-8")
      : new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    const obj = JSON.parse(json);
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Aus dem gerenderten CPT-Inhalt (`<div class="fl-vergleich-src" data-config="…">`). */
export function configAusHtml(html: string): Record<string, unknown> | null {
  const m = html.match(/data-config="([A-Za-z0-9+/=]+)"/);
  return m ? dekodiereConfig(m[1]) : null;
}

function alsRecord(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const [k, w] of Object.entries(v as Record<string, unknown>)) {
      if (w === null || w === undefined || w === "") continue;
      if (typeof w === "string" || typeof w === "number" || typeof w === "boolean") out[k] = String(w);
    }
  }
  return out;
}

function presetsAus(v: unknown): Record<string, (number | string)[]> | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const out: Record<string, (number | string)[]> = {};
  for (const [k, liste] of Object.entries(v as Record<string, unknown>)) {
    if (!Array.isArray(liste)) continue;
    const werte = liste.filter((x): x is number | string => typeof x === "number" || typeof x === "string").slice(0, 6);
    if (werte.length) out[k] = werte;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Preset-Chips eines Parameters: Redaktion (Block) vor Registry. */
export function presetsFuer(def: KategorieDef, quelle: VergleichQuelle, key: string): (number | string)[] {
  const p = def.params.find((x) => x.key === key);
  return quelle.presets?.[key] ?? p?.presets ?? [];
}

export function quelleAus(config: Record<string, unknown> | null): Quelle {
  if (!config) return null;
  if (config.embedType === "financeads") {
    const def = kategorieDef(String(config.kategorie || ""));
    if (!def) return null;
    const quelle: VergleichQuelle = {
      embedType: "financeads",
      kategorie: def.kategorie,
      fest: alsRecord(config.fest),
      vor: alsRecord(config.vor),
      presets: presetsAus(config.presets),
      limit: typeof config.limit === "number" && config.limit > 0 ? Math.min(config.limit, 100) : undefined,
      bestwert: typeof config.bestwert === "string" && config.bestwert ? config.bestwert : undefined,
      hinweis: typeof config.hinweis === "string" && config.hinweis.trim() ? config.hinweis.trim() : undefined,
    };
    return { art: "financeads", quelle, def };
  }
  const c = config as LegacyQuelle;
  if (c.iframeUrl || c.scriptConfig || c.rawHtml) return { art: "embed", config: c };
  return null;
}

/**
 * Wirksame API-Parameter: Registry-Standard ← Voreinstellung der Redaktion ← feste Filter
 * ← Eingabe des Lesers (nur nicht-feste Schlüssel, auf Schema geklemmt). Unbekannte
 * Schlüssel fallen weg — das ist die Allowlist des Route-Handlers.
 */
export function wirksameParams(def: KategorieDef, quelle: VergleichQuelle, eingabe: Record<string, string | number> = {}): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const p of def.params) {
    let wert: string | number | undefined = p.standard;
    if (quelle.vor[p.key] !== undefined) wert = quelle.vor[p.key];
    if (quelle.fest[p.key] !== undefined) wert = quelle.fest[p.key];
    if (!p.fest && quelle.fest[p.key] === undefined && eingabe[p.key] !== undefined) wert = eingabe[p.key];
    wert = klemme(p, wert);
    if (wert === "" || wert === undefined) continue;
    out[p.key] = wert;
  }
  return out;
}

function klemme(p: KategorieDef["params"][number], wert: string | number | undefined): string | number | undefined {
  if (wert === undefined) return undefined;
  if (p.typ === "wahl") {
    const erlaubt = (p.optionen || []).map((o) => o.wert);
    const s = String(wert);
    return erlaubt.includes(s) ? s : String(p.standard);
  }
  const n = typeof wert === "number" ? wert : Number(String(wert).replace(",", "."));
  if (!Number.isFinite(n)) return p.standard;
  let v = n;
  if (p.min !== undefined) v = Math.max(p.min, v);
  if (p.max !== undefined) v = Math.min(p.max, v);
  if (p.schritt) v = Math.round(v / p.schritt) * p.schritt;
  return v;
}

/** Listenparameter (`target_group[]`) bekommen bei financeads die Klammer im Namen. */
export function apiParams(def: KategorieDef, params: Record<string, string | number>): Record<string, string | number> {
  const LISTEN = new Set(["target_group", "provider", "card_status", "payment_methods", "stock_exchanges", "sections"]);
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) out[LISTEN.has(k) ? `${k}[]` : k] = v;
  void def;
  return out;
}

/** Die Preset-Kombinationen, die der Snapshot vorhält: Voreinstellung + je Preset-Wert einzeln. */
export function presetKombinationen(def: KategorieDef, quelle: VergleichQuelle): Record<string, string | number>[] {
  const basis = wirksameParams(def, quelle);
  const out: Record<string, string | number>[] = [basis];
  const gesehen = new Set([JSON.stringify(basis)]);
  for (const p of def.params) {
    if (p.fest || quelle.fest[p.key] !== undefined) continue;
    for (const wert of presetsFuer(def, quelle, p.key)) {
      const k = wirksameParams(def, quelle, { [p.key]: wert });
      const s = JSON.stringify(k);
      if (!gesehen.has(s)) { gesehen.add(s); out.push(k); }
    }
  }
  return out;
}
