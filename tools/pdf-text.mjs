#!/usr/bin/env node
// Text aus einem PDF ziehen (pdfjs-dist aus dem Projekt): node tools/pdf-text.mjs <datei.pdf> [vonSeite] [bisSeite]
// Zeilen werden anhand der y-Position zusammengesetzt; Tabellenzellen erscheinen mit Leerzeichen getrennt.
import fs from "node:fs";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const [datei, von = "1", bis = ""] = process.argv.slice(2);
if (!datei) { console.error("Aufruf: node tools/pdf-text.mjs <datei.pdf> [vonSeite] [bisSeite]"); process.exit(1); }
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(datei)), useSystemFonts: true }).promise;
const a = Number(von), b = bis ? Number(bis) : doc.numPages;
console.log(`Seiten: ${doc.numPages}`);
for (let i = a; i <= Math.min(doc.numPages, b); i++) {
  const tc = await (await doc.getPage(i)).getTextContent();
  let zeile = "", letztY = null; const out = [];
  for (const it of tc.items) { const y = Math.round(it.transform[5]); if (letztY !== null && Math.abs(y - letztY) > 3) { out.push(zeile.trim()); zeile = ""; } zeile += it.str + " "; letztY = y; }
  out.push(zeile.trim());
  console.log(`===== Seite ${i}`); console.log(out.filter(Boolean).join("\n"));
}
