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

// ── Term-Registry (Quelle: echte WP-Terms auf Staging, Stand 2026-06-04) ──
// parent === null → Hauptkategorie. label = Alt-Text (deutsch, mit Umlaut).
const TERM_REGISTRY = {
  // Hauptkategorien
  finanzen:           { parent: null, label: "Finanzen" },
  versicherungen:     { parent: null, label: "Versicherungen" },
  steuern:            { parent: null, label: "Steuern" },
  recht:              { parent: null, label: "Recht" },
  // Finanzen
  energiekosten:      { parent: "finanzen", label: "Energiekosten" },
  geldanlagen:        { parent: "finanzen", label: "Geldanlagen" },
  "konto-karten":     { parent: "finanzen", label: "Konto & Karten" },
  "kredite-bauen":    { parent: "finanzen", label: "Kredite & Bauen" },
  // Versicherungen
  altersvorsorge:     { parent: "versicherungen", label: "Altersvorsorge" },
  berufsunfaehigkeit: { parent: "versicherungen", label: "Berufsunfähigkeit" },
  krankenversicherung:{ parent: "versicherungen", label: "Krankenversicherung" },
  pflegeversicherung: { parent: "versicherungen", label: "Pflegeversicherung" },
  rentenversicherung: { parent: "versicherungen", label: "Rentenversicherung" },
  sachversicherungen: { parent: "versicherungen", label: "Sachversicherungen" },
  sozialversicherung: { parent: "versicherungen", label: "Sozialversicherung" },
  tierversicherungen: { parent: "versicherungen", label: "Tierversicherungen" },
  unfallversicherung: { parent: "versicherungen", label: "Unfallversicherung" },
  // Steuern
  steuerarten:        { parent: "steuern", label: "Steuerarten" },
  steuererklaerung:   { parent: "steuern", label: "Steuererklärung" },
  steuerpflichtige:   { parent: "steuern", label: "Steuerpflichtige" },
  // Recht
  arbeitsrecht:       { parent: "recht", label: "Arbeitsrecht" },
  "ehe-familie":      { parent: "recht", label: "Ehe & Familie" },
  mietrecht:          { parent: "recht", label: "Mietrecht" },
};

// Alias-Map: normalisierter Bild-Token → Term-Slug. Fängt Tippfehler,
// Singular/Plural, „und"-Schreibweisen und falsche Parent-Präfixe ab.
// Identity-Aliase werden unten automatisch aus TERM_REGISTRY ergänzt.
const ALIAS_MANUAL = {
  steuer: "steuern",                       // cat_steuer → Term steuern
  geldanlage: "geldanlagen",
  kontoundkarten: "konto-karten",
  krediteundbauen: "kredite-bauen",
  eheundfamilie: "ehe-familie",
  erufsunfaehigkeit: "berufsunfaehigkeit", // Tippfehler (fehlendes „b")
  sachversicherung: "sachversicherungen",
  sozielversicherungen: "sozialversicherung", // Tippfehler + Plural→Singular
  sozialversicherungen: "sozialversicherung", // Plural→Singular
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

// Vollständige Alias-Map: Identity (normKey(slug)→slug) + manuelle Varianten.
const ALIAS = (() => {
  const map = { ...ALIAS_MANUAL };
  for (const slug of Object.keys(TERM_REGISTRY)) map[normKey(slug)] = slug;
  return map;
})();

// ── Klassifizierung einer Kategorie-Datei ────────────────────────────────
// Mappt rein über den Kind-Token (Parent-Präfix wird IGNORIERT, da unzuverlässig:
// z. B. lag „arbeitsrecht" fälschlich unter subcat_steuer_). Liefert
// { type, width, termSlug, isWide, altText, canonicalName } oder { skip, reason }.
function classifyCategory(base) {
  const isWide = /_wide$/i.test(base);
  const core = base.replace(/_wide$/i, "");
  const parts = core.split("_").filter(Boolean); // leere Tokens (doppelte __) raus
  const prefix = parts[0]; // "cat" | "subcat"

  let token;
  if (prefix === "cat") token = parts.slice(1).join("_");      // Haupt-Token
  else if (prefix === "subcat") token = parts.slice(2).join("_"); // Kind-Token, Parent egal
  else return { skip: true, reason: `Unbekanntes Präfix: ${base}` };

  const slug = ALIAS[normKey(token)];
  if (!slug) return { skip: true, reason: `Unbekannter Token „${token}" in ${base}` };

  const term = TERM_REGISTRY[slug];
  const isMain = term.parent === null;
  const canonicalName = isMain
    ? `cat_${slug}${isWide ? "_wide" : ""}`
    : `subcat_${term.parent}_${slug}${isWide ? "_wide" : ""}`;

  return {
    type: isMain ? (isWide ? "cat-wide" : "cat-slider") : (isWide ? "subcat-wide" : "subcat-slider"),
    width: isWide ? WIDTH.wide : WIDTH.slider,
    termSlug: slug,
    isWide,
    altText: isMain
      ? (isWide ? `Kategorie ${term.label} Banner` : `Kategorie ${term.label}`)
      : (isWide ? `${term.label} Banner` : term.label),
    canonicalName,
  };
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
    const sanitized = info.canonicalName; // kanonisch aus Registry (korrekter Parent)
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
