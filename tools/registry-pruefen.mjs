#!/usr/bin/env node
/**
 * Prüft die Registry gegen das, was financeads wirklich annimmt und liefert.
 *
 *   node tools/registry-pruefen.mjs            # nur die Papierform, ohne Netz
 *   node tools/registry-pruefen.mjs --api      # zusätzlich gegen die API (dauert ~4 min)
 *   node tools/registry-pruefen.mjs --api --nur creditcards
 *
 * 🚨 Warum es diese Sonde gibt. Drei Fehlerarten sind uns nacheinander durchgerutscht,
 * und keine davon konnte ein Abgleich „unsere Seite gegen die API mit unseren Parametern"
 * finden — der ist ein Zirkelschluss (siehe `tools/vergleich-breite.mjs`):
 *
 *   1 Eine Auswahlmöglichkeit, die ins Leere führt. `type=MINI_LOAN` stand in der Liste
 *     und lieferte bei jeder Laufzeit über zwei Monaten null Angebote. Der Leser zog den
 *     Regler und die Seite war leer.
 *   2 Eine Voreinstellung, die die API still selbst setzt. `country_rating` stand
 *     ungefragt auf `AA` und verbarg drei Festgeldangebote; ohne `stock_exchanges`
 *     verschwanden sieben Depots, darunter die gebührenfreien Neobroker.
 *   3 Ein Preset, das gar keine gültige Option ist. `klemme()` setzt es stumm auf den
 *     Standard zurück — der Chip steht da, tut aber nichts, und der Schnappschuss trägt
 *     eine Variante mehr als nötig.
 *
 * Alle drei fallen hier auf. Sequenziell mit Pausen — nie parallel gegen den Partner.
 */
import { readFileSync } from "node:fs";

const MIT_API = process.argv.includes("--api");
const NUR = (() => { const i = process.argv.indexOf("--nur"); return i > 0 ? process.argv[i + 1] : null; })();

const { alleKategorien } = await import("../lib/financeads/registry.ts");
const { apiParams, wirksameParams } = await import("../lib/financeads/quelle.ts");

let defs = alleKategorien().filter((d) => d.params.length || d.klasse === "A");
if (NUR) defs = defs.filter((d) => d.kategorie === NUR);

const befunde = [];
const merke = (kat, was) => befunde.push([kat, was]);

// ── 1 Papierform: Presets müssen gültige Optionen sein ──────────────────────────────
for (const d of defs) {
  for (const p of d.params) {
    if (p.typ !== "wahl" || !p.presets) continue;
    const erlaubt = new Set((p.optionen ?? []).map((o) => o.wert));
    const raus = p.presets.map(String).filter((v) => !erlaubt.has(v));
    if (raus.length) merke(d.kategorie, `Preset ${raus.join(", ")} bei „${p.key}" ist keine Option — klemme() setzt still auf ${p.standard} zurück`);
  }
  for (const p of d.params) {
    if (p.typ !== "wahl") continue;
    if (!(p.optionen ?? []).some((o) => String(o.wert) === String(p.standard))) {
      merke(d.kategorie, `Standard „${p.standard}" bei „${p.key}" steht nicht in den Optionen`);
    }
  }
}
console.log(`Papierform geprüft: ${defs.length} Kategorien, ${defs.reduce((n, d) => n + d.params.length, 0)} Parameter.`);

if (!MIT_API) {
  ausgeben();
  process.exit(befunde.length ? 1 : 0);
}

// ── 2 Gegen die API ────────────────────────────────────────────────────────────────
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const cfg = {};
for (const z of env.split("\n")) { const m = z.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) cfg[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const { FINANCEADS_API_KEY: key, FINANCEADS_ADSPACE: ads } = cfg;
if (!key || !ads) { console.error("FINANCEADS_API_KEY / FINANCEADS_ADSPACE fehlen in .env.local"); process.exit(1); }

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function ruf(def, params) {
  const q = new URLSearchParams({ api_key: key, adspace: ads, country_iso2: "de", limit: "100" });
  for (const [k, v] of Object.entries(apiParams(def, params))) if (v !== undefined && v !== "") q.set(k, String(v));
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://api.financeads.net/api/${def.version}/affiliate/products/comparison/${def.kategorie}?${q}`);
      const j = await r.json().catch(() => ({}));
      return { status: r.status, n: (j?.data?.products ?? []).length, fs: j?.data?.filter_settings ?? null };
    } catch { await pause(1500); }
  }
  return { status: 0, n: -1, fs: null };
}
const leereQuelle = { embedType: "financeads", fest: {}, vor: {} };

for (const d of defs) {
  const basis = wirksameParams(d, { ...leereQuelle, kategorie: d.kategorie });
  const b = await ruf(d, basis);
  await pause(400);
  if (b.status !== 200) { merke(d.kategorie, `Voreinstellung antwortet HTTP ${b.status}`); continue; }
  if (!b.n) { merke(d.kategorie, "Voreinstellung liefert null Produkte"); }

  // 2a Jede einzelne Option muss Produkte tragen (die MINI_LOAN-Lehre).
  for (const p of d.params) {
    if (p.typ !== "wahl" || p.fest) continue;
    for (const o of p.optionen ?? []) {
      if (String(o.wert) === String(p.standard)) continue;
      const r = await ruf(d, wirksameParams(d, { ...leereQuelle, kategorie: d.kategorie }, { [p.key]: o.wert }));
      await pause(380);
      if (r.status !== 200) merke(d.kategorie, `„${p.label}: ${o.label}" (${p.key}=${o.wert}) → HTTP ${r.status}`);
      else if (!r.n) merke(d.kategorie, `„${p.label}: ${o.label}" (${p.key}=${o.wert}) → null Produkte; eine Auswahl, die die Liste leert`);
    }
  }

  // 2b Was wendet die API von sich aus an, das wir nie gesendet haben?
  // 🚨 Genau so verbarg `country_rating=AA` drei Festgeldangebote.
  // Rahmenwerte des Gateways (keine Angabe eines Lesers) und ein nachgemessener Fall:
  // `broker=0` setzt die API bei Tages- und Festgeld von sich aus, die Liste ist mit 0
  // und mit 1 jedoch Produkt für Produkt dieselbe (16.09.2026, zweimal geprüft).
  const RAHMEN = new Set(["country_iso2", "limit", "comission", "commission", "calculator", "advertising_space", "search_default", "enabled", "sections", "broker"]);
  if (b.fs && typeof b.fs === "object") {
    const unsere = new Set(Object.keys(basis));
    const still = Object.entries(b.fs)
      .filter(([k, v]) => !RAHMEN.has(k) && !unsere.has(k) && v !== null && v !== "" && v !== false)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`);
    if (still.length) merke(d.kategorie, `die API setzt ungefragt ${still.join(", ")} — prüfen, ob das die Liste beschneidet`);
  }
  console.log(`${befunde.some(([k]) => k === d.kategorie) ? "✗" : "✓"} ${d.kategorie.padEnd(30)} ${String(b.n).padStart(3)} Produkte`);
}

ausgeben();
process.exit(befunde.length ? 1 : 0);

function ausgeben() {
  if (!befunde.length) { console.log("\n✓ Keine Befunde."); return; }
  console.log(`\n${befunde.length} Befunde:`);
  for (const [k, w] of befunde) console.log(`  ${k.padEnd(30)} ${w}`);
}
