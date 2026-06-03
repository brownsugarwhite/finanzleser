#!/usr/bin/env node

/**
 * Visual-Optimierung: PNG → WebP (Q80), pro Typ größenoptimiert.
 *
 * Liest:
 *   assets/png_1920/titelbilder/*.png   (Beitragsbilder, NNNN_topic.png)
 *   assets/png_1920/categories/*.png     (cat_ und subcat_, Slider + _WIDE-Banner)
 * Schreibt:
 *   assets/webp/titelbilder/*.webp
 *   assets/webp/categories/*.webp
 *   assets/webp/manifest.json            (Vertrag für upload-media.js + assign-category-images.js)
 *
 * sharp ist transitiv über Next.js in node_modules vorhanden (kein eigener dep-Eintrag).
 *
 * Aufruf:  node scripts/optimize-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "assets", "png_1920");
const OUT_DIR = path.join(ROOT, "assets", "webp");

const WEBP_QUALITY = 80;
const WIDTH = { titelbild: 1200, slider: 1400, wide: 1920 };

// ── Mappings (Quelle: lib/categories.ts + lib/navItems.ts) ──────────────
// Hauptkategorien: Bildname-Token → { slug (WP-Term), display (Alt-Text, mit Umlaut) }
const MAIN_CATEGORIES = {
  finanzen: { slug: "finanzen", display: "Finanzen" },
  recht: { slug: "recht", display: "Recht" },
  steuer: { slug: "steuern", display: "Steuern" }, // Bild „steuer" → Term „steuern"
  versicherungen: { slug: "versicherungen", display: "Versicherungen" },
};

// Subkategorien: normalisierter Kind-Token → { slug (WP-Term), label (Alt-Text, mit Umlaut) }
const SUBCATEGORIES = {
  arbeitsrecht: { slug: "arbeitsrecht", label: "Arbeitsrecht" },
  ehefamilie: { slug: "ehe-familie", label: "Ehe & Familie" },
  mietrecht: { slug: "mietrecht", label: "Mietrecht" },
  steuerarten: { slug: "steuerarten", label: "Steuerarten" },
  steuererklaerung: { slug: "steuererklaerung", label: "Steuererklärung" },
  altersvorsorge: { slug: "altersvorsorge", label: "Altersvorsorge" },
};

// Akronyme/Eigennamen für Titelbild-Alt-Texte (Key = lowercase-Token)
const ACRONYMS = { pkv: "PKV", gkv: "GKV", bafög: "BAföG", elster: "ELSTER" };

// ── Helpers ─────────────────────────────────────────────────────────────

/** Umlaute/ß → ASCII-Digraphe (für Dateinamen + Lookup-Keys). */
function translit(s) {
  return s
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "ae").replace(/Ö/g, "oe").replace(/Ü/g, "ue")
    .replace(/ß/g, "ss");
}

