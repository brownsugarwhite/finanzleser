#!/usr/bin/env -S node --experimental-strip-types
/**
 * Schreibt den Editor-Zwilling der Registry:
 *   wordpress/plugins/finanzleser-blocks/financeads-registry.js
 *
 * Das Block-Plugin hat keinen Build-Schritt und kann lib/financeads/registry.ts nicht
 * importieren. Der Block `vergleich-quelle` braucht aber dieselben Kategorien und
 * Parameter (Label, Typ, Standard, Optionen, Presets, „fest"). Also generiert — nie von
 * Hand — und im PR-Check per `git diff --exit-code` gegen Drift gesichert.
 *
 *   node --experimental-strip-types tools/financeads-registry-export.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { alleKategorien } from "../lib/financeads/registry.ts";

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ziel = path.join(wurzel, "wordpress/plugins/finanzleser-blocks/financeads-registry.js");

const kategorien = alleKategorien().map((k) => ({
  kategorie: k.kategorie,
  titel: k.titel,
  klasse: k.klasse,
  defekt: !!k.defekt,
  params: k.params.map((p) => ({
    key: p.key, label: p.label, typ: p.typ, standard: p.standard,
    einheit: p.einheit || "", min: p.min ?? null, max: p.max ?? null, schritt: p.schritt ?? null,
    optionen: p.optionen || [], presets: p.presets || [], fest: !!p.fest,
  })),
  spalten: k.spalten.map((s) => ({ key: s.key, label: s.label })),
  bestwert: k.bestwert ? k.bestwert.key : "",
}));

const kopf = `/* GENERIERT von tools/financeads-registry-export.mjs aus lib/financeads/registry.ts — nicht von Hand ändern.
   Kategorien und Parameter der financeads-Vergleiche für den Block finanzleser/vergleich-quelle. */
`;
const inhalt = `${kopf}window.FL_FINANCEADS = ${JSON.stringify({ kategorien }, null, 2)};\n`;
const alt = fs.existsSync(ziel) ? fs.readFileSync(ziel, "utf8") : "";
fs.writeFileSync(ziel, inhalt);
console.log(`${path.relative(wurzel, ziel)}: ${kategorien.length} Kategorien${alt === inhalt ? " (unverändert)" : " (aktualisiert)"}`);
