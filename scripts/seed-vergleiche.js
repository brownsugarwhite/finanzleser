#!/usr/bin/env node

/**
 * Erstellt 39 Vergleich-CPTs in WordPress via WP-CLI.
 */

const { execSync } = require("child_process");
const master = require("./beitraege-master.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 10 * 1024 * 1024
  }).trim();
}

console.log(`\n🔄 Erstelle ${master.vergleiche.length} Vergleich-CPTs...\n`);

let created = 0;
let skipped = 0;

for (const v of master.vergleiche) {
  // Check if already exists
  try {
    const existing = wp(`post list --post_type=vergleich --name="${v.slug}" --format=ids`);
    if (existing.trim()) {
      console.log(`⏭️  ${v.slug}: bereits vorhanden`);
      skipped++;
      continue;
    }
  } catch (e) {}

  try {
    const title = v.beitrag.replace(/\s*Vergleich\s*$/, " Vergleich").trim();
    const desc = `Vergleichen Sie aktuelle Angebote: ${title.replace(" Vergleich", "")} – Konditionen, Leistungen und Preise im Überblick.`;

    const postId = wp(`post create --post_type=vergleich --post_title="${title.replace(/"/g, '\\"')}" --post_name="${v.slug}" --post_status=publish --porcelain`);

    wp(`post meta update ${postId.trim()} vergleich_beschreibung "${desc.replace(/"/g, '\\"')}"`);
    wp(`post meta update ${postId.trim()} _vergleich_beschreibung field_vergleich_beschreibung`);

    console.log(`✅ ${v.slug} (ID ${postId.trim()})`);
    created++;
  } catch (e) {
    console.log(`❌ ${v.slug}: ${e.message.split("\n")[0]}`);
  }
}

console.log(`\n✨ ${created} erstellt, ${skipped} übersprungen`);

try {
  const total = wp('post list --post_type=vergleich --format=ids');
  console.log(`📊 Gesamt Vergleiche: ${total.trim().split(/\s+/).filter(Boolean).length}\n`);
} catch (e) {}
