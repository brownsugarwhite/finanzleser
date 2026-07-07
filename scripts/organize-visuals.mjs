#!/usr/bin/env node
/**
 * organize-visuals.mjs — Sortiert die 162 SVGs in assets/visuals/ in die neue Struktur
 * (titelbilder/ categories/ general/ _unassigned/), benennt sie nach dem per Bildinhalt
 * abgeglichenen png_1920-Zwilling (bzw. nach Inhalt für die 12 ungenutzten) und schreibt
 * assets/visuals/manifest.json. Verlustfrei/nachvollziehbar: origSvg + matchedPng je Eintrag.
 *
 * Quelle: <MATCH>/match-results.json (aus match-visuals.mjs) + visuell verifizierte
 * FALSE-Liste (12 SVGs ohne echten Zwilling) + Inhalts-Namen dafür.
 */
import { promises as fs } from "fs";
import path from "path";

const ROOT = "/Users/bsw/Projekte/finanzleser";
const VIS = path.join(ROOT, "assets/visuals");
const MATCH = process.env.MATCH || "/private/tmp/claude-501/-Users-bsw-Projekte-finanzleser/ea8feb95-7197-4d32-9614-1c0c486f5b1d/scratchpad/match";

// Visuell verifiziert (Montage-Sichtung): SVGs ohne echten png_1920-Zwilling → neu/ungenutzt.
const POOL_NAMES = {
  13: "dino-prozent", 14: "dino-laptop", 15: "smartphone-idee", 16: "maskottchen-papierflieger",
  17: "idee-geld-fragen", 70: "rechner-idee", 75: "kostenmonster", 76: "dino-zeitung",
  77: "dino-dokument", 78: "netzwerk-molekuel", 79: "retro-telefon", 161: "checkliste-stift",
};

const MAX_DIST = 23; // verifizierte Schwelle: echte Treffer ≤21, Fehltreffer ≥27

// NFC-normalisieren (macOS-Dateinamen sind oft NFD/zerlegt → Umlaut-Regex würde sonst
// nicht matchen), Umlaute transliterieren, restliche Diakritika strippen.
const translit = (s) => s.normalize("NFC")
  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue")
  .normalize("NFD").replace(/[̀-ͯ]/g, "");
const sanitize = (s) => translit(s).toLowerCase()
  .replace(/&/g, "-and-").replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^[-_]+|[-_]+$/g, "");

// Alt-Text: NNNN_-Präfix strippen, Slug humanisieren, bekannte Akronyme groß.
function altOf(slug) {
  let s = slug.replace(/^\d{3,4}[_-]/, "").replace(/^(cat|subcat)[_-]/, "").replace(/-and-/g, " & ").replace(/[_-]+/g, " ").trim();
  s = s.replace(/\bwide\b/gi, "").trim();
  s = s.replace(/\b(pkv|gkv|elster|agb|bu)\b/gi, (m) => m.toUpperCase());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function main() {
  const results = JSON.parse(await fs.readFile(path.join(MATCH, "match-results.json"), "utf8"));
  const FALSE = new Set(Object.keys(POOL_NAMES).map(Number));

  const subToType = { titelbilder: "titelbild", general: "general", categories: "category", categories_alt: "category", finanztoolSlider: "general" };
  const typeToDir = { titelbild: "titelbilder", category: "categories", general: "general", pool: "_unassigned" };

  // Kollisions-Erkennung für categories_alt (nur cat_steuer kollidiert): Namen zählen.
  const catNames = {};
  for (const r of results) {
    if (FALSE.has(r.idx) || r.best.dist > MAX_DIST) continue;
    if (r.best.sub === "categories" || r.best.sub === "categories_alt") {
      const base = sanitize(r.best.png.replace(/\.(png|jpg)$/i, ""));
      catNames[base] = (catNames[base] || 0) + 1;
    }
  }

  const manifest = [];
  const moves = [];
  for (const r of results) {
    let type, slug;
    if (FALSE.has(r.idx)) {
      type = "pool"; slug = POOL_NAMES[r.idx];
    } else if (r.best.dist <= MAX_DIST) {
      type = subToType[r.best.sub];
      slug = sanitize(r.best.png.replace(/\.(png|jpg)$/i, ""));
      if (r.best.sub === "categories_alt" && catNames[slug] > 1) slug += "-alt"; // nur echte Kollision
    } else {
      type = "pool"; slug = sanitize(r.svg.replace(/\.svg$/i, "")); // Sicherheitsnetz (kommt nicht vor)
    }
    const dir = typeToDir[type];
    const rel = `${dir}/${slug}.svg`;
    manifest.push({
      file: rel, type, slug, altText: type === "pool" ? altOf(slug) : altOf(slug), status: type === "pool" ? "pool" : "used",
      source: {
        origSvg: r.svg,
        matchedPng: type === "pool" ? null : `${r.best.sub}/${r.best.png}`,
        matchDist: type === "pool" ? null : r.best.dist,
      },
    });
    moves.push({ from: path.join(VIS, r.svg), to: path.join(VIS, rel) });
  }

  // Kollisions-Check der Zielnamen
  const seen = new Set();
  for (const m of manifest) { if (seen.has(m.file)) throw new Error("Namenskollision: " + m.file); seen.add(m.file); }

  // Verzeichnisse anlegen + verschieben
  for (const d of Object.values(typeToDir)) await fs.mkdir(path.join(VIS, d), { recursive: true });
  for (const mv of moves) await fs.rename(mv.from, mv.to);

  manifest.sort((a, b) => a.file.localeCompare(b.file));
  await fs.writeFile(path.join(VIS, "manifest.json"), JSON.stringify(manifest, null, 2));

  const byType = {};
  manifest.forEach((m) => (byType[m.type] = (byType[m.type] || 0) + 1));
  console.log("Manifest:", manifest.length, "Einträge |", JSON.stringify(byType));
  console.log("Pool (neu/ungenutzt):", manifest.filter((m) => m.type === "pool").map((m) => m.slug).join(", "));
}
main().catch((e) => { console.error(e); process.exit(1); });
