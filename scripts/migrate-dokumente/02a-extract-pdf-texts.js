#!/usr/bin/env node

/**
 * Phase 2a: Extrahiert Text der ersten Seite jedes PDFs
 *
 * Mechanisch (kein LLM). Output dient als Input für die Titel-Generierung,
 * die anschließend von Claude (in der Konversation) erledigt wird.
 *
 * Output: pdf-extracts.json (Array von { sha256, filename, ordner, kategorie_slug, jahr, slug_vorschlag, text })
 *
 * Run: node scripts/migrate-dokumente/02a-extract-pdf-texts.js
 */

const fs = require("fs");
const path = require("path");

const INVENTORY = path.join(__dirname, "inventory.json");
const OUTPUT = path.join(__dirname, "pdf-extracts.json");

const MAX_TEXT_CHARS = 1500;

async function extractFirstPageText(pdfPath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buffer = fs.readFileSync(pdfPath);
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data: uint8, useSystemFonts: true }).promise;
  if (doc.numPages === 0) return "";
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  return content.items
    .map((it) => ("str" in it ? it.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

(async function main() {
  if (!fs.existsSync(INVENTORY)) {
    console.error(`Inventar nicht gefunden: ${INVENTORY}`);
    process.exit(1);
  }
  const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
  const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : [];
  const doneShas = new Set(existing.map((e) => e.sha256));

  const todo = inventory.filter((r) => !doneShas.has(r.sha256));
  console.log(`Inventar: ${inventory.length} | Bereits extrahiert: ${existing.length} | Offen: ${todo.length}`);

  for (let i = 0; i < todo.length; i++) {
    const record = todo[i];
    const idx = i + 1;
    process.stdout.write(`[${idx}/${todo.length}] ${record.filename} … `);
    try {
      const text = await extractFirstPageText(record.filepath);
      existing.push({
        sha256: record.sha256,
        filename: record.filename,
        relpath: record.relpath,
        ordner: record.ordner,
        kategorie_slug: record.kategorie_slug,
        jahr: record.jahr,
        slug_vorschlag: record.slug_vorschlag,
        text,
      });
      fs.writeFileSync(OUTPUT, JSON.stringify(existing, null, 2));
      console.log(`✓ ${text.length} Zeichen`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }

  console.log(`\nFertig. ${existing.length} Extracts in ${OUTPUT}`);
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
