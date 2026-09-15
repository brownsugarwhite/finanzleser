#!/usr/bin/env -S node --experimental-strip-types
/**
 * Der Refresh: financeads-API → normalisierter Snapshot → WordPress-Option → Cache-Tag busten.
 *
 *   node --experimental-strip-types tools/financeads-refresh.mjs [--trocken] [--nur <slug>] [--ziel cms-dev|cms]
 *
 * Läuft 2×/Tag im GitHub-Actions-Cron (.github/workflows/financeads-refresh.yml) — bewusst
 * NICHT in einer Netlify-Function (10-s-Limit; ein Girokonto-Abruf braucht bis zu 11 s).
 *
 * Je Vergleich aus docs/inhalte/financeads-vergleiche.json (Fallback: die Block-Config des
 * CPT, sobald tools/financeads-vergleiche.mjs geschrieben hat):
 *   1. alle Preset-Kombinationen abrufen (sequenziell, 0,4 s Pause)
 *   2. normalisieren (≤ 40 Produkte, ≤ 3 Vorteile), Bestwert, Stand
 *   3. searchentry/create (search_default=1) — Pflicht bei gecachten Daten (Doku)
 *   4. POST /finanzleser/v1/vergleich-daten (nur bei Erfolg — ein Fehler lässt den alten Stand stehen)
 * Danach EIN POST /api/revalidate { tag: "vergleich-daten" } gegen das Frontend.
 *
 * Umgebung: FINANCEADS_API_KEY, FINANCEADS_ADSPACE, CMS_URL (z. B. https://cms-dev.finanzleser.de),
 * CMS_APP_USER, CMS_APP_PASS (Anwendungspasswort), FRONTEND_URL, WP_REVALIDATE_SECRET.
 * Lokal werden .env.local und .env.cms-dev.local gelesen (cms-dev als Ziel).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchVergleich, searchentryCreate } from "../lib/financeads/client.ts";
import { kategorieDef } from "../lib/financeads/registry.ts";
import { normalisiereVariante, standAus, hinweiseAus, paramSchluessel } from "../lib/financeads/normalisieren.ts";
import { apiParams, presetKombinationen, wirksameParams, quelleAus } from "../lib/financeads/quelle.ts";

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const trocken = args.includes("--trocken");
const nur = args.includes("--nur") ? args[args.indexOf("--nur") + 1] : null;

function ladeEnv(datei) {
  const p = path.join(wurzel, datei);
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const l of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(l)) continue;
    const i = l.indexOf("=");
    out[l.slice(0, i)] = l.slice(i + 1).trim().split(/\s+/).pop();
  }
  return out;
}
const lokal = { ...ladeEnv(".env.cms-dev.local"), ...ladeEnv(".env.local") };
for (const [k, v] of Object.entries(lokal)) if (!process.env[k]) process.env[k] = v;
// Lokal: cms-dev-Zugang unter anderen Namen.
process.env.CMS_URL = process.env.CMS_URL || process.env.CMS_DEV_URL || "https://cms-dev.finanzleser.de";
process.env.CMS_APP_USER = process.env.CMS_APP_USER || process.env.CMS_DEV_APP_USER || "";
process.env.CMS_APP_PASS = process.env.CMS_APP_PASS || process.env.CMS_DEV_APP_PASS || "";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "";

const CMS = process.env.CMS_URL.replace(/\/$/, "");
const AUTH = "Basic " + Buffer.from(`${process.env.CMS_APP_USER}:${process.env.CMS_APP_PASS}`).toString("base64");

async function rest(pfad, init = {}) {
  const res = await fetch(`${CMS}/wp-json/${pfad}`, { ...init, headers: { Authorization: AUTH, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${pfad}: HTTP ${res.status} ${typeof json === "string" ? json.slice(0, 160) : json?.message || ""}`);
  return json;
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Welche Vergleiche? Erst die CPTs auf dem CMS (Block-Config), sonst die JSON-Quelle. */
async function vergleicheLaden() {
  const aus = [];
  try {
    const cpts = await rest("wp/v2/vergleich?per_page=100&_fields=slug,content&status=publish");
    for (const c of cpts) {
      const q = quelleAus(configAus(c.content?.rendered || ""));
      if (q && q.art === "financeads") aus.push({ slug: c.slug, quelle: q.quelle, def: q.def, herkunft: "cms" });
    }
  } catch (e) {
    console.warn(`CMS-Liste nicht lesbar (${e.message}) — nehme docs/inhalte/financeads-vergleiche.json`);
  }
  if (!aus.length) {
    const json = JSON.parse(fs.readFileSync(path.join(wurzel, "docs/inhalte/financeads-vergleiche.json"), "utf8"));
    for (const v of json.vergleiche) {
      const q = quelleAus({ embedType: "financeads", kategorie: v.kategorie, fest: v.fest, vor: v.vor, presets: v.presets });
      if (q && q.art === "financeads") aus.push({ slug: v.slug, quelle: q.quelle, def: q.def, herkunft: "json" });
    }
  }
  return nur ? aus.filter((v) => v.slug === nur) : aus;
}
function configAus(html) {
  const m = html.match(/data-config="([A-Za-z0-9+/=]+)"/);
  if (!m) return null;
  try { return JSON.parse(Buffer.from(m[1], "base64").toString("utf8")); } catch { return null; }
}

