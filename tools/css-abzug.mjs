#!/usr/bin/env node
// Abzug der CSS-Regeln in Auslieferungsreihenfolge — das Beweismittel für einen Umzug
// ohne Umbau (Schritt 0a/0b des Zeitungs-Neuaufbaus).
//
// Der Abzug folgt der @import-Kette ab app/globals.css rekursiv, sammelt jede Regel als
//     <At-Regel-Kontext> ‖ <Selektor> ‖ <Deklarationen>
// und sortiert am Ende. Weil die Faden-Stylesheets disjunkte Selektormengen haben
// (nachgemessen 09.09.2026), ist der sortierte Abzug vor und nach einem reinen
// Ausschneiden/Einfügen byteweise identisch. Ein Unterschied bedeutet: die Kaskade hat
// sich bewegt.
//
//   node tools/css-abzug.mjs > /tmp/vorher.txt     # vor dem Umzug
//   node tools/css-abzug.mjs > /tmp/nachher.txt    # danach
//   diff /tmp/vorher.txt /tmp/nachher.txt          # muss leer sein
//
// --nur-faden  lässt Dateien weg, die den Faden nicht betreffen (Vorgabe: alle).
// --je-datei   stellt jeder Zeile die Herkunftsdatei voran (für die Kollisionsprüfung).

import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const WURZEL = process.cwd();
const jeDatei = process.argv.includes("--je-datei");
const nurFaden = process.argv.includes("--nur-faden");

const IMPORT = /@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/g;

// Die @import-Kette in Auslieferungsreihenfolge auflösen. Nackte Paketnamen
// (tailwindcss) haben keine Datei im Projekt und fallen heraus.
function kette(datei, gesehen = new Set()) {
  const abs = path.resolve(datei);
  if (gesehen.has(abs) || !fs.existsSync(abs)) return [];
  gesehen.add(abs);
  const quelle = fs.readFileSync(abs, "utf8");
  const raus = [];
  for (const m of quelle.matchAll(IMPORT)) {
    const ziel = m[1];
    if (!ziel.startsWith(".") && !ziel.startsWith("/")) continue;
    raus.push(...kette(path.resolve(path.dirname(abs), ziel), gesehen));
  }
  raus.push(abs);
  return raus;
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

// Der Kontext einer Regel: alle umschließenden At-Regeln von außen nach innen.
function kontext(knoten) {
  const teile = [];
  for (let p = knoten.parent; p && p.type !== "root"; p = p.parent) {
    if (p.type === "atrule") teile.unshift(`@${p.name} ${norm(p.params)}`);
  }
  return teile.join(" » ") || "—";
}

const zeilen = [];
for (const datei of kette("app/globals.css")) {
  const rel = path.relative(WURZEL, datei);
  if (nurFaden && !/faden|zeitung|kiosk|snake|statistik|kassensturz|finanzwort|leo-fragt|kopf/.test(rel)) continue;
  let wurzel;
  try {
    wurzel = postcss.parse(fs.readFileSync(datei, "utf8"), { from: datei });
  } catch (e) {
    console.error(`✗ ${rel}: ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  wurzel.walkRules((regel) => {
    const decls = regel.nodes
      .filter((n) => n.type === "decl")
      .map((n) => `${n.prop}:${norm(n.value)}${n.important ? " !important" : ""}`)
      .join("; ");
    // Mehrfachselektoren einzeln führen: sonst verschiebt eine umsortierte Liste
    // den Abzug, ohne dass sich an der Wirkung etwas ändert.
    for (const sel of regel.selectors) {
      zeilen.push({ key: `${jeDatei ? rel + " ‖ " : ""}${kontext(regel)} ‖ ${norm(sel)}`, rumpf: decls });
    }
  });
  // At-Regeln ohne Rumpf (@charset, @layer …) mitnehmen, damit ihr Verschwinden auffällt.
  wurzel.walkAtRules((at) => {
    if (!at.nodes) zeilen.push({ key: `${jeDatei ? rel + " ‖ " : ""}— ‖ @${at.name} ${norm(at.params)}`, rumpf: "" });
  });
}

// 🚨 Sortieren allein wäre blind für Umsortierung: 77 Selektoren kommen im selben
// Kontext mehrfach vor, dort entscheidet die Reihenfolge, welche Deklaration gewinnt.
// Solche Mehrfachvorkommen bekommen deshalb ihre laufende Nummer in den Schlüssel —
// wandern sie gemeinsam, bleibt der Abzug gleich; überholen sie einander, fällt es auf.
const anzahl = new Map();
for (const { key } of zeilen) anzahl.set(key, (anzahl.get(key) || 0) + 1);
const lauf = new Map();
const fertig = zeilen.map(({ key, rumpf }) => {
  if ((anzahl.get(key) || 0) < 2) return `${key} ‖ ${rumpf}`;
  const n = (lauf.get(key) || 0) + 1;
  lauf.set(key, n);
  return `${key} #${n} ‖ ${rumpf}`;
});

fertig.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
process.stdout.write(fertig.join("\n") + "\n");
console.error(`${fertig.length} Regelzeilen, davon ${[...anzahl.values()].filter((n) => n > 1).length} mehrfach belegte Schlüssel`);

// Was dieser Abzug NICHT sieht: zwei verschiedene Selektoren gleicher Spezifität, die
// dasselbe Element treffen und die Plätze tauschen. Dagegen hilft nur die Prüfstrecke
// im Browser.
