#!/usr/bin/env node

/**
 * Setzt Beitragsbilder (featured_media) für die Posts aus featured-image-map.json.
 * Bild-Keys werden lenient gegen upload-results.json aufgelöst:
 *   - exakter sanitizedName  (general/Kategorie: z. B. "coinflower", "subcat_finanzen_geldanlagen")
 *   - oder Titelbild-Topic ohne Index  (z. B. "aktien" → "0004_aktien"); muss eindeutig sein.
 *
 * Validierung VOR dem Schreiben (bricht sonst ab):
 *   - jeder Key auflösbar & eindeutig
 *   - kein Bild > CAP (3) mal verwendet
 *   - Ziel-Post hat aktuell kein Beitragsbild (sonst skip, nicht überschreiben)
 *
 * Aufruf:
 *   WP_URL=https://staging.finanzleser.de WP_USER='…' WP_APP_PASSWORD='…' \
 *   node scripts/assign-featured-images.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MAP = path.join(__dirname, "featured-image-map.json");
const RESULTS = path.join(ROOT, "assets", "webp", "upload-results.json");
const CAP = 3;

const DRY_RUN = process.argv.includes("--dry-run");
const BASE_URL = (process.env.WP_URL || "").replace(/\/$/, "");
const USER = process.env.WP_USER || "";
const PASS = process.env.WP_APP_PASSWORD || "";
if (!BASE_URL || !USER || !PASS) {
  console.error("❌ Bitte WP_URL, WP_USER und WP_APP_PASSWORD als ENV setzen.");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

async function api(method, endpoint, body) {
  const res = await fetch(`${BASE_URL}/wp-json/wp/v2${endpoint}`, {
    method,
    headers: { Authorization: AUTH, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error(json && json.message ? json.message : `HTTP ${res.status}`);
  return json;
}

function buildResolver(results) {
  const exact = new Map(); // sanitizedName -> mediaId
  const byTopic = new Map(); // stripped -> [{name,id}]
  for (const r of results) {
    if (!r.mediaId) continue;
    exact.set(r.sanitizedName, r.mediaId);
    const topic = r.sanitizedName.replace(/^\d+_/, "");
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic).push({ name: r.sanitizedName, id: r.mediaId });
  }
  return (key) => {
    if (exact.has(key)) return { id: exact.get(key), name: key };
    const cand = byTopic.get(key) || [];
    if (cand.length === 1) return { id: cand[0].id, name: cand[0].name };
    if (cand.length > 1) return { error: `mehrdeutig (${cand.map((c) => c.name).join(", ")})` };
    return { error: "kein Medium gefunden" };
  };
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP, "utf8"));
  const results = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
  const resolve = buildResolver(results);

  // 1) Keys auflösen + Histogramm
  const resolved = []; // {postId, key, mediaId, mediaName}
  const errors = [];
  const usage = new Map();
  for (const [postId, key] of Object.entries(map)) {
    const r = resolve(key);
    if (r.error) { errors.push(`Post ${postId}: Key "${key}" ${r.error}`); continue; }
    resolved.push({ postId, key, mediaId: r.id, mediaName: r.name });
    usage.set(r.name, (usage.get(r.name) || 0) + 1);
  }
  const overCap = [...usage.entries()].filter(([, n]) => n > CAP);
  console.log(`${DRY_RUN ? "🧪 DRY-RUN  " : ""}Ziel: ${BASE_URL}  ·  ${resolved.length} Zuweisungen, ${usage.size} verschiedene Bilder`);
  if (errors.length) { console.log("\n❌ Auflösungs-Fehler:"); errors.forEach((e) => console.log("   " + e)); }
  if (overCap.length) { console.log(`\n❌ Über Cap (${CAP}):`); overCap.forEach(([n, c]) => console.log(`   ${n}: ${c}×`)); }
  if (errors.length || overCap.length) { console.log("\nAbbruch — bitte Map korrigieren."); process.exit(1); }

  // 2) Schreiben (nur Posts ohne Bild)
  let set = 0, skipped = 0, failed = 0;
  for (const r of resolved) {
    try {
      const post = await api("GET", `/posts/${r.postId}?_fields=id,featured_media,title`);
      if (post.featured_media) { skipped++; console.log(`⏭️  ${r.postId}: hat schon Bild #${post.featured_media}`); continue; }
      if (DRY_RUN) { set++; console.log(`🧪 ${r.postId} → ${r.mediaName} (#${r.mediaId})`); continue; }
      await api("POST", `/posts/${r.postId}`, { featured_media: r.mediaId });
      set++;
      console.log(`✅ ${r.postId} → ${r.mediaName} (#${r.mediaId})`);
    } catch (err) { failed++; console.log(`❌ ${r.postId}: ${err.message}`); }
  }

  console.log("\n── Zusammenfassung ──");
  console.log(`  ${DRY_RUN ? "würde setzen" : "gesetzt"}: ${set} · übersprungen (hatte Bild): ${skipped} · Fehler: ${failed}`);
  console.log("\n── Bild-Nutzung (Histogramm) ──");
  [...usage.entries()].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => { if (c > 1) console.log(`  ${c}×  ${n}`); });
  if (failed) process.exit(1);
}

main().catch((err) => { console.error("❌ Abbruch:", err); process.exit(1); });
