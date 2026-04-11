#!/usr/bin/env node

/**
 * Fix v2: Fixes all category issues:
 * 1. Merge "Sozialversicherungen" → "Sozialversicherung"
 * 2. Merge "Berufsunfähigkeitsversicherung" → "Berufsunfähigkeit"
 * 3. Fix & character matching (Konto & Karten, Kredite & Bauen, Ehe & Familie)
 * 4. Reassign all posts with correct subcategories
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

// Category name normalization
const CATEGORY_MERGES = {
  "Sozialversicherungen": "Sozialversicherung",
  "Berufsunfähigkeitsversicherung": "Berufsunfähigkeit",
  "Steuer": "Steuern",
  "Geldanlage": "Geldanlagen",
  "Steuerplichtige": "Steuerpflichtige",
};

function normCat(name) {
  return CATEGORY_MERGES[name] || name;
}

// ─── Load all categories ───
console.log("📂 Lade Kategorien...\n");
let cats = JSON.parse(wp('term list category --fields=term_id,name,slug,parent --format=json'));

// Build lookup by name (handle &amp; → &)
function buildCatLookup() {
  const lookup = {};
  cats.forEach(c => {
    // WordPress stores & as &amp; in name, but slug is clean
    const name = c.name.replace(/&amp;/g, "&").toLowerCase();
    lookup[name] = c.term_id;
    // Also index by slug for backup
    lookup[c.slug] = c.term_id;
  });
  return lookup;
}

let catLookup = buildCatLookup();

// ─── Step 1: Merge duplicate categories ───
console.log("🔄 Merge Duplikat-Kategorien...\n");

const merges = [
  { from: "Sozialversicherungen", to: "Sozialversicherung" },
  { from: "Berufsunfähigkeitsversicherung", to: "Berufsunfähigkeit" },
];

for (const merge of merges) {
  const fromId = catLookup[merge.from.toLowerCase()];
  const toId = catLookup[merge.to.toLowerCase()];

  if (fromId && toId && fromId !== toId) {
    // Move all posts from source to target
    try {
      const postsInCat = wp(`post list --post_type=post --category=${fromId} --format=ids`).trim();
      if (postsInCat) {
        const postIds = postsInCat.split(/\s+/);
        for (const pid of postIds) {
          try {
            wp(`post term remove ${pid} category ${fromId}`);
            wp(`post term add ${pid} category ${toId} --by=id`);
          } catch (e) {}
        }
        console.log(`  ✅ "${merge.from}" (${fromId}) → "${merge.to}" (${toId}): ${postIds.length} Posts verschoben`);
      }
      // Delete source category
      wp(`term delete category ${fromId}`);
      console.log(`  🗑️  "${merge.from}" gelöscht`);
    } catch (e) {
      console.log(`  ⚠️  ${merge.from}: ${e.message.split("\n")[0]}`);
    }
  } else {
    console.log(`  ⏭️  "${merge.from}" → "${merge.to}" (from: ${fromId}, to: ${toId})`);
  }
}

// Refresh categories after merges
cats = JSON.parse(wp('term list category --fields=term_id,name,slug,parent --format=json'));
catLookup = buildCatLookup();

// ─── Step 2: Reassign all posts with correct categories ───
console.log(`\n📝 Weise ${articles.length} Beiträgen korrekte Kategorien zu...\n`);

function findCatId(name) {
  const normalized = normCat(name);
  // Try exact match (with & handling)
  let id = catLookup[normalized.toLowerCase()];
  if (id) return id;

  // Try slug match
  const slug = normalized.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/&/g, "und").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  id = catLookup[slug];
  if (id) return id;

  return null;
}

let fixed = 0;
let issues = [];

for (const article of articles) {
  const postId = wp(`post list --post_type=post --name="${article.slug}" --format=ids`).trim();
  if (!postId) {
    issues.push(`${article.slug}: Post nicht gefunden`);
    continue;
  }

  const catIds = [];

  // Hauptkategorien
  for (const h of article.hauptkategorien) {
    const id = findCatId(h);
    if (id) catIds.push(id);
    else issues.push(`${article.slug}: Hauptkategorie "${h}" nicht gefunden`);
  }

  // Subkategorien
  for (const s of article.subkategorien) {
    const id = findCatId(s);
    if (id) catIds.push(id);
    else issues.push(`${article.slug}: Subkategorie "${s}" nicht gefunden`);
  }

  // Deduplicate
  const uniqueIds = [...new Set(catIds)];

  if (uniqueIds.length) {
    wp(`post term set ${postId} category ${uniqueIds.join(" ")} --by=id`);
  }
  fixed++;
}

console.log(`✅ ${fixed} Beiträge aktualisiert`);

if (issues.length) {
  console.log(`\n⚠️  ${issues.length} Probleme:`);
  // Deduplicate issues
  const uniqueIssues = [...new Set(issues)];
  uniqueIssues.forEach(i => console.log(`  ${i}`));
}

// ─── Step 3: Verify ───
console.log("\n📊 Verifizierung...\n");
cats = JSON.parse(wp('term list category --fields=term_id,name,slug,count,parent --format=json'));
const byId = {};
cats.forEach(c => byId[c.term_id] = c);

const relevant = cats.filter(c => c.count > 0 || ["steuern", "finanzen", "versicherungen", "recht"].includes(c.slug));
relevant.sort((a, b) => a.name.localeCompare(b.name, "de"));
for (const c of relevant) {
  const parentName = c.parent ? (byId[c.parent]?.name || "?") : "ROOT";
  const name = c.name.replace(/&amp;/g, "&");
  console.log(`  ${c.count}\t${parentName} → ${name} (${c.slug})`);
}
