#!/usr/bin/env node
// Hält den Schnitt von app/faden/ — nach jedem Schritt aufrufen:
//
//   node tools/verify-css-schnitt.mjs
//
// Drei Prüfungen:
//   1. Kein Selektor steht in zwei Dateien. Sonst entscheidet die @import-Reihenfolge
//      darüber, welcher Wert gewinnt — und man sucht ihn in der falschen Datei.
//   2. Jede Regel ist auf den Faden begrenzt. Der Faden ist NICHT durch Auslieferung
//      isoliert (app/globals.css lädt unbedingt, FADEN_AKTIV schaltet nur den
//      Komponentenbaum) — eine Regel ohne Präfix trifft die Alt-Site lautlos.
//   3. Jede Datei aus app/faden/ steht in index.css.
//
// Ausnahmen sind einzeln begründet, nicht pauschal.

import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const ORDNER = "app/faden";
const norm = (s) => s.replace(/\s+/g, " ").trim();

// Was ohne .faden-shell-Präfix stehen darf, mit Grund.
const PRAEFIX_FREI = [
  [/^@?keyframes/i,     "Keyframe-Stufen tragen keinen Selektor"],
  [/^(from|to|\d+%)/,   "Keyframe-Stufen"],
  [/^body\.faden-body/, "die Hülle selbst"],
  [/^body\.mit-anker/,  "Zustandsklasse am body, vom Faden gesetzt"],
  [/^:root/,            "Tokens"],
];
const istFrei = (sel, ctx) =>
  ctx.startsWith("@keyframes") ||
  sel.includes(".faden-shell") ||          // z. B. body[data-landing] .faden-shell .rand
  /\.faden-[a-z-]+/.test(sel) ||           // eigene Klasse für Portale, z. B. .toast.faden-toast
  PRAEFIX_FREI.some(([re]) => re.test(sel));

const kontext = (n) => {
  const t = [];
  for (let p = n.parent; p && p.type !== "root"; p = p.parent)
    if (p.type === "atrule") t.unshift(`@${p.name} ${norm(p.params)}`);
  return t.join(" » ") || "—";
};

const dateien = fs.readdirSync(ORDNER).filter((f) => f.endsWith(".css") && f !== "index.css");
const wo = new Map();        // "kontext ‖ selektor" -> Set(dateien)
const ohnePraefix = [];

for (const f of dateien) {
  const p = path.join(ORDNER, f);
  const wurzel = postcss.parse(fs.readFileSync(p, "utf8"), { from: p });
  wurzel.walkRules((r) => {
    const ctx = kontext(r);
    for (const sel of r.selectors) {
      const s = norm(sel);
      const k = `${ctx} ‖ ${s}`;
      if (!wo.has(k)) wo.set(k, new Set());
      wo.get(k).add(f);
      if (!s.startsWith(".faden-shell") && !istFrei(s, ctx))
        ohnePraefix.push(`${f}:${r.source.start.line}  ${s}`);
    }
  });
}

// Altlasten aus dem Umzug (Schritt 0b): Selektoren, die schon vor der Aufteilung im
// selben Kontext zweimal standen und dabei in zwei Abschnitte gefallen sind. Sie sind
// erlaubt, bis der jeweilige Abschnitt neu aus der Vorlage gesetzt ist — dann fällt die
// zweite Fundstelle weg. 🚨 Die Liste darf nur SCHRUMPFEN, nie wachsen.
const ALTLASTEN = new Set([
  "— ‖ .faden-shell",                                  // Variablen, 46 Stück, keine doppelt
  "@keyframes ks-rein ‖ from", "@keyframes ks-rein ‖ to", // wortgleich, gehört nach bewegung.css
  "— ‖ .faden-shell .register .punkte-zahl",
  "— ‖ .faden-shell .eingabe",
  "— ‖ .faden-shell .begriff", "— ‖ .faden-shell .begriff:hover", "— ‖ .faden-shell .begriff.offen",
  "— ‖ .faden-shell .glossar-rail",
  "— ‖ .faden-shell .glossar-rail .eintrag-g",
  "— ‖ .faden-shell .glossar-rail .eintrag-g > button",
  "— ‖ .faden-shell .glossar-rail .erkl",
  "— ‖ .faden-shell .glossar-rail .erkl .quelle",
  "— ‖ .faden-shell .kasten--begriff",
  "— ‖ .faden-shell .artikel", "— ‖ .faden-shell .abschnitt", "— ‖ .faden-shell .fliess",
  "— ‖ .faden-shell .kasten",
]);

let fehler = 0;

const geteilt = [...wo].filter(([, s]) => s.size > 1);
const neu = geteilt.filter(([k]) => !ALTLASTEN.has(k));
const alt = geteilt.filter(([k]) => ALTLASTEN.has(k));
if (neu.length) {
  fehler += neu.length;
  console.error(`✗ ${neu.length} NEUE(R) Selektor(en) in mehr als einer Datei:`);
  for (const [k, s] of neu) console.error(`   ${k}\n     → ${[...s].join(", ")}`);
} else console.log(`✓ kein neuer Selektor in zwei Dateien (${wo.size} geprüft)`);
const weg = [...ALTLASTEN].filter((k) => !geteilt.some(([g]) => g === k));
console.log(`  Altlasten aus dem Umzug: ${alt.length} von ${ALTLASTEN.size}${weg.length ? ` — ${weg.length} erledigt, aus der Liste nehmen: ${weg.join(", ")}` : ""}`);

if (ohnePraefix.length) {
  fehler += ohnePraefix.length;
  console.error(`✗ ${ohnePraefix.length} Regel(n) ohne .faden-shell-Präfix — sie treffen die Alt-Site:`);
  for (const z of ohnePraefix) console.error(`   ${z}`);
} else console.log("✓ jede Regel ist auf den Faden begrenzt");

const index = fs.readFileSync(path.join(ORDNER, "index.css"), "utf8");
const fehlend = dateien.filter((f) => !index.includes(`./${f}`));
if (fehlend.length) {
  fehler += fehlend.length;
  console.error(`✗ nicht in index.css eingebunden: ${fehlend.join(", ")}`);
} else console.log(`✓ alle ${dateien.length} Dateien stehen in index.css`);

process.exit(fehler ? 1 : 0);
