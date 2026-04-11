#!/usr/bin/env node

/**
 * Erstellt alle 202 Beiträge in WordPress via WP-CLI.
 * Löscht vorher alte Posts, legt Kategorien an, setzt ACF + Yoast SEO.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const articles = require("./articles-converted.json");
const master = require("./beitraege-master.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024
  }).trim();
}

function wpSafe(cmd) {
  try { return wp(cmd); } catch (e) { return ""; }
}

// ─── Normalisierung der Kategorienamen ───
const CATEGORY_FIXES = {
  "Steuer": "Steuern",
  "Geldanlage": "Geldanlagen",
  "Sozialversicherungen": "Sozialversicherung",
  "Steuerplichtige": "Steuerpflichtige",
};

function normCat(name) {
  return CATEGORY_FIXES[name] || name;
}

// ─── Schritt 1: Kategorien sicherstellen ───
console.log("\n📂 Schritt 1: Kategorien anlegen...\n");

// Get existing categories
const existingCats = {};
try {
  const catList = wp('term list category --fields=term_id,name,slug,parent --format=json');
  JSON.parse(catList).forEach(c => {
    existingCats[c.name.toLowerCase()] = { id: c.term_id, slug: c.slug, parent: c.parent };
  });
} catch (e) {
  console.log("⚠️  Konnte Kategorien nicht laden:", e.message);
}

// Main categories
const MAIN_CATS = ["Steuern", "Finanzen", "Versicherungen", "Recht"];
const mainCatIds = {};

for (const cat of MAIN_CATS) {
  const existing = existingCats[cat.toLowerCase()];
  if (existing) {
    mainCatIds[cat] = existing.id;
    console.log(`  ✓ ${cat} (ID ${existing.id})`);
  } else {
    const id = wp(`term create category "${cat}" --porcelain`);
    mainCatIds[cat] = parseInt(id);
    console.log(`  + ${cat} (ID ${id})`);
  }
}

// Collect all needed subcategories
const allSubcats = new Set();
articles.forEach(a => a.subkategorien.forEach(s => allSubcats.add(normCat(s))));
master.vergleiche.forEach(v => v.subkategorien.forEach(s => allSubcats.add(normCat(s))));

// Determine parent for each subcat
function guessParent(subcat) {
  const mapping = {
    "Steuererklärung": "Steuern", "Steuerarten": "Steuern", "Steuerpflichtige": "Steuern",
    "Geldanlagen": "Finanzen", "Konto & Karten": "Finanzen", "Kredite & Bauen": "Finanzen", "Energiekosten": "Finanzen",
    "Krankenversicherung": "Versicherungen", "Altersvorsorge": "Versicherungen", "Sozialversicherung": "Versicherungen",
    "Berufsunfähigkeit": "Versicherungen", "Sachversicherungen": "Versicherungen", "Unfallversicherung": "Versicherungen",
    "Tierversicherungen": "Versicherungen", "Pflegeversicherung": "Versicherungen", "Rentenversicherung": "Versicherungen",
    "Arbeitsrecht": "Recht", "Ehe & Familie": "Recht", "Mietrecht": "Recht", "Erbrecht": "Recht",
    "Berufsunfähigkeitsversicherung": "Versicherungen",
  };
  return mapping[subcat] || null;
}

const subCatIds = {};
for (const sub of allSubcats) {
  const existing = existingCats[sub.toLowerCase()];
  if (existing) {
    subCatIds[sub] = existing.id;
    console.log(`  ✓ ${sub} (ID ${existing.id})`);
  } else {
    const parent = guessParent(sub);
    const parentId = parent ? mainCatIds[parent] : 0;
    try {
      const id = wp(`term create category "${sub}" --parent=${parentId} --porcelain`);
      subCatIds[sub] = parseInt(id);
      console.log(`  + ${sub} → ${parent || "root"} (ID ${id})`);
    } catch (e) {
      console.log(`  ⚠️ ${sub}: ${e.message}`);
    }
  }
}

// ─── Schritt 2: Alte Posts löschen ───
console.log("\n🗑️  Schritt 2: Alte Posts löschen...\n");

// Get all current post IDs (exclude PDF slugs)
const pdfSlugs = new Set(master.pdfSlugs);
let deletedCount = 0;

try {
  const allPosts = wp('post list --post_type=post --post_status=any --fields=ID,post_name --format=json');
  const posts = JSON.parse(allPosts);

  for (const post of posts) {
    if (pdfSlugs.has(post.post_name)) {
      console.log(`  📄 ${post.post_name} (PDF, übersprungen)`);
      continue;
    }
    try {
      wp(`post delete ${post.ID} --force`);
      deletedCount++;
    } catch (e) {}
  }
  console.log(`  🗑️  ${deletedCount} Posts gelöscht, ${pdfSlugs.size} PDF-Posts behalten`);
} catch (e) {
  console.log("  ⚠️  Fehler beim Löschen:", e.message);
}

// ─── Schritt 3: 202 neue Posts erstellen ───
console.log(`\n📝 Schritt 3: ${articles.length} Beiträge erstellen...\n`);

// Get checkliste IDs for relationship field
const checklisteIds = {};
try {
  const clList = wp('post list --post_type=checkliste --fields=ID,post_name --format=json');
  JSON.parse(clList).forEach(c => { checklisteIds[c.post_name] = c.ID; });
} catch (e) {}

let created = 0;
let errors = 0;

for (const article of articles) {
  try {
    // Write content to temp file (avoid shell escaping issues)
    const tmpFile = `/tmp/wp-article-${article.slug}.html`;
    fs.writeFileSync(tmpFile, article.content);

    // Create post
    const postId = wp(`post create "${tmpFile}" --post_type=post --post_title="${article.title.replace(/"/g, '\\"')}" --post_name="${article.slug}" --post_status=publish --porcelain`);
    const id = postId.trim();

    // Set categories
    const catIds = [];
    for (const h of article.hauptkategorien) {
      const catId = mainCatIds[normCat(h)];
      if (catId) catIds.push(catId);
    }
    for (const s of article.subkategorien) {
      const catId = subCatIds[normCat(s)];
      if (catId) catIds.push(catId);
    }
    if (catIds.length) {
      wp(`post term set ${id} category ${catIds.join(" ")}`);
    }

    // ACF: Untertitel
    if (article.untertitel) {
      wp(`post meta update ${id} beitrag_untertitel "${article.untertitel.replace(/"/g, '\\"')}"`);
      wp(`post meta update ${id} _beitrag_untertitel field_69b95f187a76f`);
    }

    // ACF: Checkliste relationship
    if (article.checklisteSlug && checklisteIds[article.checklisteSlug]) {
      const clId = checklisteIds[article.checklisteSlug];
      // ACF relationship stores serialized array
      wp(`post meta update ${id} beitrag_checkliste '${clId}'`);
      wp(`post meta update ${id} _beitrag_checkliste field_69b9721bfa0cb`);
    }

    // Yoast SEO
    if (article.seo.titleTag) {
      wp(`post meta update ${id} _yoast_wpseo_title "${article.seo.titleTag.replace(/"/g, '\\"')}"`);
    }
    if (article.seo.metaDesc) {
      wp(`post meta update ${id} _yoast_wpseo_metadesc "${article.seo.metaDesc.replace(/"/g, '\\"')}"`);
    }
    if (article.seo.focusKw) {
      wp(`post meta update ${id} _yoast_wpseo_focuskw "${article.seo.focusKw.replace(/"/g, '\\"')}"`);
    }

    // Clean up temp file
    fs.unlinkSync(tmpFile);

    console.log(`✅ ${article.slug} (ID ${id})`);
    created++;
  } catch (e) {
    console.log(`❌ ${article.slug}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ ${created} erstellt, ${errors} Fehler`);

// ─── Schritt 4: Verifizierung ───
console.log("\n📊 Verifizierung...\n");
try {
  const total = wp('post list --post_type=post --post_status=publish --format=ids');
  const count = total.trim().split(/\s+/).filter(Boolean).length;
  console.log(`  Beiträge (publish): ${count}`);
} catch (e) {}
