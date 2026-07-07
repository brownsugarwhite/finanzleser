#!/usr/bin/env node
/**
 * match-visuals.mjs — Gleicht die generisch benannten SVGs in assets/visuals/ per
 * BILDINHALT gegen die (slug-benannten) genutzten PNGs in assets/png_1920/ ab.
 *
 * Methode: jedes Bild (SVG-Render + PNG) auf normalisierte Thumbnails bringen und
 * dHash + aHash (je 64 Bit) + 16x16-Graustufen-MSE berechnen. Bester PNG-Treffer je
 * SVG = minimale (dHashHamming + aHashHamming), MSE als Feinabgleich.
 *
 * Ausgabe:
 *  - <OUT>/match-results.json  (je SVG: bester + zweitbester Treffer, Distanzen, Konfidenz)
 *  - <OUT>/montage-NN.png      (Kontaktbögen: SVG-Thumb | Treffer-PNG-Thumb + Index, zum Sichten)
 *
 * Rein lesend gegenüber dem Repo — schreibt nur nach <OUT> (Scratchpad).
 */
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

const ROOT = "/Users/bsw/Projekte/finanzleser";
const SVG_DIR = path.join(ROOT, "assets/visuals");
const PNG_BASE = path.join(ROOT, "assets/png_1920");
const PNG_SUBDIRS = ["titelbilder", "general", "categories", "categories_alt", "finanztoolSlider"];
const OUT = process.env.OUT || "/private/tmp/claude-501/-Users-bsw-Projekte-finanzleser/ea8feb95-7197-4d32-9614-1c0c486f5b1d/scratchpad/match";

async function listImgs(dir, exts) {
  let e = [];
  try { e = await fs.readdir(dir); } catch { return []; }
  return e.filter((f) => exts.some((x) => f.toLowerCase().endsWith(x)) && !f.startsWith("."))
          .map((f) => path.join(dir, f));
}

// Normalisierte Signatur: auf Weiß flatten (SVG-Transparenz fair vergleichbar), grau.
async function signature(file) {
  const base = sharp(file, { density: 96 }).flatten({ background: "#ffffff" }).greyscale();
  const d = await base.clone().resize(9, 8, { fit: "fill" }).raw().toBuffer(); // dHash 9x8
  const a = await base.clone().resize(8, 8, { fit: "fill" }).raw().toBuffer(); // aHash 8x8
  const m = await base.clone().resize(16, 16, { fit: "fill" }).raw().toBuffer(); // MSE 16x16

  const dhash = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) dhash.push(d[y * 9 + x] > d[y * 9 + x + 1] ? 1 : 0);
  let avg = 0; for (let i = 0; i < 64; i++) avg += a[i]; avg /= 64;
  const ahash = Array.from(a.slice(0, 64), (v) => (v > avg ? 1 : 0));
  const mvec = Array.from(m, (v) => v / 255);
  return { dhash, ahash, mvec };
}

const ham = (p, q) => { let n = 0; for (let i = 0; i < p.length; i++) if (p[i] !== q[i]) n++; return n; };
const mse = (p, q) => { let s = 0; for (let i = 0; i < p.length; i++) { const dd = p[i] - q[i]; s += dd * dd; } return s / p.length; };

async function thumb(file, size = 150) {
  return sharp(file, { density: 96 }).flatten({ background: "#ffffff" })
    .resize(size, size, { fit: "contain", background: "#ffffff" }).png().toBuffer();
}
function label(txt, w = 304, h = 22) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#222"/><text x="6" y="16" font-family="monospace" font-size="14" fill="#fff">${txt.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text></svg>`;
  return Buffer.from(svg);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svgs = await listImgs(SVG_DIR, [".svg"]);
  let pngs = [];
  for (const sd of PNG_SUBDIRS) pngs.push(...(await listImgs(path.join(PNG_BASE, sd), [".png", ".jpg"])).map((f) => ({ f, sub: sd })));
  console.log(`SVGs: ${svgs.length} | Kandidat-PNGs: ${pngs.length}`);

  console.log("Signaturen PNGs …");
  for (const p of pngs) { try { p.sig = await signature(p.f); } catch (e) { console.warn("PNG-Fehler", p.f, e.message); } }
  const pngOk = pngs.filter((p) => p.sig);

  console.log("Signaturen SVGs + Matching …");
  const results = [];
  for (let i = 0; i < svgs.length; i++) {
    const s = svgs[i];
    let sig; try { sig = await signature(s); } catch (e) { console.warn("SVG-Fehler", s, e.message); continue; }
    const scored = pngOk.map((p) => ({ p, d: ham(sig.dhash, p.sig.dhash) + ham(sig.ahash, p.sig.ahash), m: mse(sig.mvec, p.sig.mvec) }))
      .sort((x, y) => x.d - y.d || x.m - y.m);
    const best = scored[0], second = scored[1];
    results.push({
      idx: i, svg: path.basename(s),
      best: { png: path.basename(best.p.f), sub: best.p.sub, dist: best.d, mse: +best.m.toFixed(4) },
      second: { png: path.basename(second.p.f), sub: second.p.sub, dist: second.d, mse: +second.m.toFixed(4) },
      confident: best.d <= 8 && best.m <= 0.02 && (second.d - best.d) >= 2,
    });
  }
  results.sort((a, b) => a.best.dist - b.best.dist);
  await fs.writeFile(path.join(OUT, "match-results.json"), JSON.stringify(results, null, 2));

  const conf = results.filter((r) => r.confident).length;
  console.log(`Ergebnisse: ${results.length} | sichere Treffer: ${conf} | unsicher: ${results.length - conf}`);

  // Montage-Kontaktbögen: Zellen [SVG | PNG] + Index/Distanz, zum Sichten.
  console.log("Montagen …");
  const T = 150, LBL = 22, CW = T * 2 + 6, CH = T + LBL, COLS = 4, ROWS = 6, PER = COLS * ROWS;
  const byIdx = [...results].sort((a, b) => a.idx - b.idx);
  const svgByName = Object.fromEntries(svgs.map((f) => [path.basename(f), f]));
  const pngByName = {}; for (const p of pngs) pngByName[p.sub + "/" + path.basename(p.f)] = p.f;
  for (let sheet = 0; sheet * PER < byIdx.length; sheet++) {
    const cells = byIdx.slice(sheet * PER, sheet * PER + PER);
    const W = COLS * (CW + 10) + 10, H = ROWS * (CH + 10) + 10;
    const comps = [];
    for (let c = 0; c < cells.length; c++) {
      const r = cells[c], col = c % COLS, row = (c / COLS) | 0;
      const x = 10 + col * (CW + 10), y = 10 + row * (CH + 10);
      const st = await thumb(svgByName[r.svg], T);
      const pt = await thumb(pngByName[r.best.sub + "/" + r.best.png], T);
      comps.push({ input: st, top: y + LBL, left: x });
      comps.push({ input: pt, top: y + LBL, left: x + T + 6 });
      comps.push({ input: label(`#${r.idx} d=${r.best.dist} ${r.confident ? "OK" : "?"} > ${r.best.png}`.slice(0, 40), CW), top: y, left: x });
    }
    const out = path.join(OUT, `montage-${String(sheet).padStart(2, "0")}.png`);
    await sharp({ create: { width: W, height: H, channels: 3, background: "#eeeeee" } }).composite(comps).png().toFile(out);
    console.log("  ", out);
  }
  console.log("Fertig.");
}
main().catch((e) => { console.error(e); process.exit(1); });
