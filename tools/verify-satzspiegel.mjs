#!/usr/bin/env node
// Stellt Vorlage und Produkt nebeneinander und misst denselben Satzspiegel in beiden.
//
//   node tools/verify-satzspiegel.mjs [--seite <pfad>]
//
// Voraussetzung: der Dev-Server läuft auf :3000 und die Vorlage auf :8099
// (.claude/launch.json, Eintrag „vorlage").
//
// Gemessen wird, was die Vorlage in Zeile 274–277 festlegt und was ihre Umbrüche in
// Zeile 1519/1530/1996/2015 daraus machen: Außenabstand, Spalten, Gasse, Spaltenbreiten,
// Klebeverhalten der Randspalten. Dazu die Schaltzustände (welche Spalte ist sichtbar,
// erscheint die Schubladenleiste, liegt das Fortschritts-Gleis 30 px links der Mitte)
// und ein Blick auf waagerechten Überlauf.
//
// Der Satzspiegel des Produkts trägt seinen Außenabstand selbst, die Vorlage legt ihn auf
// ein <main> darum. Deshalb unterscheidet sich `max-width` um zweimal den Außenabstand —
// die Spaltenbreiten sind der Beweis, dass beide gleich breit satzen.
//
// 🚨 Nur ein Lauf zur Zeit: jeder Seitenaufruf am Dev-Server fragt WordPress ab.

import { chromium } from "playwright";

const arg = (n, v) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : v; };
const SEITE = arg("--seite", "/finanzen/energiekosten/strompreise");
const VORLAGE = "http://localhost:8099/Finanzleser%20Faden%20A%20v2%20-%20Zeitung.dc.html";
const PRODUKT = "http://localhost:3000" + SEITE;
const BREITEN = [375, 900, 1024, 1200, 1300, 1440, 1680];

const inVorlage = () => {
  const m = document.querySelector("main"); if (!m) return null;
  const g = m.firstElementChild, cs = getComputedStyle(g);
  const [l, mi, r] = [...g.children];
  const sicht = (el) => el && getComputedStyle(el).display !== "none";
  return {
    padTop: getComputedStyle(m).paddingTop, padSeite: getComputedStyle(m).paddingLeft,
    gap: cs.columnGap, spalten: [l, mi, r].map((c) => (sicht(c) ? Math.round(c.getBoundingClientRect().width) : 0)),
    kleben: getComputedStyle(l).position + " " + getComputedStyle(l).top,
    links: sicht(l), rechts: sicht(r),
  };
};
const inProdukt = () => {
  const q = (x) => document.querySelector(".faden-shell " + x);
  const g = q(".faden"); if (!g) return null;
  const cs = getComputedStyle(g);
  const l = q(".rand--links"), mi = q("#mitte"), r = q(".rand--rechts");
  const sicht = (el) => el && getComputedStyle(el).display !== "none";
  const f = q(".fortschritt"), gl = f && f.querySelector(".fortschritt__gleis");
  return {
    padTop: cs.paddingTop, padSeite: cs.paddingLeft,
    gap: cs.columnGap, spalten: [l, mi, r].map((c) => (sicht(c) ? Math.round(c.getBoundingClientRect().width) : 0)),
    kleben: getComputedStyle(l).position + " " + getComputedStyle(l).top,
    links: sicht(l), rechts: sicht(r),
    leiste: sicht(q(".mobil-leiste")),
    gleis: gl && sicht(f) ? Math.round(mi.getBoundingClientRect().left - gl.getBoundingClientRect().left) : null,
    ueberlauf: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  };
};

const browser = await chromium.launch();
const seite = await browser.newPage();
const mess = async (url, fn, warten) => {
  const raus = {};
  for (const b of BREITEN) {
    await seite.setViewportSize({ width: b, height: 900 });
    await seite.goto(url, { waitUntil: "networkidle", timeout: 120000 });
    await seite.waitForTimeout(warten);
    raus[b] = await seite.evaluate(fn);
  }
  return raus;
};
const v = await mess(VORLAGE, inVorlage, 2500);
const p = await mess(PRODUKT, inProdukt, 1500);
await browser.close();

let abweichungen = 0, hinweise = [];
console.log("Breite  Feld         Vorlage                    Produkt");
for (const b of BREITEN) {
  const a = v[b], c = p[b];
  if (!a || !c) { console.log(`${b}px  — nicht messbar`); abweichungen++; continue; }
  const zeilen = [
    ["Abstand oben", a.padTop, c.padTop],
    ["Abstand Seite", a.padSeite, c.padSeite],
    ["Gasse", a.gap, c.gap],
    ["Spalten", a.spalten.join(" / "), c.spalten.join(" / ")],
    ["Kleben links", a.kleben, c.kleben],
  ];
  const schlecht = zeilen.filter(([, x, y]) => x !== y);
  abweichungen += schlecht.length;
  console.log(`\n── ${b} px ${schlecht.length ? "✗" : "✓"}`);
  for (const [name, x, y] of zeilen)
    console.log(`   ${x === y ? " " : "✗"} ${name.padEnd(13)} ${String(x).padEnd(26)} ${y}`);
  if (c.gleis !== null && c.gleis !== 30) { hinweise.push(`${b}px: Gleis liegt ${c.gleis}px links der Mitte statt 30`); }
  if (c.links && c.leiste) hinweise.push(`${b}px: Randspalte UND Schubladenleiste gleichzeitig sichtbar`);
  if (c.ueberlauf) hinweise.push(`${b}px: waagerechter Überlauf ${c.ueberlauf}px`);
}
if (hinweise.length) { console.log("\nHinweise:"); for (const h of hinweise) console.log("   • " + h); }
console.log(`\n${abweichungen ? "✗ " + abweichungen + " Abweichung(en)" : "✓ Satzspiegel deckt sich mit der Vorlage"}`);
process.exit(abweichungen ? 1 : 0);
