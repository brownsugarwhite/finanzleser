#!/usr/bin/env node

/**
 * Parst die Beiträge-Excel und matched sie mit den docx-Dateien.
 * Die 202 docx-Dateien sind die Quelle — Excel liefert Slug, Kategorien, Redirects.
 */

const fs = require("fs");
const path = require("path");
const XLSX = require("/tmp/node_modules/xlsx");

const EXCEL = path.join(__dirname, "..", "assets", "beiträge", "beitraege_kategorien.xlsx");
const TEXT_DIR = path.join(__dirname, "..", "assets", "beiträge", "Text Ratgeber");
const SEO_DIR = path.join(__dirname, "..", "assets", "beiträge", "SEO Ratgeber");
const OUTPUT = path.join(__dirname, "beitraege-master.json");

function slugify(text) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/–/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(s) {
  return s.toLowerCase()
    .replace(/[-_\s]+/g, " ")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .trim();
}

// ─── Read Excel ───
const wb = XLSX.readFile(EXCEL);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

// ─── Build Excel lookup ───
// Map normalized beitrag name → excel row
const excelBySlugifiedName = new Map();
const excelBySlug = new Map();
for (const row of rows) {
  const status = (row["Beitrag aktualisiert"] || "").toString().trim();
  const beitrag = (row["Beitrag"] || "").toString().trim();
  const slug = (row["Slug"] || "").toString().trim();
  const nameClean = beitrag.replace(/\s*\d{4}\s*$/, "").trim();

  const entry = { ...row, status, nameClean };
  const sluggedName = slugify(nameClean);
  if (status === "ja" || slug === "neu") {
    excelBySlugifiedName.set(sluggedName, entry);
  }
  if (slug && slug !== "neu") excelBySlug.set(slug, entry);
}

// ─── Manual overrides for unmatched docx files ───
const MANUAL_OVERRIDES = {
  "Arbeitsmittel_Ratgeber.docx": { slug: "arbeitsmittel", haupt: ["Steuern"], sub: ["Steuererklärung"] },
  "Auslandskrankenversicherung_Ratgeber.docx": { slug: "auslandskrankenversicherung", haupt: ["Versicherungen"], sub: ["Krankenversicherung"] },
  "Beitragsbemessungsgrenzen_Ratgeber.docx": { slug: "beitragsbemessungsgrenzen", haupt: ["Versicherungen"], sub: ["Sozialversicherung"] },
  "Immobilien.docx": { slug: "anlageimmobilie", haupt: ["Finanzen"], sub: ["Geldanlagen"] },
  "Krankenversicherung_Studenten_Ratgeber.docx": { slug: "studenten-krankenversicherung", haupt: ["Versicherungen"], sub: ["Krankenversicherung"] },
  "Kredite.docx": { slug: "kredite", haupt: ["Finanzen"], sub: ["Kredite & Bauen"] },
};

// ─── List docx files ───
const textFiles = fs.readdirSync(TEXT_DIR)
  .filter(f => f.endsWith(".docx") && !f.startsWith("~"))
  .sort();

const seoFiles = new Set(
  fs.readdirSync(SEO_DIR)
    .filter(f => f.endsWith(".docx") && !f.startsWith("~"))
);

console.log(`📊 ${rows.length} Excel-Zeilen, ${textFiles.length} Text-Dateien, ${seoFiles.size} SEO-Dateien\n`);

// ─── Match each docx file to Excel entry ───
const newPosts = [];
const unmatched = [];

for (const file of textFiles) {
  const baseName = file.replace(/_Ratgeber\.docx$|\.docx$/i, "").replace(/_/g, " ").trim();
  const normalized = normalize(baseName);

  // Check manual override
  const manual = MANUAL_OVERRIDES[file];

  // Find matching SEO file
  const seoVariants = [
    file.replace("_Ratgeber.docx", "_SEO.docx"),
    file.replace("_Ratgeber.docx", ".docx"),
    file.replace(".docx", "_SEO.docx"),
    file,
  ];
  const seoFile = seoVariants.find(v => seoFiles.has(v)) || null;

  // Find matching Excel entry by slugified name
  const sluggedBase = slugify(baseName);
  let excelEntry = excelBySlugifiedName.get(sluggedBase);

  // Try partial match
  if (!excelEntry) {
    for (const [key, val] of excelBySlugifiedName) {
      if (key === sluggedBase || key.startsWith(sluggedBase) || sluggedBase.startsWith(key)) {
        excelEntry = val;
        break;
      }
    }
  }

  // Try slug lookup (some Excel entries have custom slugs)
  if (!excelEntry) {
    for (const [slug, val] of excelBySlug) {
      if (slugify(val.nameClean) === sluggedBase && (val.status === "ja" || val["Slug"] === "neu")) {
        excelEntry = val;
        break;
      }
    }
  }

  const haupt = manual ? manual.haupt.join(", ") : excelEntry ? (excelEntry["Neue Hauptkategorie"] || "").toString().trim() : "";
  const sub = manual ? manual.sub.join(", ") : excelEntry ? (excelEntry["Neue Subkategorie"] || "").toString().trim() : "";
  const oldSlug = manual ? manual.slug : excelEntry ? (excelEntry["Slug"] || "").toString().trim() : "";

  const slug = manual ? manual.slug : (oldSlug && oldSlug !== "neu") ? oldSlug : slugify(baseName);

  const post = {
    textFile: file,
    seoFile,
    baseName,
    slug,
    oldSlug: (oldSlug && oldSlug !== "neu") ? oldSlug : null,
    isNew: !oldSlug || oldSlug === "neu",
    hauptkategorien: haupt ? haupt.split(",").map(s => s.trim()).filter(Boolean) : [],
    subkategorien: sub ? sub.split(",").map(s => s.trim()).filter(Boolean) : [],
    matched: !!excelEntry,
  };

  newPosts.push(post);
  if (!excelEntry) unmatched.push({ file, baseName });
}

