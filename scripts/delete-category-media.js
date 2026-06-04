#!/usr/bin/env node

/**
 * Löscht die in einer früheren Runde hochgeladenen Kategorie-Medien (force) —
 * nötig, um geänderte Bilder wirklich zu ersetzen (REST hat kein File-Replace).
 * Titelbilder werden NICHT angefasst.
 *
 * Liest eine upload-results.json (Default: assets/webp/upload-results.json, oder
 * Pfad als 1. Argument) und löscht alle Einträge mit `termSlug` per
 * DELETE /wp-json/wp/v2/media/{id}?force=true.
 *
 * Aufruf:
 *   WP_URL=https://staging.finanzleser.de WP_USER='…' WP_APP_PASSWORD='…' \
 *   node scripts/delete-category-media.js [pfad/zu/upload-results.json] [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const resultsPath = args.find((a) => !a.startsWith("--")) || path.join(ROOT, "assets", "webp", "upload-results.json");

const BASE_URL = (process.env.WP_URL || "").replace(/\/$/, "");
const USER = process.env.WP_USER || "";
const PASS = process.env.WP_APP_PASSWORD || "";
if (!BASE_URL || !USER || !PASS) {
  console.error("❌ Bitte WP_URL, WP_USER und WP_APP_PASSWORD als ENV setzen.");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

async function main() {
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Ergebnis-Datei nicht gefunden: ${resultsPath}`);
    process.exit(1);
  }
  const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
  const termsArg = args.find((a) => a.startsWith("--terms="));
  const termFilter = termsArg ? new Set(termsArg.split("=")[1].split(",").map((s) => s.trim())) : null;
  const cats = results.filter((r) => r.termSlug && r.mediaId && (!termFilter || termFilter.has(r.termSlug)));
  console.log(`${DRY_RUN ? "🧪 DRY-RUN  " : ""}Ziel: ${BASE_URL}  ·  ${cats.length} alte Kategorie-Medien`);

  let ok = 0, fail = 0;
  for (const r of cats) {
    if (DRY_RUN) { console.log(`🧪 würde löschen #${r.mediaId} (${r.sanitizedName})`); continue; }
    try {
      const res = await fetch(`${BASE_URL}/wp-json/wp/v2/media/${r.mediaId}?force=true`, {
        method: "DELETE",
        headers: { Authorization: AUTH },
      });
      if (res.ok) { ok++; console.log(`🗑️  #${r.mediaId} (${r.sanitizedName})`); }
      else { fail++; const t = await res.text(); console.log(`⚠️  #${r.mediaId}: HTTP ${res.status} ${t.slice(0, 120)}`); }
    } catch (err) { fail++; console.log(`❌ #${r.mediaId}: ${err.message}`); }
  }
  console.log(`\nGelöscht: ${ok} · Fehler/übersprungen: ${fail}`);
}

main().catch((err) => { console.error("❌ Abbruch:", err); process.exit(1); });
