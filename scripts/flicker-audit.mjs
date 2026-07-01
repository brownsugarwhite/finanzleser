// Flicker/FOUC/CLS-Audit: lädt Seiten und schießt Screenshots zu mehreren Zeitpunkten
// (früh vs. settled). Diffs zwischen den Frames zeigen, was verzögert einmorpht/springt/
// erscheint. Dev-only, kostet keine Netlify-Credits.
//
// Voraussetzung: Dev-Server läuft auf http://localhost:3000
// Nutzung:  node scripts/flicker-audit.mjs [chromium|webkit]
import { chromium, webkit } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "scripts/output/flicker";
const engineName = process.argv[2] === "webkit" ? "webkit" : "chromium";
const engine = engineName === "webkit" ? webkit : chromium;

const PAGES = [
  { name: "landing", path: "/" },
  { name: "hauptkat", path: "/versicherungen" },
  { name: "subkat", path: "/versicherungen/krankenversicherung" },
  { name: "artikel", path: "/versicherungen/krankenversicherung/zusatzbeitrag-krankenkasse" },
];
const VIEWPORTS = [
  { tag: "m", width: 390, height: 844 },   // Mobile (iPhone-ish)
  { tag: "d", width: 1280, height: 900 },  // Desktop
];
const SHOTS = [150, 500, 1200, 2800]; // ms nach domcontentloaded

mkdirSync(OUT, { recursive: true });

const browser = await engine.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    try {
      await page.goto(BASE + p.path, { waitUntil: "domcontentloaded", timeout: 30000 });
      const t0 = Date.now();
      for (const ms of SHOTS) {
        const wait = ms - (Date.now() - t0);
        if (wait > 0) await page.waitForTimeout(wait);
        const file = `${OUT}/${engineName}_${p.name}_${vp.tag}_${ms}.png`;
        await page.screenshot({ path: file });
      }
      console.log(`ok: ${engineName} ${p.name} ${vp.tag}`);
    } catch (e) {
      console.log(`FAIL: ${engineName} ${p.name} ${vp.tag} — ${e.message}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(`\n→ Screenshots in ${OUT}/`);
