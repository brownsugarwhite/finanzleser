#!/usr/bin/env node
/**
 * Token-Wache: Was steht in den Stylesheets des Fadens noch als nackte Zahl?
 *
 * 🚨 Die Quelle sind DIE STYLESHEETS SELBST. Keine gepflegte Liste, kein zweiter Satz
 * Beispiele. Wer eine Farbe, einen Schriftgrad, einen Abstand, eine Linie, einen Radius
 * oder einen Schatten direkt in eine Regel schreibt, taucht hier auf.
 *
 * Dieselbe Parserlogik wie lib/faden/inventur.ts (die den Schaukasten speist) — nur
 * umfassender: mehr Dateien, mehr Kategorien, und mit Sollstand.
 *
 *   node tools/token-wache.mjs              Bericht auf der Kommandozeile
 *   node tools/token-wache.mjs --json       Zählstand als JSON (für den Sollstand)
 *   node tools/token-wache.mjs --pruefen    Vergleich gegen tools/token-wache.json;
 *                                           Rückgabewert 1, sobald eine Kategorie wächst
 *   node tools/token-wache.mjs --zeige farben   eine Kategorie mit allen Fundstellen
 *
 * Der Sollstand wird NUR nach einer Verbesserung neu geschrieben:
 *   node tools/token-wache.mjs --json > tools/token-wache.json
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(WURZEL, "app");

/** Die Stylesheets des Fadens und des Kursblatts. app/components.css bleibt außen vor —
 *  das ist die Alt-Seite und steht nicht im Umbau. */
export const DATEIEN = [
  "faden.css", "faden-landing.css", "faden-hover.css", "kassensturz.css",
  "finanzwort.css", "spiele.css", "schlange.css", "leo-fragt.css",
  "statistik-formen.css", "kursblatt.css", "vergleich.css", "rechner.css",
  "gamification.css",
];

/** Selektoren, die den Tokenkopf tragen: dort DÜRFEN nackte Werte stehen, dafür sind sie da. */
const TOKENKOPF = /^(:root|\.faden-shell|\.kb)$/;

function regeln() {
  const aus = [];
  for (const datei of DATEIEN) {
    const pfad = join(APP, datei);
    if (!existsSync(pfad)) continue;
    // Kommentare raus, sonst zählt Prosa als Wert.
    const rein = readFileSync(pfad, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(rein))) {
      const sel = m[1].trim().replace(/\s+/g, " ");
      if (sel.startsWith("@") || !sel) continue;
      // Zeilennummer aus der Position im bereinigten Text schätzen reicht nicht — wir
      // zählen im Original. Dafür merken wir uns den Selektor, das genügt zum Finden.
      aus.push({ sel, block: m[2], datei, kopf: TOKENKOPF.test(sel) });
    }
  }
  return aus;
}

const ALLE = regeln();

function sammeln(treffer, { mitKopf = false } = {}) {
  const map = new Map();
  for (const r of ALLE) {
    if (r.kopf && !mitKopf) continue;
    for (const w of treffer(r)) {
      if (!map.has(w)) map.set(w, []);
      map.get(w).push(`${r.datei} · ${r.sel}`);
    }
  }
  return [...map.entries()]
    .map(([wert, stellen]) => ({ wert, n: stellen.length, stellen }))
    .sort((a, b) => b.n - a.n || a.wert.localeCompare(b.wert));
}

const werte = (block, prop) =>
  [...block.matchAll(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "g"))].map((m) => m[1].trim());

/* ── Kategorien ──────────────────────────────────────────────────────────────────── */

/** Farbliterale außerhalb des Tokenkopfs. */
export const farben = () => sammeln(({ block }) =>
  [...block.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g)]
    .map((m) => m[0].toLowerCase().replace(/\s+/g, ""))
    .filter((w) => w !== "rgba(0,0,0,0)" && w !== "transparent"));

/** Schriftgrade — aus `font-size` UND aus dem `font:`-Kurzschreiben.
 *  `var(--schrift-*)` ist eine Rolle, `var(--grad-*)` eine Sprosse der Leiter — beides
 *  ist ein Token und zählt nicht als Fund. */
