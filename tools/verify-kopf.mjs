#!/usr/bin/env node
// Wächter für die eingefrorenen Teile: TopNav mit Hover-Pille und Lesezeichen rechts oben.
//
// Sie sollen den Zeitungs-Neuaufbau unverändert überstehen (Wunsch 09.09.2026). Ihre
// Regeln stehen in app/faden/kopf.css — aber sie hängen an Dingen, die sich sehr wohl
// ändern: den Variablen aus basis.css, dem Keyframe fl-atmen aus bewegung.css, .kicker und
// .spark aus vokabular.css. Ein Blick auf den Diff sieht das nicht. Dieser Wächter misst.
//
//   node tools/verify-kopf.mjs --aufnehmen     einmalig: Grundlinie schreiben
//   node tools/verify-kopf.mjs                 danach: gegen die Grundlinie prüfen
//   node tools/verify-kopf.mjs --url <adresse> andere Seite (Vorgabe: Startseite)
//
// 🚨 Nur EIN Lauf zur Zeit. Jeder Seitenaufruf am Dev-Server erzeugt WordPress-Abfragen
// auf dem IONOS-Webspace; vier gleichzeitige Läufe haben am 08.09.2026 cms-dev und cms
// lahmgelegt.

import fs from "node:fs";
import { chromium } from "playwright";

const GRUNDLINIE = "tools/kopf-grundlinie.json";
const arg = (n, v) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : v; };
const aufnehmen = process.argv.includes("--aufnehmen");
const URL = arg("--url", "http://localhost:3000/");

// Je Element die Eigenschaften, die seine Gestalt ausmachen. Mehr wäre nicht strenger,
// nur lauter: Farben, die aus Variablen kommen, ändern sich absichtlich mit den Tokens.
const MESSPUNKTE = [
  [".kopf",             ["height", "position", "zIndex"]],
  [".kopf__zeile",      ["minHeight", "gap", "alignItems"]],
  [".logo img",         ["height", "width"]],
  [".register",         ["display", "gap"]],
  [".register__reihe button", ["fontFamily", "fontSize", "fontWeight", "paddingTop", "paddingLeft", "color"]],
  [".reg-spark",        ["width", "height", "animationName", "animationDuration"]],
  [".nav-pille",        ["height", "position", "borderRadius", "backgroundColor"]],
  [".nav-linie--1",     ["height", "top", "backgroundColor"]],
  [".nav-linie--3",     ["height", "top", "backgroundColor"]],
  [".nav-lupe",         ["transform", "overflow"]],
  [".kopf__marke",      ["height", "alignSelf", "display"]],
  [".sie-lesen",        ["display", "fontSize", "maxWidth", "color"]],
  [".lz-zacken",        ["width", "height", "marginRight"]],
  [".lesezeichen",      ["height", "backgroundImage", "color", "paddingRight"]],
  [".lz-wort",          ["display", "fontSize", "fontWeight", "height"]],
  [".lz-icon",          ["width", "height", "position"]],
  [".lesefortschritt",  ["height", "top", "backgroundColor", "transformOrigin"]],
];

// Bei diesen Breiten: die Umbrüche der Vorlage für Nav (1120), „Sie lesen" (1440),
// Randspalten (1060/1280) und das schmale Fenster.
const BREITEN = [375, 900, 1024, 1200, 1300, 1680];

const messen = async (seite) =>
  seite.evaluate((punkte) => {
    const raus = {};
    for (const [sel, eigenschaften] of punkte) {
      const el = document.querySelector(".faden-shell " + sel) || document.querySelector(sel);
      if (!el) { raus[sel] = "fehlt"; continue; }
      const cs = getComputedStyle(el);
      raus[sel] = Object.fromEntries(eigenschaften.map((e) => [e, cs[e]]));
    }
    return raus;
  }, MESSPUNKTE);

const browser = await chromium.launch();
const seite = await browser.newPage();
const ist = {};
for (const breite of BREITEN) {
  await seite.setViewportSize({ width: breite, height: 900 });
  await seite.goto(URL, { waitUntil: "networkidle", timeout: 120000 });
  await seite.waitForTimeout(1200);              // Auftritte und Hydrierung abwarten
  ist[breite] = await messen(seite);
}
await browser.close();

if (aufnehmen) {
  fs.writeFileSync(GRUNDLINIE, JSON.stringify({ url: URL, aufgenommen: new Date().toISOString().slice(0, 10), werte: ist }, null, 2) + "\n");
  const fehlend = [];
  for (const [b, m] of Object.entries(ist)) for (const [sel, v] of Object.entries(m)) if (v === "fehlt") fehlend.push(`${b}px ${sel}`);
  console.log(`Grundlinie geschrieben: ${GRUNDLINIE} (${BREITEN.length} Breiten × ${MESSPUNKTE.length} Messpunkte)`);
  if (fehlend.length) console.log(`Hinweis — nicht im DOM: ${fehlend.join(", ")}`);
  process.exit(0);
}

if (!fs.existsSync(GRUNDLINIE)) {
  console.error(`Keine Grundlinie. Einmalig: node tools/verify-kopf.mjs --aufnehmen`);
  process.exit(2);
}
const soll = JSON.parse(fs.readFileSync(GRUNDLINIE, "utf8")).werte;

const abweichungen = [];
for (const breite of BREITEN) {
  for (const [sel] of MESSPUNKTE) {
    const s = soll[breite]?.[sel], i = ist[breite]?.[sel];
    if (s === undefined) continue;
    if (typeof s === "string" || typeof i === "string") {
      if (s !== i) abweichungen.push(`${breite}px  ${sel}  ${s} → ${i}`);
      continue;
    }
    for (const k of Object.keys(s)) if (s[k] !== i[k]) abweichungen.push(`${breite}px  ${sel}  ${k}: ${s[k]} → ${i[k]}`);
  }
}

if (abweichungen.length) {
  console.error(`✗ Der eingefrorene Kopf hat sich bewegt — ${abweichungen.length} Abweichung(en):`);
  for (const a of abweichungen) console.error("   " + a);
  console.error("\nEntweder war es Absicht (dann Grundlinie neu aufnehmen und im Commit begründen)\noder eine Nebenwirkung (dann ist der Kopf zu reparieren, nicht die Grundlinie).");
  process.exit(1);
}
console.log(`✓ Kopf, Nav-Pille und Lesezeichen unverändert (${BREITEN.length} Breiten × ${MESSPUNKTE.length} Messpunkte)`);
