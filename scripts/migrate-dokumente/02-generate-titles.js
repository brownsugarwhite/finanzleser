#!/usr/bin/env node

/**
 * Phase 2: Titel + Beschreibung pro PDF via Claude API generieren
 *
 * Liest inventory.json, extrahiert pro PDF den Text der ersten Seite,
 * lässt Claude einen passenden deutschen Titel + Beschreibung erzeugen,
 * schreibt nach jedem Eintrag in titles.json (resumeable).
 *
 * Setup:
 *   1. API-Key in .env.local: ANTHROPIC_API_KEY=sk-ant-...
 *   2. node scripts/migrate-dokumente/02-generate-titles.js
 *
 * Resume:
 *   Bereits in titles.json vorhandene SHAs werden übersprungen.
 *   Skript kann jederzeit per Ctrl+C unterbrochen werden.
 */

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;

// Mini-.env-Loader (kein dotenv-Dep nötig)
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    process.env[key] = raw.replace(/^['"]|['"]$/g, "");
  }
}
loadEnv(path.join(__dirname, "..", "..", ".env.local"));
loadEnv(path.join(__dirname, "..", "..", ".env"));

const INVENTORY = path.join(__dirname, "inventory.json");
const OUTPUT = path.join(__dirname, "titles.json");

const MODEL = "claude-sonnet-4-5"; // Robust + günstig genug für 137 Calls
const MAX_PDF_TEXT_CHARS = 1500;

// ─────────────────────────────────────────────
// PDF-Text-Extraktion (erste Seite)
// ─────────────────────────────────────────────

async function extractFirstPageText(pdfPath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buffer = fs.readFileSync(pdfPath);
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data: uint8, useSystemFonts: true }).promise;
  if (doc.numPages === 0) return "";
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const text = content.items
    .map((it) => ("str" in it ? it.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, MAX_PDF_TEXT_CHARS);
}

// ─────────────────────────────────────────────
// Claude-Call
// ─────────────────────────────────────────────

const SYSTEM_PROMPT = `Du erstellst Metadaten für eine deutsche Finanz-Dokumenten-Bibliothek (finanzleser.de).

Aus Dateiname, Quellordner und PDF-Anfangstext erzeugst du:
1. **titel**: prägnanter, redaktionell sauberer deutscher Titel der Broschüre/des Merkblatts (max ~60 Zeichen, kein Dateinamen-Stil, keine Anführungszeichen, keine Jahreszahlen wenn nicht inhaltlich relevant)
2. **beschreibung**: 1-2 Sätze, 150-300 Zeichen, was der Leser im Dokument findet (Wer? Was? Wofür?). Kein Marketing-Geschwafel.

Antworte NUR mit gültigem JSON in genau diesem Format:
{"titel":"...","beschreibung":"..."}`;

async function generateMetadata(client, record, pdfText) {
  const userMessage = [
    `Dateiname: ${record.filename}`,
    `Ordner/Kategorie: ${record.ordner} (Slug: ${record.kategorie_slug || "—"})`,
    record.jahr ? `Jahr: ${record.jahr}` : null,
    "",
    "PDF-Anfangstext:",
    pdfText || "(kein Text extrahierbar)",
  ]
    .filter(Boolean)
    .join("\n");

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Robustes JSON-Parsing (manchmal kommt ```json … ``` rum)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Keine JSON-Antwort: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.titel || !parsed.beschreibung) {
    throw new Error(`Unvollständige Antwort: ${JSON.stringify(parsed)}`);
  }

  return {
    titel: parsed.titel.trim(),
    beschreibung: parsed.beschreibung.trim(),
    usage: { input_tokens: resp.usage.input_tokens, output_tokens: resp.usage.output_tokens },
  };
}

// ─────────────────────────────────────────────
// Main (resumeable)
// ─────────────────────────────────────────────

(async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("FEHLER: ANTHROPIC_API_KEY nicht in .env.local gesetzt.");
    console.error("→ .env.local mit ANTHROPIC_API_KEY=sk-ant-... anlegen.");
    process.exit(1);
  }

  if (!fs.existsSync(INVENTORY)) {
    console.error(`Inventar nicht gefunden: ${INVENTORY} — erst 01-inventory.js laufen lassen.`);
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
  const existing = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, "utf8")) : [];
  const doneShas = new Set(existing.map((e) => e.sha256));

  const todo = inventory.filter((r) => !doneShas.has(r.sha256));
  console.log(`Inventar: ${inventory.length} | Bereits fertig: ${existing.length} | Offen: ${todo.length}`);

  if (todo.length === 0) {
    console.log("Nichts zu tun.");
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let totalInput = 0;
  let totalOutput = 0;
  let okCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < todo.length; i++) {
    const record = todo[i];
    const idx = i + 1;
    const prefix = `[${idx}/${todo.length}]`;

    try {
      process.stdout.write(`${prefix} ${record.filename} … `);
      const pdfText = await extractFirstPageText(record.filepath);
      const meta = await generateMetadata(client, record, pdfText);

      existing.push({
        sha256: record.sha256,
        filename: record.filename,
        relpath: record.relpath,
        kategorie_slug: record.kategorie_slug,
        jahr: record.jahr,
        slug_vorschlag: record.slug_vorschlag,
        titel: meta.titel,
        beschreibung: meta.beschreibung,
      });
      // Atomic write nach jedem Eintrag (gegen Crash)
      fs.writeFileSync(OUTPUT, JSON.stringify(existing, null, 2));

      totalInput += meta.usage.input_tokens;
      totalOutput += meta.usage.output_tokens;
      okCount++;

      console.log(`✓ "${meta.titel}"`);
    } catch (err) {
      failCount++;
      console.log(`✗ ${err.message}`);
    }
  }

  const seconds = Math.round((Date.now() - startTime) / 1000);
  // Sonnet 4.5 Preise (Stand 2026-04): $3/MTok input, $15/MTok output
  const cost = (totalInput * 3 + totalOutput * 15) / 1_000_000;

  console.log("");
  console.log(`Fertig in ${seconds}s. ✓ ${okCount} | ✗ ${failCount}`);
  console.log(`Tokens: ${totalInput} input / ${totalOutput} output`);
  console.log(`Geschätzte Kosten: $${cost.toFixed(3)}`);
  console.log(`Output: ${OUTPUT}`);
})().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
