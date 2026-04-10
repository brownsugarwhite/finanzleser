#!/usr/bin/env node

/**
 * Extrahiert Titel aus allen Checklisten-PDFs
 * Nutzt die gleiche Logik wie checklisteParser.ts:
 * Der Titel ist das erste Text-Item nach dem "C H E C K L I S T E" Marker
 */

const fs = require("fs");
const path = require("path");

const PDF_DIR = path.join(__dirname, "..", "assets", "checklisten");
const OUTPUT = path.join(__dirname, "checklisten-data.json");

function slugify(name) {
  return name
    .replace(/^Checkliste_/, "")
    .replace(/\.pdf$/i, "")
    .replace(/_/g, "-")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function extractTitle(pdfPath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buffer = fs.readFileSync(pdfPath);
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;

  let foundMarker = false;

  for (let p = 1; p <= Math.min(doc.numPages, 2); p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    for (const rawItem of content.items) {
      const str = (rawItem.str || "").trim();
      if (!str) continue;

      if (str === "C H E C K L I S T E") {
        foundMarker = true;
        continue;
      }

      if (foundMarker) {
        return str;
      }
    }
  }

  // Fallback: Dateiname
  return path.basename(pdfPath, ".pdf").replace(/^Checkliste_/, "").replace(/_/g, " ");
}

async function main() {
  const files = fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith(".pdf"))
    .sort();

  console.log(`\n📄 Extrahiere Titel aus ${files.length} PDFs...\n`);

  const results = [];

  for (const file of files) {
    const pdfPath = path.join(PDF_DIR, file);
    try {
      const title = await extractTitle(pdfPath);
      const slug = slugify(file);
      results.push({ filename: file, title, slug });
      console.log(`✅ ${slug} → "${title}"`);
    } catch (err) {
      console.log(`❌ ${file}: ${err.message}`);
      const slug = slugify(file);
      const fallbackTitle = file.replace(/^Checkliste_/, "").replace(/\.pdf$/i, "").replace(/_/g, " ");
      results.push({ filename: file, title: fallbackTitle, slug });
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log(`\n✨ ${results.length} Titel extrahiert → ${OUTPUT}\n`);
}

main();
