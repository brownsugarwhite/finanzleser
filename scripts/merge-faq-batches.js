#!/usr/bin/env node

/**
 * Merged alle batch-*-output.json Dateien aus /tmp/faq-batches/ in scripts/faqs-generated.json.
 * Validiert, dass jede Article-Slug genau 4 FAQ hat.
 *
 * Usage: node scripts/merge-faq-batches.js
 */

const fs = require("fs");
const path = require("path");

const BATCH_DIR = path.join(__dirname, "faq-batches");
const OUTPUT_PATH = path.join(__dirname, "faqs-generated.json");
const ARTICLES_PATH = path.join(__dirname, "articles-converted.json");

const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf-8"));
const articleSlugs = new Set(articles.map((a) => a.slug));

const existing = fs.existsSync(OUTPUT_PATH) ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8")) : {};

const batchFiles = fs.readdirSync(BATCH_DIR).filter((f) => /^batch-\d+-output\.json$/.test(f));
if (batchFiles.length === 0) {
  console.error(`❌ Keine batch-*-output.json in ${BATCH_DIR}`);
  process.exit(1);
}

console.log(`📦 Merge ${batchFiles.length} Batch-Outputs → ${OUTPUT_PATH}\n`);

let added = 0;
let updated = 0;
const problems = [];

for (const file of batchFiles.sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, file), "utf-8"));
  let batchCount = 0;
  for (const [slug, entry] of Object.entries(data)) {
    if (!articleSlugs.has(slug)) {
      problems.push(`${file}: unbekannter Slug "${slug}"`);
      continue;
    }
    const faqs = entry.faqs;
    if (!Array.isArray(faqs) || faqs.length !== 4) {
      problems.push(`${file}:${slug}: ${faqs?.length ?? "?"} FAQ statt 4`);
      continue;
    }
    for (const [i, f] of faqs.entries()) {
      if (!f.question || !f.answer) {
        problems.push(`${file}:${slug}[${i}]: leere Frage/Antwort`);
      }
      if (f.question && !f.question.trim().endsWith("?")) {
        problems.push(`${file}:${slug}[${i}]: Frage ohne Fragezeichen: "${f.question.slice(0, 40)}…"`);
      }
    }
    if (existing[slug]) updated++;
    else added++;
    existing[slug] = { slug, title: entry.title, faqs };
    batchCount++;
  }
  console.log(`  ✓ ${file}: ${batchCount} Artikel`);
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(existing, null, 2));

const missing = articles.filter((a) => !existing[a.slug]).map((a) => a.slug);

console.log(`\n✨ Merge fertig:`);
console.log(`   Neu:         ${added}`);
console.log(`   Aktualisiert: ${updated}`);
console.log(`   Fehlend:     ${missing.length}/${articles.length}`);
if (missing.length) console.log(`   Fehlende Slugs: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`);
if (problems.length) {
  console.log(`\n⚠️  ${problems.length} Probleme:`);
  problems.slice(0, 20).forEach((p) => console.log(`   - ${p}`));
  if (problems.length > 20) console.log(`   (+${problems.length - 20} weitere)`);
}