// ─── Collect redirects from "ja --> X" entries ───
const redirects = [];
const TARGET_FIXES = {
  "Berufsunfähigkeitsverischerung": "Berufsunfähigkeitsversicherung",
};

for (const row of rows) {
  const status = (row["Beitrag aktualisiert"] || "").toString().trim();
  const oldSlug = (row["Slug"] || "").toString().trim();

  if (!status.startsWith("ja -->") && !status.startsWith('ja "')) continue;
  if (!oldSlug) continue;

  let target = status.replace(/^ja\s*-->?\s*/, "").replace(/"/g, "").trim();
  if (status.startsWith('ja "')) target = status.replace(/^ja\s*/, "").replace(/"/g, "").trim();
  if (TARGET_FIXES[target]) target = TARGET_FIXES[target];

  const targetNorm = normalize(target);
  const targetSlugified = slugify(target);

  let targetSlug = null;
  for (const post of newPosts) {
    const postNorm = normalize(post.baseName);
    if (postNorm === targetNorm || post.slug === targetSlugified ||
        postNorm.startsWith(targetNorm) || targetNorm.startsWith(postNorm)) {
      targetSlug = post.slug;
      break;
    }
  }

  redirects.push({
    oldSlug,
    targetName: target,
    targetSlug,
  });
}

// ─── Collect Vergleich entries ───
const vergleiche = [];
for (const row of rows) {
  const status = (row["Beitrag aktualisiert"] || "").toString().trim();
  if (status !== "Vergleich") continue;
  const beitrag = (row["Beitrag"] || "").toString().trim().replace(/\s*\d{4}$/, "").trim();
  const slug = (row["Slug"] || "").toString().trim();
  const haupt = (row["Neue Hauptkategorie"] || "").toString().trim();
  const sub = (row["Neue Subkategorie"] || "").toString().trim();
  vergleiche.push({
    beitrag, slug,
    hauptkategorien: haupt ? haupt.split(",").map(s => s.trim()).filter(Boolean) : [],
    subkategorien: sub ? sub.split(",").map(s => s.trim()).filter(Boolean) : [],
  });
}

// ─── Collect to-delete slugs ───
const toDelete = [];
for (const row of rows) {
  const status = (row["Beitrag aktualisiert"] || "").toString().trim();
  const slug = (row["Slug"] || "").toString().trim();
  if (!slug) continue;
  if (["nein", "Rechner", "Checkliste"].includes(status)) {
    toDelete.push({ slug, reason: status });
  }
  if (status.startsWith("ja -->") || status.startsWith('ja "')) {
    toDelete.push({ slug, reason: "merged" });
  }
}

// ─── Collect PDF slugs to preserve ───
const pdfSlugs = [];
for (const row of rows) {
  const status = (row["Beitrag aktualisiert"] || "").toString().trim();
  const slug = (row["Slug"] || "").toString().trim();
  if (status === "PDF" && slug) pdfSlugs.push(slug);
}

// ─── Output ───
const result = { newPosts, redirects, vergleiche, toDelete, pdfSlugs };
fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2));

console.log(`✅ Neue Beiträge: ${newPosts.length}`);
console.log(`   davon mit Excel-Match: ${newPosts.filter(p => p.matched).length}`);
console.log(`   davon ohne Match: ${unmatched.length}`);
if (unmatched.length) {
  unmatched.forEach(u => console.log(`   ⚠️  ${u.file}`));
}
console.log(`✅ Vergleiche: ${vergleiche.length}`);
console.log(`✅ Redirects: ${redirects.length} (aufgelöst: ${redirects.filter(r => r.targetSlug).length})`);
redirects.filter(r => !r.targetSlug).forEach(r => console.log(`   ⚠️  ${r.oldSlug} → "${r.targetName}"`));
console.log(`🗑️  Zu löschen: ${toDelete.length}`);
console.log(`📄 PDF (schützen): ${pdfSlugs.length}`);
console.log(`\n→ ${OUTPUT}`);