/** Dateiname-Basis säubern: lowercase, transliteriert, web-safe. */
function sanitizeName(base) {
  return translit(base.toLowerCase())
    .replace(/&/g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

/** Normalisierter Lookup-Key (umlaut-frei, nur alnum). */
function normKey(s) {
  return translit(s.toLowerCase()).replace(/[^a-z0-9]/g, "");
}

/** Titelbild-Alt-Text: NNNN_ weg, erstes Wort groß, Akronyme ersetzt, Umlaute erhalten. */
function titelbildAltText(base) {
  const withoutIndex = base.replace(/^\d+[_\s]+/, "");
  const tokens = withoutIndex.split(/[_\s]+/).filter(Boolean);
  return tokens
    .map((tok, i) => {
      const lower = tok.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      if (i === 0) return tok.charAt(0).toUpperCase() + tok.slice(1);
      return tok;
    })
    .join(" ");
}

// ── Klassifizierung einer Kategorie-Datei ────────────────────────────────
// Liefert { type, width, termSlug, isWide, altText, skip?, reason? }
function classifyCategory(base) {
  const isWide = /_wide$/i.test(base);
  const core = base.replace(/_wide$/i, "");
  const parts = core.split("_");

  // Dubletten-Marker: endet auf _<ziffer> (z. B. steuerarten_1) → überspringen
  if (/_\d+$/.test(core)) {
    return { skip: true, reason: `Dubletten-Variante (${base}) übersprungen` };
  }

  const prefix = parts[0]; // "cat" | "subcat"
  const rest = parts.slice(1); // ["finanzen"] oder ["versicherungen","altersvorsorge"]

  // Hauptkategorie: cat_<name> (genau ein Rest-Token, und im MAIN-Mapping)
  if (prefix === "cat" && rest.length === 1 && MAIN_CATEGORIES[rest[0]]) {
    const m = MAIN_CATEGORIES[rest[0]];
    return {
      type: isWide ? "cat-wide" : "cat-slider",
      width: isWide ? WIDTH.wide : WIDTH.slider,
      termSlug: m.slug,
      isWide,
      altText: isWide ? `Kategorie ${m.display} Banner` : `Kategorie ${m.display}`,
    };
  }

  // Subkategorie: subcat_<parent>_<child>  ODER  fehlbenanntes cat_<parent>_<child>
  // (z. B. cat_versicherungen_altersvorsorge ist eigentlich ein Subkat-Slider)
  const childToken = rest.slice(1).join("_"); // alles nach dem Parent
  const sub = SUBCATEGORIES[normKey(childToken)];
  if ((prefix === "subcat" || prefix === "cat") && rest.length >= 2 && sub) {
    return {
      type: isWide ? "subcat-wide" : "subcat-slider",
      width: isWide ? WIDTH.wide : WIDTH.slider,
      termSlug: sub.slug,
      isWide,
      altText: isWide ? `${sub.label} Banner` : sub.label,
    };
  }

  return { skip: true, reason: `Unbekanntes Kategorie-Schema: ${base}` };
}

// ── Hauptlauf ─────────────────────────────────────────────────────────────

async function convert(srcPath, outPath, width) {
  await sharp(srcPath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outPath);
  return fs.statSync(outPath).size;
}

async function main() {
  const manifest = [];
  const skipped = [];

  // ── Titelbilder ──
  const titelDir = path.join(SRC_DIR, "titelbilder");
  const titelOut = path.join(OUT_DIR, "titelbilder");
  fs.mkdirSync(titelOut, { recursive: true });

  const titelFiles = fs.readdirSync(titelDir).filter((f) => /\.png$/i.test(f)).sort();
  for (const file of titelFiles) {
    // NFC: macOS-Dateinamen sind dekomponiert (ä = a + ◌̈) — sonst greifen die Umlaut-Regeln nicht
    const base = file.replace(/\.png$/i, "").normalize("NFC");
    const sanitized = sanitizeName(base);
    const outName = `${sanitized}.webp`;
    const outPath = path.join(titelOut, outName);
    const altText = titelbildAltText(base);
    const bytes = await convert(path.join(titelDir, file), outPath, WIDTH.titelbild);
    manifest.push({
      source: path.relative(ROOT, path.join(titelDir, file)),
      output: path.relative(ROOT, outPath),
      sanitizedName: sanitized,
      type: "titelbild",
      altText,
      title: altText,
      bytes,
    });
    console.log(`📰 ${file} → ${outName}  (${(bytes / 1024).toFixed(0)} kB)  alt="${altText}"`);
  }

  // ── Kategorien / Subkategorien ──
  const catDir = path.join(SRC_DIR, "categories");
  const catOut = path.join(OUT_DIR, "categories");
  fs.mkdirSync(catOut, { recursive: true });

  const catFiles = fs.readdirSync(catDir).filter((f) => /\.png$/i.test(f)).sort();
  for (const file of catFiles) {
    const base = file.replace(/\.png$/i, "").normalize("NFC");
    const info = classifyCategory(base);
    if (info.skip) {
      skipped.push(info.reason);
      console.log(`⏭️  ${file} — ${info.reason}`);
      continue;
    }
    const sanitized = sanitizeName(base);
    const outName = `${sanitized}.webp`;
    const outPath = path.join(catOut, outName);
    const bytes = await convert(path.join(catDir, file), outPath, info.width);
    manifest.push({
      source: path.relative(ROOT, path.join(catDir, file)),
      output: path.relative(ROOT, outPath),
      sanitizedName: sanitized,
      type: info.type,
      termSlug: info.termSlug,
      isWide: info.isWide,
      altText: info.altText,
      title: info.altText,
      bytes,
    });
    console.log(`🗂️  ${file} → ${outName}  [${info.type} · ${info.termSlug}]  (${(bytes / 1024).toFixed(0)} kB)  alt="${info.altText}"`);
  }

  // ── Manifest schreiben ──
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  const totalBytes = manifest.reduce((s, m) => s + m.bytes, 0);
  console.log("\n── Zusammenfassung ──");
  console.log(`  Titelbilder:  ${manifest.filter((m) => m.type === "titelbild").length}`);
  console.log(`  Kategorien:   ${manifest.filter((m) => m.type !== "titelbild").length}`);
  console.log(`  Übersprungen: ${skipped.length}`);
  skipped.forEach((s) => console.log(`     • ${s}`));
  console.log(`  Gesamt WebP:  ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Manifest:     ${path.relative(ROOT, manifestPath)}`);
}

main().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});
