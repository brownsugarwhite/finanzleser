#!/usr/bin/env node

/**
 * Weist die hochgeladenen Kategorie-/Subkategorie-Bilder den WP-Kategorie-Terms zu
 * (Term-Meta kategorie_bild_id = Slider, kategorie_bild_wide_id = WIDE-Banner).
 *
 * Voraussetzung: scripts/optimize-images.js + scripts/upload-media.js gelaufen
 * (manifest.json + upload-results.json vorhanden), und das mu-plugin
 * finanzleser-kategorie-bilder.php ist auf dem Ziel aktiv (register_term_meta + show_in_rest).
 *
 * Auth: REST + Basic-Auth via Application Password (nicht gespeichert).
 *
 * Aufruf:
 *   WP_URL=https://staging.finanzleser.de WP_USER='…' WP_APP_PASSWORD='…' \
 *   node scripts/assign-category-images.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "assets", "webp", "manifest.json");
const RESULTS = path.join(ROOT, "assets", "webp", "upload-results.json");

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
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error(json && json.message ? json.message : `HTTP ${res.status}`);
  return json;
}

async function findTerm(slug) {
  const list = await api("GET", `/categories?slug=${encodeURIComponent(slug)}&per_page=5`);
  return Array.isArray(list) && list.length ? list[0] : null;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const results = fs.existsSync(RESULTS) ? JSON.parse(fs.readFileSync(RESULTS, "utf8")) : [];
  const mediaBySanitized = new Map(results.map((r) => [r.sanitizedName, r.mediaId]));

  // Pro Term Slider- + WIDE-Media-ID sammeln (Join Manifest↔Results über sanitizedName)
  const terms = new Map(); // termSlug → { sliderId, wideId }
  for (const m of manifest) {
    if (!m.termSlug) continue;
    const mediaId = mediaBySanitized.get(m.sanitizedName);
    if (!mediaId) {
      console.log(`⚠️  ${m.sanitizedName}: keine mediaId in upload-results.json — erst upload-media.js laufen lassen.`);
      continue;
    }
    const t = terms.get(m.termSlug) || {};
    if (m.isWide) t.wideId = mediaId; else t.sliderId = mediaId;
    terms.set(m.termSlug, t);
  }

  console.log(`${DRY_RUN ? "🧪 DRY-RUN  " : ""}Ziel: ${BASE_URL}  ·  ${terms.size} Terms\n`);

  const missing = [];
  for (const [slug, { sliderId, wideId }] of terms) {
    try {
      const term = await findTerm(slug);
      if (!term) {
        missing.push(slug);
        console.log(`⏭️  ${slug}: Term existiert (noch) nicht — manuell nachpflegen.`);
        continue;
      }
      const meta = {};
      if (sliderId) meta.kategorie_bild_id = sliderId;
      if (wideId) meta.kategorie_bild_wide_id = wideId;

      if (!DRY_RUN) {
        const updated = await api("POST", `/categories/${term.id}`, { meta });
        const ok =
          (!sliderId || updated.meta?.kategorie_bild_id === sliderId) &&
          (!wideId || updated.meta?.kategorie_bild_wide_id === wideId);
        console.log(`${ok ? "✅" : "⚠️ "} ${slug} (#${term.id})  slider=${sliderId || "–"} wide=${wideId || "–"}${ok ? "" : "  (Verify fehlgeschlagen — ACF show_in_rest prüfen)"}`);
      } else {
        console.log(`🧪 ${slug} (#${term.id})  → slider=${sliderId || "–"} wide=${wideId || "–"}`);
      }
    } catch (err) {
      console.log(`❌ ${slug}: ${err.message}`);
    }
  }

  if (missing.length) {
    console.log(`\n⚠️  ${missing.length} Term(s) nicht gefunden (manuell zuweisen, sobald angelegt): ${missing.join(", ")}`);
  }
  console.log("\nFertig.");
}

main().catch((err) => {
  console.error("❌ Abbruch:", err);
  process.exit(1);
});
