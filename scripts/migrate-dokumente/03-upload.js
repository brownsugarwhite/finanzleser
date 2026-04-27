#!/usr/bin/env node

/**
 * Phase 3: Upload Dokumente nach WordPress (lokal via WP-CLI)
 *
 * Liest titles.json + inventory.json (für filepath/sha-Korrelation),
 * lädt PDFs in Media Library, erstellt CPT-Posts vom Typ `dokument`
 * mit Title, Excerpt, Meta (dokument_pdf_id) und Taxonomie (dokument_kategorie).
 *
 * Idempotent via upload-log.json (sha256 → { post_id, attachment_id }).
 *
 * Run: node scripts/migrate-dokumente/03-upload.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─────────────────────────────────────────────
// WP-CLI Setup (Local by Flywheel)
// ─────────────────────────────────────────────

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar";

function wp(cmd) {
  const full = `"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`;
  return execSync(full, { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] }).trim();
}

// ─────────────────────────────────────────────
// Files
// ─────────────────────────────────────────────

const TITLES = path.join(__dirname, "titles.json");
const INVENTORY = path.join(__dirname, "inventory.json");
const LOG = path.join(__dirname, "upload-log.json");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

(async function main() {
  if (!fs.existsSync(TITLES)) {
    console.error(`titles.json nicht gefunden — erst Phase 2 laufen lassen.`);
    process.exit(1);
  }
  if (!fs.existsSync(INVENTORY)) {
    console.error(`inventory.json nicht gefunden — erst Phase 1 laufen lassen.`);
    process.exit(1);
  }

  const titles = readJson(TITLES);
  const inventory = readJson(INVENTORY);
  const log = fs.existsSync(LOG) ? readJson(LOG) : {};

  // sha → filepath aus inventory
  const shaToFilepath = {};
  for (const r of inventory) shaToFilepath[r.sha256] = r.filepath;

  const todo = titles.filter((t) => !log[t.sha256]);
  console.log(`\ntitles.json: ${titles.length} | bereits hochgeladen: ${Object.keys(log).length} | offen: ${todo.length}\n`);

  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < todo.length; i++) {
    const rec = todo[i];
    const idx = i + 1;
    const prefix = `[${idx}/${todo.length}]`;
    const filepath = shaToFilepath[rec.sha256];

    if (!filepath || !fs.existsSync(filepath)) {
      console.log(`${prefix} ✗ ${rec.filename} — Quelldatei fehlt`);
      failCount++;
      continue;
    }

    try {
      process.stdout.write(`${prefix} ${rec.filename} … `);

      // 1. Existiert ein Dokument-Post mit diesem Slug schon?
      const existingId = wp(
        `post list --post_type=dokument --name=${shellQuote(rec.slug_vorschlag)} --field=ID --format=ids`
      );
      if (existingId.trim()) {
        // Skip + ins Log eintragen
        log[rec.sha256] = { post_id: parseInt(existingId.trim(), 10), attachment_id: null, skipped: "exists" };
        writeJson(LOG, log);
        console.log(`⏭  Post existiert bereits (ID ${existingId.trim()})`);
        continue;
      }

      // 2. PDF in Media Library
      const importOut = wp(
        `media import ${shellQuote(filepath)} --title=${shellQuote(rec.titel)} --porcelain`
      );
      const attachmentId = parseInt(importOut.trim().split("\n").pop(), 10);
      if (!attachmentId) throw new Error(`media import lieferte keine ID: ${importOut}`);

      // 3. CPT-Post anlegen (mit Slug, Excerpt, leerer Body)
      const postId = parseInt(
        wp(
          `post create --post_type=dokument --post_status=publish --porcelain ` +
          `--post_title=${shellQuote(rec.titel)} ` +
          `--post_name=${shellQuote(rec.slug_vorschlag)} ` +
          `--post_excerpt=${shellQuote(rec.beschreibung)}`
        ).trim(),
        10
      );
      if (!postId) throw new Error(`post create lieferte keine ID`);

      // 4. Meta dokument_pdf_id
      wp(`post meta update ${postId} dokument_pdf_id ${attachmentId}`);

      // 5. Term zuweisen — IMMER --by=slug, sonst interpretiert WP-CLI
      // den Wert als Term-NAMEN und legt einen neuen Term mit diesem Namen an.
      if (rec.kategorie_slug) {
        wp(`post term set ${postId} dokument_kategorie ${rec.kategorie_slug} --by=slug`);
      }

      log[rec.sha256] = { post_id: postId, attachment_id: attachmentId };
      writeJson(LOG, log);
      okCount++;
      console.log(`✓ Post #${postId} + Attachment #${attachmentId}`);
    } catch (err) {
      failCount++;
      const msg = (err.stderr ? err.stderr.toString() : err.message).split("\n").filter((l) => l && !/Deprecated/.test(l)).slice(0, 2).join(" | ");
      console.log(`✗ ${msg}`);
    }
  }

  console.log(`\nFertig. ✓ ${okCount} | ✗ ${failCount} | Log: ${LOG}`);
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
