#!/usr/bin/env node

/**
 * Phase 3-Fix: Korrigiert die Kategorie-Zuweisung
 *
 * Bug: `wp post term set <id> dokument_kategorie <term_id>` interpretierte
 * die Term-ID als Term-NAME und erzeugte 12 Müll-Terms namens "16522" etc.
 *
 * Fix:
 *  - Alle Posts aus upload-log.json mit slug-basierter Zuweisung neu setzen
 *    (`--by=slug`)
 *  - Müll-Terms (numerische Namen) löschen
 *
 * Run: node scripts/migrate-dokumente/04-fix-categories.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar";

function wp(cmd) {
  const full = `"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`;
  return execSync(full, { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] }).trim();
}

const TITLES = path.join(__dirname, "titles.json");
const LOG = path.join(__dirname, "upload-log.json");

(async function main() {
  const titles = JSON.parse(fs.readFileSync(TITLES, "utf8"));
  const log = JSON.parse(fs.readFileSync(LOG, "utf8"));

  // sha → slug-Map aus titles
  const slugBySha = {};
  for (const t of titles) slugBySha[t.sha256] = t.kategorie_slug;

  console.log(`=== Schritt 1: Term-Zuweisung pro Post korrigieren ===`);
  let fixed = 0;
  for (const [sha, info] of Object.entries(log)) {
    const slug = slugBySha[sha];
    if (!slug || !info.post_id) continue;
    try {
      // `term set` ersetzt alle bestehenden Terms dieser Taxonomy.
      // --by=slug → kein Term-Namen-Parsing mehr.
      wp(`post term set ${info.post_id} dokument_kategorie ${slug} --by=slug`);
      fixed++;
      if (fixed % 20 === 0) process.stdout.write(`  ${fixed} korrigiert …\n`);
    } catch (err) {
      console.log(`  ✗ Post ${info.post_id} (${slug}): ${err.message.split("\n")[0]}`);
    }
  }
  console.log(`  Fertig: ${fixed} Posts korrigiert.\n`);

  console.log(`=== Schritt 2: Müll-Terms (numerische Namen) löschen ===`);
  // Terms mit slug = numerisch (16522, 16523, …) → Müll
  const allTermsJson = wp(`term list dokument_kategorie --fields=term_id,slug,name --format=json`);
  const allTerms = JSON.parse(allTermsJson);
  const garbage = allTerms.filter((t) => /^\d+$/.test(t.slug));
  console.log(`  ${garbage.length} Müll-Terms gefunden`);

  for (const t of garbage) {
    try {
      wp(`term delete dokument_kategorie ${t.term_id}`);
      console.log(`  ✓ gelöscht: term_id=${t.term_id} slug="${t.slug}"`);
    } catch (err) {
      console.log(`  ✗ term_id=${t.term_id}: ${err.message.split("\n")[0]}`);
    }
  }

  console.log(`\n=== Schritt 3: Verify ===`);
  console.log(wp(`term list dokument_kategorie --fields=term_id,slug,name,count`));
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
