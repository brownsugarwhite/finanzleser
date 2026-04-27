#!/usr/bin/env node

/**
 * Phase 1: Inventar der Dokumente-PDFs
 *
 * Scannt /Users/bsw/Desktop/finanzleser/1. DOKUMENTE rekursiv,
 * wendet Auswahl-Logik an (neuestes Jahr, Excludes, Dedup),
 * mappt Top-Level-Ordner auf dokument_kategorie-Slugs.
 *
 * Output: inventory.json mit allen relevanten PDFs.
 *
 * Run:  node scripts/migrate-dokumente/01-inventory.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SOURCE_DIR = "/Users/bsw/Desktop/finanzleser/1. DOKUMENTE";
const OUTPUT = path.join(__dirname, "inventory.json");

// ─────────────────────────────────────────────
// Kategorie-Mapping (Quellordner → Taxonomie-Slug)
// ─────────────────────────────────────────────

const KATEGORIE_MAP = {
  "1. Tabellen": "tabellen",
  "2. Altersvorsorge": "altersvorsorge",
  "3. Rente": "rente",
  "4. Sozialversicherung": "sozialversicherung",
  "5. Steuern": "steuern",
  "6. Private Krankenversicherung": "private-krankenversicherung",
  "7. Gesetzliche Krankenkasse": "gesetzliche-krankenkasse",
  "8. Pflegeversicherung": "pflegeversicherung",
  "9. Versicherungen": "versicherungen",
  "10. Immobilien": "immobilien",
  "11. Familie": "familie",
  "12. Finanzierung": "finanzierung",
  "Arbeit": "arbeit",
};

// Top-Level-PDFs (ohne Ordner) → manuelles Mapping nach Inhalt
const TOPLEVEL_KATEGORIE = {
  "infoblatt-steuer-und-sozialversicherungsrechtliche-landkarte-bav-pst1402.pdf": "altersvorsorge",
  "infoblatt-steuer-und-sozialversicherungsrechtliche-landkarte-pst1400.pdf": "sozialversicherung",
  "infoblatt-steuerliche-frei-und-foerderbetraege-pst1000 (4).pdf": "steuern",
  "infoblatt-wichtige-daten-der-sozialversicherung-pst2000 (2).pdf": "sozialversicherung",
};

// ─────────────────────────────────────────────
// Excludes (laut Plan-Entscheidungen)
// ─────────────────────────────────────────────

const EXCLUDE_PATH_FRAGMENTS = [
  // Steuerformulare aller Jahre außer 2024
  "Steuerformulare/Steuerformulare 2015/",
  "Steuerformulare/Steuerformulare 2016/",
  "Steuerformulare/Steuerformulare 2017/",
  "Steuerformulare/Steuerformulare 2018/",
  "Steuerformulare/Steuerformulare 2019/",
  "Steuerformulare/Steuerformulare 2020/",
  "Steuerformulare/Steuerformulare 2021/",
  "Steuerformulare/Steuerformulare 2022/",
  "Steuerformulare/Steuerformulare 2023/",
  // Sammel-PDF Steuerformulare 2024 (redundant zu Einzelformularen)
  "Steuerformulare 2024/Steuerformulare_2024_komplett.pdf",
  // Steuertabellen 2020 (laut Plan raus)
  "5. Steuern/Steuertabellen/",
  // GKV-Zuzahlungsbefreit-Listen 2017 (laut Plan raus)
  "Zuzahlungsbefreit_sort_",
];

// ─────────────────────────────────────────────
// Jahres-Pattern Dedup
// ─────────────────────────────────────────────
// Bei diesen Datei-Stems wird nur das jüngste Jahr behalten.
// Erkannt anhand identischem Stem nach Entfernen einer 4-stelligen Jahreszahl.
//
// Regex: extrahiere Jahr aus Filename. Bei mehreren PDFs mit gleichem Basis-Stem
// und unterschiedlichem Jahr → nur Maximum behalten.

function extractYear(filepath) {
  // 4-stellige Jahreszahl in Range 2010-2030 aus Pfad oder Filename
  const matches = filepath.match(/(?:^|[^0-9])(20[12][0-9])(?:[^0-9]|$)/g);
  if (!matches) return null;
  const years = matches
    .map((m) => parseInt(m.match(/20[12][0-9]/)[0], 10))
    .filter((y) => y >= 2010 && y <= 2030);
  if (years.length === 0) return null;
  return Math.max(...years);
}

function stemWithoutYear(filename) {
  // Entfernt 4-stellige Jahreszahl + umgebende Trenner; Lowercase, trim.
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_ ]?20[12][0-9][-_ ]?/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function sha256(filepath) {
  const buf = fs.readFileSync(filepath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function slugify(name) {
  return name
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (entry.isFile() && /\.pdf$/i.test(entry.name)) results.push(full);
  }
  return results;
}

function topLevelFolder(filepath) {
  const rel = path.relative(SOURCE_DIR, filepath);
  const parts = rel.split(path.sep);
  if (parts.length === 1) return null; // Top-Level-PDF
  return parts[0];
}

function isExcluded(filepath) {
  const rel = path.relative(SOURCE_DIR, filepath);
  return EXCLUDE_PATH_FRAGMENTS.some((frag) => rel.includes(frag));
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

(function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Quellordner nicht gefunden: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const allPdfs = walk(SOURCE_DIR);
  console.log(`Gefundene PDFs: ${allPdfs.length}`);

  // Stage 1: Excludes anwenden
  const afterExcludes = allPdfs.filter((p) => !isExcluded(p));
  console.log(`Nach Excludes: ${afterExcludes.length}`);

  // Stage 2: Pro Stem nur jüngstes Jahr behalten (innerhalb desselben Ordners)
  const byBucket = new Map(); // key = ordner|stem → { filepath, year }
  for (const filepath of afterExcludes) {
    const filename = path.basename(filepath);
    const ordner = path.dirname(filepath);
    const stem = stemWithoutYear(filename);
    const year = extractYear(filename) ?? extractYear(filepath) ?? -Infinity;
    const key = `${ordner}|${stem}`;
    const prev = byBucket.get(key);
    if (!prev || year > prev.year) byBucket.set(key, { filepath, year });
  }
  const afterDedup = Array.from(byBucket.values()).map((v) => v.filepath);
  console.log(`Nach Jahres-Dedup: ${afterDedup.length}`);

  // Stage 3: SHA-Dedup (Inhaltsgleiche Files)
  const bySha = new Map();
  for (const filepath of afterDedup) {
    const hash = sha256(filepath);
    if (!bySha.has(hash)) bySha.set(hash, filepath);
  }
  const finalFiles = Array.from(bySha.values());
  console.log(`Nach SHA-Dedup: ${finalFiles.length}`);

  // Stage 4: Records zusammenstellen
  const records = finalFiles.map((filepath) => {
    const rel = path.relative(SOURCE_DIR, filepath);
    const filename = path.basename(filepath);
    const ordner = topLevelFolder(filepath);
    const kategorie = ordner
      ? KATEGORIE_MAP[ordner]
      : TOPLEVEL_KATEGORIE[filename] || null;
    const year = extractYear(filename) ?? extractYear(filepath);
    const stats = fs.statSync(filepath);

    return {
      filepath,
      relpath: rel,
      filename,
      ordner: ordner || "(root)",
      kategorie_slug: kategorie,
      jahr: year,
      groesse_bytes: stats.size,
      sha256: sha256(filepath),
      slug_vorschlag: slugify(filename),
    };
  });

  // Sortierung nach Kategorie + Filename
  records.sort((a, b) => {
    const k = (a.kategorie_slug || "").localeCompare(b.kategorie_slug || "", "de");
    return k !== 0 ? k : a.filename.localeCompare(b.filename, "de");
  });

  // Statistiken
  const byKategorie = {};
  let ohneKategorie = 0;
  for (const r of records) {
    if (!r.kategorie_slug) ohneKategorie++;
    else byKategorie[r.kategorie_slug] = (byKategorie[r.kategorie_slug] || 0) + 1;
  }

  console.log("\n=== Verteilung pro Kategorie ===");
  for (const [k, n] of Object.entries(byKategorie).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(35)} ${n}`);
  }
  if (ohneKategorie > 0) console.log(`  (ohne Kategorie)               ${ohneKategorie}`);

  console.log(`\nGesamt: ${records.length} Dokumente`);

  fs.writeFileSync(OUTPUT, JSON.stringify(records, null, 2));
  console.log(`\nGeschrieben: ${OUTPUT}`);
})();