export const schriftgrade = () => sammeln(({ block }) => {
  const aus = [];
  for (const w of werte(block, "font")) {
    if (/var\(--(schrift|grad)/.test(w)) continue;
    const c = w.match(/clamp\((?:[^()]|\([^()]*\))*\)/);
    if (c) { if (/var\(--grad/.test(c[0])) continue; aus.push(c[0].replace(/\s+/g, "")); continue; }
    const g = w.match(/\d+(?:\.\d+)?(?:px|rem|em)/);
    if (g) aus.push(g[0]);
  }
  for (const w of werte(block, "font-size")) {
    if (w === "inherit" || w === "unset" || /var\(--(schrift|grad)/.test(w)) continue;
    aus.push(w.replace(/\s+/g, "").replace(/!important$/, ""));
  }
  return aus;
});

/** Schriftfamilien, die an den Tokens vorbeigehen. */
export const schriftfamilien = () => sammeln(({ block }) => {
  const aus = [];
  for (const w of [...werte(block, "font-family"), ...werte(block, "font")]) {
    if (/merriweather|open sans|georgia|monospace|serif|sans-serif/i.test(w) &&
        !/^var\(--(serif|sans|font-heading|font-body|schrift)/.test(w.trim())) {
      const f = w.match(/(?:'|")?(Merriweather|Open Sans)(?:'|")?[^;]*/i);
      if (f) aus.push(f[0].trim().replace(/\s+/g, " "));
    }
  }
  return aus;
});

/** Abstände: jeder einzelne px-Wert aus padding/margin/gap. */
export const abstaende = () => sammeln(({ block }) => {
  const aus = [];
  for (const p of ["padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
                   "padding-block", "padding-inline", "margin", "margin-top", "margin-right",
                   "margin-bottom", "margin-left", "margin-block", "margin-inline",
                   "gap", "row-gap", "column-gap"]) {
    for (const w of werte(block, p)) {
      if (/var\(--luft|auto|inherit|unset/.test(w)) continue;
      for (const m of w.matchAll(/-?\d+(?:\.\d+)?px/g)) aus.push(m[0]);
    }
  }
  return aus;
});

/** Linien: Breite + Farbe, wie sie dasteht. */
export const linien = () => sammeln(({ block }) => {
  const aus = [];
  for (const p of ["border", "border-top", "border-right", "border-bottom", "border-left",
                   "border-color", "border-width", "outline"]) {
    for (const w of werte(block, p)) {
      const roh = w.replace(/\s+/g, " ").replace(/\s*!important$/, "");
      if (roh === "0" || roh === "none" || roh === "0px") continue;
      if (/#[0-9a-fA-F]{3,8}|rgba?\(/.test(roh)) aus.push(roh.toLowerCase());
    }
  }
  return aus;
});

export const radien = () => sammeln(({ block }) =>
  werte(block, "border-radius")
    .map((w) => w.replace(/\s+/g, " ").replace(/\s*!important$/, ""))
    .filter((w) => !/var\(--radius/.test(w) && w !== "0"));

export const schatten = () => sammeln(({ block }) =>
  werte(block, "box-shadow")
    .map((w) => w.replace(/\s+/g, " ").toLowerCase())
    // Ein Wert, der NUR aus einem Token besteht, ist genau richtig — egal wie es heißt
    // (--schatten-*, --doppellinie-*). Gezählt wird, was daneben noch hart dasteht.
    .filter((w) => w !== "none" && !/^var\(--[a-z0-9-]+\)$/.test(w)));

/**
 * 🚨 Selbstbezug: `--x: var(--x)`. Die Eigenschaft ist damit *garantiert ungültig* und
 * liefert LEER — sie fällt NICHT auf einen Ersatzwert zurück. Nichts bricht, nichts
 * meldet sich, die Farbe ist einfach weg.
 * Am 16.09.2026 passiert: der Farbdurchgang machte aus `--tuerkis: #0B7F66` ein
 * `--tuerkis: var(--tuerkis)`, und jede türkise Pille im Faden war danach unsichtbar.
 * Ausgenommen ist `@theme inline` in globals.css — Tailwind v4 löst das zur Bauzeit auf.
 */
export const selbstbezug = () => sammeln(({ block }) =>
  [...block.matchAll(/(--[a-z0-9-]+)\s*:\s*var\(\s*\1\s*[,)]/g)].map((m) => `${m[1]}: var(${m[1]})`),
  { mitKopf: true });

const KATEGORIEN = {
  selbstbezug: ["🚨 Selbstbezüge (--x: var(--x)) — liefern LEER", selbstbezug],
  farben: ["Farbliterale außerhalb des Tokenkopfs", farben],
  schriftgrade: ["Schriftgrade ohne --schrift-Token", schriftgrade],
  schriftfamilien: ["Schriftfamilien an den Tokens vorbei", schriftfamilien],
  abstaende: ["Abstände ohne --luft-Token", abstaende],
  linien: ["Linien mit Farbliteral", linien],
  radien: ["Radien ohne --radius-Token", radien],
  schatten: ["Schatten ohne --schatten-Token", schatten],
};

/* ── Ausgabe ─────────────────────────────────────────────────────────────────────── */

function zaehlstand() {
  const aus = {};
  for (const [name, [, fn]] of Object.entries(KATEGORIEN)) {
    const f = fn();
    aus[name] = { verschieden: f.length, vorkommen: f.reduce((s, x) => s + x.n, 0) };
  }
  return aus;
}

const arg = process.argv.slice(2);
const SOLL = join(WURZEL, "tools", "token-wache.json");

if (arg[0] === "--json") {
  console.log(JSON.stringify(zaehlstand(), null, 2));
} else if (arg[0] === "--zeige") {
  const k = KATEGORIEN[arg[1]];
  if (!k) { console.error(`Unbekannt: ${arg[1]}. Bekannt: ${Object.keys(KATEGORIEN).join(", ")}`); process.exit(2); }
  for (const f of k[1]()) {
    console.log(`\n${String(f.n).padStart(4)} × ${f.wert}`);
    for (const s of [...new Set(f.stellen)].slice(0, 12)) console.log(`       ${s}`);
    if (new Set(f.stellen).size > 12) console.log(`       … und ${new Set(f.stellen).size - 12} weitere`);
  }
} else if (arg[0] === "--pruefen") {
  if (!existsSync(SOLL)) { console.error("Kein Sollstand. Erst: node tools/token-wache.mjs --json > tools/token-wache.json"); process.exit(2); }
  const soll = JSON.parse(readFileSync(SOLL, "utf8"));
  const ist = zaehlstand();
  let schlecht = false;
  console.log("Kategorie             verschieden (soll)      Vorkommen (soll)");
  for (const name of Object.keys(KATEGORIEN)) {
    const s = soll[name] ?? { verschieden: 0, vorkommen: 0 };
    const i = ist[name];
    const wuchs = i.verschieden > s.verschieden || i.vorkommen > s.vorkommen;
    if (wuchs) schlecht = true;
    console.log(
      `${wuchs ? "✗" : "✓"} ${name.padEnd(20)} ${String(i.verschieden).padStart(4)} (${s.verschieden})`.padEnd(46) +
      `${String(i.vorkommen).padStart(5)} (${s.vorkommen})`
    );
  }
  if (schlecht) { console.error("\n🚨 Es sind harte Werte dazugekommen. Entweder ins Tokenverzeichnis, oder den Sollstand mit Begründung anheben."); process.exit(1); }
  console.log("\nKein Rückfall.");
} else {
  let gesamtV = 0, gesamtN = 0;
  for (const [name, [titel, fn]] of Object.entries(KATEGORIEN)) {
    const f = fn();
    const n = f.reduce((s, x) => s + x.n, 0);
    gesamtV += f.length; gesamtN += n;
    console.log(`\n── ${titel} ──`);
    console.log(`   ${f.length} verschiedene Werte, ${n} Vorkommen`);
    for (const x of f.slice(0, 14)) console.log(`   ${String(x.n).padStart(4)} × ${x.wert}`);
    if (f.length > 14) console.log(`        … und ${f.length - 14} weitere (node tools/token-wache.mjs --zeige ${name})`);
  }
  console.log(`\n══ Summe: ${gesamtV} verschiedene Werte, ${gesamtN} Vorkommen ══`);
}
