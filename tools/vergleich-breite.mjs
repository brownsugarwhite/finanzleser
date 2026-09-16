#!/usr/bin/env node
/**
 * Die Prüfung, die beim ersten Abschlusstest gefehlt hat.
 *
 *   node tools/vergleich-breite.mjs [--base http://localhost:3000] [--nur <slug>]
 *
 * 🚨 Warum es sie braucht: der erste Abgleich verglich, was unsere Seite zeigt, mit dem,
 * was die API BEI GENAU UNSEREN PARAMETERN liefert. Das ist ein Zirkelschluss — er prüft
 * die Treue der Darstellung, nie die Wahl der Parameter. Der Minikredit-Vergleich hatte
 * `type=MINI_LOAN` fest gesetzt und lief beim Ziehen der Laufzeit auf null Angebote; der
 * alte Test meldete ihn als deckungsgleich, weil die API mit denselben Parametern ebenso
 * null lieferte.
 *
 * Zwei Fragen, die der alte Test nicht stellen konnte:
 *
 *   1 Treue     — zeigt die Seite alles, was die API zu ihren Parametern hergibt?
 *                 (fängt stille Deckel wie `MAX_PRODUKTE` ab)
 *   2 Enge      — schneidet einer der gesetzten Parameter die Liste unnötig zusammen?
 *                 Jeden einzeln weglassen und zählen; vervielfacht sich die Liste, ist
 *                 dieser Parameter zu eng gewählt.
 *
 * Läuft gegen den Dev-Server UND gegen financeads. Sequenziell, mit Pausen — nie parallel
 * (Memory `feedback_mess_disziplin_ionos`).
 */
import { readFileSync } from "node:fs";

const arg = (n, s) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : s; };
const BASE = arg("base", "http://localhost:3000").replace(/\/$/, "");
const NUR = arg("nur", null);

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const cfg = {};
for (const z of env.split("\n")) { const m = z.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) cfg[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const { FINANCEADS_API_KEY: key, FINANCEADS_ADSPACE: ads } = cfg;
if (!key || !ads) { console.error("FINANCEADS_API_KEY / FINANCEADS_ADSPACE fehlen in .env.local"); process.exit(1); }

const { alleKategorien } = await import("../lib/financeads/registry.ts");
const { apiParams } = await import("../lib/financeads/quelle.ts");
const DEFS = Object.fromEntries(alleKategorien().map((d) => [d.kategorie, d]));

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(kat, version, params) {
  const q = new URLSearchParams({ api_key: key, adspace: ads, country_iso2: "de", limit: "100" });
  // 🚨 Listenparameter heißen bei financeads `name[]` — ohne die Klammern antwortet die
  // API mit null Produkten (Studentenkonto: `target_group[]=student`).
  for (const [k, v] of Object.entries(apiParams(DEFS[kat], params))) if (v !== undefined && v !== "") q.set(k, String(v));
  const r = await fetch(`https://api.financeads.net/api/${version}/affiliate/products/comparison/${kat}?${q}`);
  const j = await r.json();
  return (j?.data?.products ?? []).length;
}

const seite = await (await fetch(`${BASE}/finanztools/vergleiche`)).text();
let slugs = [...new Set([...seite.matchAll(/href="\/finanztools\/vergleiche\/([a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
if (NUR) slugs = slugs.filter((s) => s === NUR);

const befunde = [];
for (const slug of slugs) {
  let d;
  try { d = await (await fetch(`${BASE}/api/vergleich-daten/${slug}`)).json(); } catch { continue; }
  if (!d?.variante?.produkte?.length) continue;
  const v = d.variante;
  // 🚨 Kategorie NICHT aus dem Slug raten: „hausratversicherung-vergleich" enthält
  // „homeinsurances" nirgends, und eine Kategorie ohne Parameter passt sonst auf jede.
  // Die Route nennt sie in der kurzen Form.
  let meta;
  try { meta = await (await fetch(`${BASE}/api/vergleich-daten/${slug}?kurz=1`)).json(); } catch { continue; }
  const def = DEFS[meta?.kategorie];
  if (!def) { console.log(`· ${slug.padEnd(44)} Kategorie unbekannt`); continue; }

  // ── 1 Treue ────────────────────────────────────────────────────────────────────
  const ihre = await api(def.kategorie, def.version, v.params);
  await pause(500);
  const treu = ihre === v.produkte.length;
  if (!treu) befunde.push([slug, `zeigt ${v.produkte.length}, die API liefert ${ihre} — ein Deckel oder ein verlorenes Produkt`]);

  // ── 2 Zu enge Voreinstellung ───────────────────────────────────────────────────
  // 🚨 Der eigentliche Test: JEDEN gesetzten Parameter einzeln weglassen und zählen.
  // Vervielfacht das Weglassen die Liste, schneidet dieser Parameter zu viel weg — egal
  // ob er aus der Registry oder aus der Redaktion kommt. Genau so fällt `type=MINI_LOAN`
  // auf: ohne ihn 6 Angebote statt 0, sobald jemand die Laufzeit zieht.
  let eng = null;
  for (const k of Object.keys(v.params)) {
    const ohne = { ...v.params };
    delete ohne[k];
    const n = await api(def.kategorie, def.version, ohne);
    await pause(450);
    if (n >= Math.max(5, v.produkte.length * 3) && !eng) eng = `ohne „${k}" wären es ${n} statt ${v.produkte.length}`;
  }
  if (eng) befunde.push([slug, `zu enge Voreinstellung: ${eng}`]);

  console.log(`${treu && !eng ? "✓" : "✗"} ${slug.padEnd(44)} zeigt ${String(v.produkte.length).padStart(3)} · API ${String(ihre).padStart(3)}${eng ? ` · ${eng}` : ""}`);
}

console.log(`\n${slugs.length - befunde.length} von ${slugs.length} Vergleichen ohne Befund.`);
for (const [s, w] of befunde) console.log(`  ${s.padEnd(44)} ${w}`);
process.exit(befunde.length ? 1 : 0);
