#!/usr/bin/env node
/**
 * build-visuals.mjs — Erzeugt aus den SVG-Mastern (assets/visuals/, laut manifest.json)
 * pro Visual 6 Raster-Derivate nach assets/visuals-build/<type>/<slug>/:
 *   <slug>-1920.png / -728.png     (transparent)
 *   <slug>-1920.webp / -728.webp   (transparent, Q80)
 *   <slug>-1920-white.jpg          (weißer Hintergrund)
 *   <slug>-1920-page.jpg           (Seiten-Hintergrund #faf9f6)
 *
 * Idempotent: überspringt Derivate, die neuer als ihre Quell-SVG sind (--force erzwingt).
 * Wiederverwendbar: neue SVG in den passenden Unterordner legen, manifest ergänzen
 * (oder organize-visuals erneut laufen lassen), dann `node scripts/build-visuals.mjs`.
 */
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = "/Users/bsw/Projekte/finanzleser";
const VIS = path.join(ROOT, "assets/visuals");
const OUT = path.join(ROOT, "assets/visuals-build");
const PAGE_BG = "#faf9f6";
const WIDTHS = [1920, 728];
const WEBP_Q = 80;
const JPEG_Q = 82;
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 6;

async function fresh(outFile, srcMtime) {
  try { const st = await fs.stat(outFile); return st.mtimeMs >= srcMtime; } catch { return false; }
}

async function buildOne(entry, stats) {
  const src = path.join(VIS, entry.file);
  const srcStat = await fs.stat(src);
  const dir = path.dirname(entry.file); // titelbilder | categories | general | _unassigned
  const slug = entry.slug;
  const outDir = path.join(OUT, dir, slug);
  await fs.mkdir(outDir, { recursive: true });

  const targets = [
    ...WIDTHS.flatMap((w) => [
      { name: `${slug}-${w}.png`, w, fmt: "png" },
      { name: `${slug}-${w}.webp`, w, fmt: "webp" },
    ]),
    { name: `${slug}-1920-white.jpg`, w: 1920, fmt: "jpg", bg: "#ffffff" },
    { name: `${slug}-1920-page.jpg`, w: 1920, fmt: "jpg", bg: PAGE_BG },
  ];

  // Alles frisch? dann skip (spart Arbeit bei Re-Runs).
  if (!FORCE && (await Promise.all(targets.map((t) => fresh(path.join(outDir, t.name), srcStat.mtimeMs)))).every(Boolean)) {
    stats.skipped++; return;
  }

  // SVG EINMAL hochauflösend rastern (Dichte so, dass native Breite ≥ 1920) → Master-Buffer.
  const meta = await sharp(src).metadata();
  const baseW = meta.width || 1000;
  const density = Math.max(96, Math.min(2400, Math.ceil((96 * 1920) / baseW)));
  const masterBuf = await sharp(src, { density }).png().toBuffer();

  for (const t of targets) {
    const out = path.join(outDir, t.name);
    let pipe = sharp(masterBuf).resize({ width: t.w, withoutEnlargement: false });
    if (t.fmt === "png") pipe = pipe.png({ compressionLevel: 9 });
    else if (t.fmt === "webp") pipe = pipe.webp({ quality: WEBP_Q, effort: 4 });
    else pipe = pipe.flatten({ background: t.bg }).jpeg({ quality: JPEG_Q, mozjpeg: true });
    await pipe.toFile(out);
  }
  stats.built++;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(VIS, "manifest.json"), "utf8"));
  await fs.mkdir(OUT, { recursive: true });
  const stats = { built: 0, skipped: 0 };
  console.log(`Baue Derivate für ${manifest.length} Visuals (${FORCE ? "force" : "idempotent"}) …`);

  let i = 0;
  async function worker() {
    while (i < manifest.length) {
      const e = manifest[i++];
      try { await buildOne(e, stats); }
      catch (err) { console.warn("  FEHLER", e.file, err.message); }
      if ((stats.built + stats.skipped) % 25 === 0) process.stdout.write(`  ${stats.built + stats.skipped}/${manifest.length}\r`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nFertig: gebaut=${stats.built}, übersprungen=${stats.skipped}, Ausgabe → ${path.relative(ROOT, OUT)}/`);
}
main().catch((e) => { console.error(e); process.exit(1); });
