#!/usr/bin/env node

/**
 * Fügt Vergleich-Gutenberg-Blöcke in passende Beiträge ein (vor der Checkliste).
 * Privathaftpflicht ist schon erledigt — hier die restlichen 19.
 */

const { execSync } = require("child_process");
const fs = require("fs");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024
  }).trim();
}

// Vergleich-Slug → Beitrag-Slug(s) wo er eingebunden wird
const ASSIGNMENTS = [
  { vergleich: "festgeldvergleich", beitrag: "festgeld" },
  { vergleich: "tagesgeldvergleich", beitrag: "tagesgeld" },
  { vergleich: "autokredit-vergleich", beitrag: "kredite" },
  { vergleich: "ratenkredit-vergleich", beitrag: "kredite" },
  { vergleich: "bausparen-vergleich", beitrag: "bausparvertrag" },
  { vergleich: "baufinanzierung-vergleich", beitrag: "baufinanzierung" },
  { vergleich: "private-krankenversicherung-vergleich", beitrag: "private-krankenversicherung" },
  { vergleich: "gaspreisvergleich", beitrag: "gaspreise" },
  { vergleich: "strompreisvergleich", beitrag: "strompreise" },
  { vergleich: "risikolebensversicherung-vergleich", beitrag: "risikolebensversicherung" },
  { vergleich: "reisekrankenversicherung-vergleich", beitrag: "reiseversicherung" },
  { vergleich: "fahrradversicherung-vergleich", beitrag: "fahrradversicherung" },
  { vergleich: "haus-und-grundbesitzerhaftpflicht-vergleich", beitrag: "hausbesitzerhaftpflichtversicherung" },
  { vergleich: "unfallversicherung-vergleich", beitrag: "unfallversicherung" },
  { vergleich: "gebaeudeversicherung-vergleich", beitrag: "wohngebaeudeversicherung" },
  { vergleich: "rechtsschutzversicherung-vergleich", beitrag: "rechtsschutzversicherung" },
  { vergleich: "hausratversicherung-vergleich", beitrag: "hausratversicherung" },
  { vergleich: "kfz-versicherung-vergleich", beitrag: "kfz-versicherung" },
];

// Baufinanzierung CPT existiert möglicherweise nicht — prüfen/anlegen
try {
  const existing = wp('post list --post_type=vergleich --name="baufinanzierung-vergleich" --format=ids');
  if (!existing.trim()) {
    console.log("📦 Erstelle Baufinanzierung Vergleich CPT...");
    const id = wp('post create --post_type=vergleich --post_title="Baufinanzierung Vergleich" --post_name="baufinanzierung-vergleich" --post_status=publish --porcelain');
    console.log(`   ✅ ID ${id.trim()}`);
  }
} catch (e) {}

console.log(`\n🔗 Füge ${ASSIGNMENTS.length} Vergleiche in Beiträge ein...\n`);

let inserted = 0;
let skipped = 0;
let errors = 0;

for (const { vergleich, beitrag } of ASSIGNMENTS) {
  try {
    // Find the post
    const postId = wp(`post list --post_type=post --name="${beitrag}" --format=ids`).trim();
    if (!postId) {
      console.log(`⚠️  Beitrag "${beitrag}" nicht gefunden`);
      errors++;
      continue;
    }

    // Get current content
    const content = wp(`post get ${postId} --field=post_content`);

    // Check if vergleich already embedded
    if (content.includes(`data-finanzleser-vergleich="${vergleich}"`)) {
      console.log(`⏭️  ${beitrag} ← ${vergleich} (bereits vorhanden)`);
      skipped++;
      continue;
    }

    // Build the vergleich block (rendered div format, like checkliste)
    const vergleichBlock = `<!-- wp:finanzleser/vergleich {"slug":"${vergleich}"} -->\n<div data-finanzleser-vergleich="${vergleich}"></div>\n<!-- /wp:finanzleser/vergleich -->`;

    // Insert before checkliste block if exists, otherwise append at end
    let newContent;
    if (content.includes("wp:finanzleser/checkliste")) {
      // Insert before the checkliste block
      newContent = content.replace(
        /(<!-- wp:finanzleser\/checkliste)/,
        `${vergleichBlock}\n\n$1`
      );
    } else {
      // Append at end
      newContent = content + `\n\n${vergleichBlock}`;
    }

    // Write to temp file and update
    const tmpFile = `/tmp/wp-vergleich-${beitrag}.html`;
    fs.writeFileSync(tmpFile, newContent);
    wp(`post update ${postId} "${tmpFile}"`);
    fs.unlinkSync(tmpFile);

    console.log(`✅ ${beitrag} ← ${vergleich}`);
    inserted++;
  } catch (e) {
    console.log(`❌ ${beitrag}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ ${inserted} eingefügt, ${skipped} übersprungen, ${errors} Fehler`);
