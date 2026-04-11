#!/usr/bin/env node

/**
 * Fixes category assignments for all 202 posts.
 * The original seed used term IDs without --by=id, creating bogus numeric categories.
 * This script reassigns correct categories and cleans up.
 */

const { execSync } = require("child_process");
const articles = require("./articles-converted.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 10 * 1024 * 1024
  }).trim();
}

const CATEGORY_FIXES = {
  "Steuer": "Steuern", "Geldanlage": "Geldanlagen",
  "Sozialversicherungen": "Sozialversicherung", "Steuerplichtige": "Steuerpflichtige",
};
function normCat(name) { return CATEGORY_FIXES[name] || name; }

// ─── Build category slug map ───
console.log("📂 Lade Kategorien...\n");
const catsByName = {};
const catsById = {};
try {
  const cats = JSON.parse(wp('term list category --fields=term_id,name,slug,parent --format=json'));
  cats.forEach(c => {
    catsByName[c.name.toLowerCase()] = c;
    catsById[c.term_id] = c;
  });
} catch (e) {}

// ─── Delete bogus numeric categories ───
console.log("🗑️  Lösche fehlerhafte Zahlen-Kategorien...\n");
let deletedCats = 0;
for (const [id, cat] of Object.entries(catsById)) {
  if (/^\d+$/.test(cat.name)) {
    try {
      wp(`term delete category ${id}`);
      deletedCats++;
    } catch (e) {}
  }
}
console.log(`  ${deletedCats} Zahlen-Kategorien gelöscht\n`);

// ─── Reassign categories to posts ───
console.log(`📝 Weise ${articles.length} Beiträgen korrekte Kategorien zu...\n`);

// Refresh category list after deletion
const freshCats = {};
try {
  const cats = JSON.parse(wp('term list category --fields=term_id,name,slug --format=json'));
  cats.forEach(c => { freshCats[c.name.toLowerCase()] = c.term_id; });
} catch (e) {}

let fixed = 0;
let errors = 0;

for (const article of articles) {
  try {
    // Find post ID
    const postId = wp(`post list --post_type=post --name="${article.slug}" --format=ids`).trim();
    if (!postId) {
      console.log(`⚠️  ${article.slug}: Post nicht gefunden`);
      continue;
    }

    // Collect category slugs
    const catSlugs = [];
    for (const h of article.hauptkategorien) {
      const name = normCat(h).toLowerCase();
      if (freshCats[name]) catSlugs.push(freshCats[name]);
    }
    for (const s of article.subkategorien) {
      const name = normCat(s).toLowerCase();
      if (freshCats[name]) catSlugs.push(freshCats[name]);
    }

    if (catSlugs.length) {
      wp(`post term set ${postId} category ${catSlugs.join(" ")} --by=id`);
      console.log(`✅ ${article.slug} → [${catSlugs.join(", ")}]`);
    } else {
      console.log(`⚠️  ${article.slug}: Keine Kategorien gefunden`);
    }
    fixed++;
  } catch (e) {
    console.log(`❌ ${article.slug}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ ${fixed} gefixt, ${errors} Fehler`);