async function einer({ slug, quelle, def }) {
  if (def.defekt) return { slug, uebersprungen: "Endpunkt bei financeads defekt" };
  const kombis = presetKombinationen(def, quelle);
  const varianten = [];
  let stand = null; let hinweise = [];
  for (const params of kombis) {
    const antwort = await fetchVergleich(def.version, def.kategorie, apiParams(def, params), { timeoutMs: 45000, versuche: 2 });
    varianten.push(normalisiereVariante(def, params, antwort, quelle.limit));
    const s = standAus(antwort); if (s && (!stand || s > stand)) stand = s;
    if (!hinweise.length) hinweise = hinweiseAus(antwort);
    await pause(400);
  }
  const standardParams = wirksameParams(def, quelle);
  const daten = {
    slug, kategorie: def.kategorie, klasse: def.klasse,
    standard: paramSchluessel(Object.fromEntries(Object.entries(standardParams).map(([k, v]) => [k, String(v)]))),
    varianten, anzahl: varianten[0]?.produkte.length || 0,
    stand: stand || new Date().toISOString(), geladen: new Date().toISOString(), hinweise,
  };
  // Klasse A ohne Produkte in der Voreinstellung = Fehler (sonst würde „keine Angebote" gespeichert).
  if (def.klasse === "A" && daten.anzahl === 0) throw new Error(`${slug}: Voreinstellung liefert null Produkte — Snapshot nicht überschrieben`);
  const best = varianten[0]?.produkte.find((p) => p.id === varianten[0].bestwert);
  const bestwert = best && def.bestwert ? best.kennzahlen[def.bestwert.key] : null;
  return { slug, daten, bestwert: typeof bestwert === "number" ? bestwert : null, groesse: JSON.stringify(daten).length };
}

const start = Date.now();
const liste = await vergleicheLaden();
console.log(`${liste.length} financeads-Vergleiche (${liste[0]?.herkunft || "-"})${trocken ? " — Trockenlauf" : ""}\n`);
let ok = 0, fehler = 0;
for (const v of liste) {
  const t = Date.now();
  try {
    const r = await einer(v);
    if (r.uebersprungen) { console.log(`  ${v.slug.padEnd(42)} übersprungen: ${r.uebersprungen}`); continue; }
    const zeile = `${v.slug.padEnd(42)} ${String(r.daten.anzahl).padStart(3)} Produkte, ${r.daten.varianten.length} Varianten, ${(r.groesse / 1024).toFixed(1)} KB, Stand ${r.daten.stand.slice(0, 10)}, Bestwert ${r.bestwert ?? "–"} (${((Date.now() - t) / 1000).toFixed(1)} s)`;
    if (!trocken) {
      await rest("finanzleser/v1/vergleich-daten", { method: "POST", body: JSON.stringify({ slug: v.slug, daten: r.daten, verlauf: r.bestwert !== null ? { kategorie: v.def.kategorie, datum: new Date().toISOString().slice(0, 10), wert: r.bestwert } : undefined }) });
      try { await searchentryCreate(r.daten.varianten[0]?.produkte[0]?.typ || v.def.kategorie, true); } catch (e) { console.warn(`    searchentry: ${e.message}`); }
    }
    console.log(`  ${zeile}`); ok++;
  } catch (e) {
    console.error(`  ${v.slug.padEnd(42)} FEHLER: ${e.message}`); fehler++;
  }
}
console.log(`\n${ok} geschrieben, ${fehler} Fehler, ${((Date.now() - start) / 1000).toFixed(0)} s.`);

if (!trocken && ok > 0 && process.env.FRONTEND_URL && process.env.WP_REVALIDATE_SECRET) {
  const res = await fetch(`${process.env.FRONTEND_URL.replace(/\/$/, "")}/api/revalidate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: process.env.WP_REVALIDATE_SECRET, tag: "vergleich-daten" }) });
  console.log(`Revalidate ${process.env.FRONTEND_URL}: HTTP ${res.status}`);
} else if (!trocken && ok > 0) {
  console.log("Kein FRONTEND_URL/WP_REVALIDATE_SECRET — Cache-Tag nicht gebustet (lokal: POST /api/revalidate mit tag vergleich-daten).");
}
process.exit(fehler > 0 && ok === 0 ? 1 : 0);
