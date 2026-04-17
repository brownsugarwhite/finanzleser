#!/usr/bin/env node

/**
 * Splittet scripts/articles-converted.json in N Batches für parallele Agenten-Verarbeitung.
 *
 * Output: /tmp/faq-batches/batch-1.json, batch-2.json, …
 * Jede Batch-Datei enthält Array von {slug, title, untertitel, keywords, contentSnippet}.
 *
 * Bereits in scripts/faqs-generated.json vorhandene Slugs werden übersprungen.
 *
 * Usage:
 *   node scripts/prepare-faq-batches.js [--batches N] [--force]
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const NUM_BATCHES = val("--batches") ? parseInt(val("--batches")) : 10;
const FORCE = flag("--force");
const CONTENT_LIMIT = 3000;

const ARTICLES_PATH = path.join(__dirname, "articles-converted.json");
const OUTPUT_PATH = path.join(__dirname, "faqs-generated.json");
const BATCH_DIR = path.join(__dirname, "faq-batches");

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf-8"));
const existing = fs.existsSync(OUTPUT_PATH) ? JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8")) : {};

const todo = articles
  .filter((a) => FORCE || !existing[a.slug])
  .map((a) => ({
    slug: a.slug,
    title: a.title,
    untertitel: a.untertitel || "",
    keywords: a.seo?.keywords || "",
    contentSnippet: stripHtml(a.content).slice(0, CONTENT_LIMIT),
  }));

if (todo.length === 0) {
  console.log(`✨ Alle ${articles.length} Artikel haben bereits FAQs (in ${OUTPUT_PATH})`);
  process.exit(0);
}

fs.rmSync(BATCH_DIR, { recursive: true, force: true });
fs.mkdirSync(BATCH_DIR, { recursive: true });

const perBatch = Math.ceil(todo.length / NUM_BATCHES);
const batches = [];
for (let i = 0; i < NUM_BATCHES; i++) {
  const chunk = todo.slice(i * perBatch, (i + 1) * perBatch);
  if (chunk.length === 0) continue;
  const file = path.join(BATCH_DIR, `batch-${i + 1}.json`);
  fs.writeFileSync(file, JSON.stringify(chunk, null, 2));
  batches.push({ file, count: chunk.length });
}

console.log(`\n📦 FAQ-Batches vorbereitet`);
console.log(`   Artikel total:    ${articles.length}`);
console.log(`   Bereits erledigt: ${Object.keys(existing).length}`);
console.log(`   Zu verarbeiten:   ${todo.length}`);
console.log(`   Batches:          ${batches.length} Dateien in ${BATCH_DIR}`);
batches.forEach((b, i) => console.log(`     ${i + 1}. ${b.file} (${b.count} Artikel)`));
