#!/usr/bin/env node
/**
 * Vorlage und Seite NEBENEINANDER rendern und messen.
 *
 * 🚨 Die Design-Übergabe ist Quellcode und läuft. Wer aus Screenshots baut, rät — das hat
 * am 16.09.2026 mehrere Runden gekostet. Dieses Werkzeug nimmt beide Seiten auf und legt
 * die gemessenen Werte nebeneinander, damit Abweichungen Zahlen sind und keine Eindrücke.
 *
 * Voraussetzungen:
 *   1. Der Handoff-Server läuft:
 *        cd "design_handoff_finanzleser_kursblatt 3" && python3 -m http.server 8901
 *   2. Der Dev-Server läuft auf 3000.
 *
 * Aufruf:  node tools/vorlage-vergleich.mjs [name ...]
 *          ohne Namen: alle Paare
 *
 * 🚨 EIN Playwright-Prozess zur Zeit (Memory feedback_parallele_agenten_dev_server):
 *    parallele Läufe gegen den Dev-Server ziehen das CMS mit herunter.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const VORLAGE = "http://127.0.0.1:8901";
const UNSER = process.env.BASIS || "http://localhost:3000";
const AUS = process.env.AUS || "/tmp/vorlage-vergleich";

/** Wo dieselbe Sache in beiden Welten steht. */
const PAARE = {
  lineal:    { v: { datei: "FL Lineal.dc.html", wahl: "body > *" },
               u: { pfad: "/entwurf/kursblatt", wahl: ".kb-lineal" } },
  setzzeile: { v: { datei: "FL Setzzeile.dc.html", wahl: "body > *" },
               u: { pfad: "/entwurf/kursblatt", wahl: ".kb-setzzeile" } },
  register:  { v: { datei: "FL Register.dc.html", wahl: "body > *" },
               u: { pfad: "/entwurf/kursblatt", wahl: ".kb-register" } },
  siegel:    { v: { datei: "FL Siegel.dc.html", wahl: "body > *" },
               u: { pfad: "/finanztools/vergleiche/tagesgeldvergleich", wahl: ".kb-siegel" } },
};

/** Die Maße, auf die es ankommt — Schrift, Farbe, Kasten. */
const MASS = `(() => {
  const nimm = (e) => {
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    return {
      txt: (e.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 26),
      font: c.fontWeight + " " + c.fontSize + (c.fontStyle === "italic" ? " kursiv" : "") + " " + c.fontFamily.split(",")[0].replace(/['"]/g, ""),
      farbe: c.color, ls: c.letterSpacing,
      b: Math.round(r.width), h: Math.round(r.height),
    };
  };
  const wurzel = document.querySelector(WAHL);
  if (!wurzel) return null;
  const wr = wurzel.getBoundingClientRect();
  const kinder = [...wurzel.querySelectorAll("*")]
    .filter((e) => (e.textContent || "").trim() && e.children.length === 0)
    .map((e) => { const m = nimm(e); const r = e.getBoundingClientRect(); return { ...m, x: Math.round(r.left - wr.left), y: Math.round(r.top - wr.top) }; });
  return { kasten: { b: Math.round(wr.width), h: Math.round(wr.height) }, kinder };
})()`;

async function messen(seite, wahl) {
  return seite.evaluate(`const WAHL = ${JSON.stringify(wahl)}; ${MASS}`);
}

const nur = process.argv.slice(2);
const namen = nur.length ? nur : Object.keys(PAARE);
mkdirSync(AUS, { recursive: true });

const browser = await chromium.launch();
for (const name of namen) {
  const paar = PAARE[name];
  if (!paar) { console.log(`· ${name}: kein Paar hinterlegt`); continue; }

  const seite = await browser.newPage({ viewport: { width: 560, height: 400 }, deviceScaleFactor: 2 });
  await seite.goto(`${VORLAGE}/${encodeURIComponent(paar.v.datei)}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await seite.waitForTimeout(3000);
  const v = await messen(seite, paar.v.wahl);
  await seite.screenshot({ path: join(AUS, `${name}-vorlage.png`) });
  await seite.close();

  const s2 = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  // Consent vorweg setzen — sonst liegt das Banner über dem Bauteil.
  await s2.addInitScript(() => {
    try {
      localStorage.setItem("fl_consent_v1", JSON.stringify({
        version: 1, timestamp: new Date().toISOString(),
        categories: { necessary: true, functional: false, analytics: false, marketing: false },
      }));
    } catch { /* privater Modus */ }
  });
  await s2.goto(UNSER + paar.u.pfad, { waitUntil: "domcontentloaded", timeout: 240000 });
  await s2.waitForSelector(paar.u.wahl, { timeout: 90000 }).catch(() => {});
  await s2.waitForTimeout(2500);
  const u = await messen(s2, paar.u.wahl);
  const el = s2.locator(paar.u.wahl).first();
  if (await el.count()) { await el.scrollIntoViewIfNeeded(); await s2.waitForTimeout(400); await el.screenshot({ path: join(AUS, `${name}-unser.png`) }); }
  await s2.close();

  console.log(`\n══ ${name} ${"═".repeat(Math.max(0, 60 - name.length))}`);
  console.log(`   Kasten   Vorlage ${v?.kasten.b}×${v?.kasten.h}   unser ${u?.kasten.b}×${u?.kasten.h}`);
  const zeile = (t) => `${String(t.txt).padEnd(26)} ${String(t.font).padEnd(30)} ${String(t.farbe).padEnd(22)} y${String(t.y).padStart(4)}`;
  console.log("   ── Vorlage");
  for (const t of (v?.kinder || []).filter((t) => t.h > 0)) console.log("   " + zeile(t));
  console.log("   ── unser");
  for (const t of (u?.kinder || []).filter((t) => t.h > 0)) console.log("   " + zeile(t));
}
await browser.close();
console.log(`\nBilder: ${AUS}`);
