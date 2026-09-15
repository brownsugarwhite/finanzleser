#!/usr/bin/env -S node --experimental-strip-types
/**
 * Vergleiche auf der financeads-API: prüfen, planen, schreiben.
 *
 *   node --experimental-strip-types tools/financeads-vergleiche.mjs pruefen
 *       Varianten-Prüfung: holt je Kandidat aus docs/inhalte/financeads-vergleiche.json
 *       (`varianten_pruefung`) Basis und Variante und vergleicht die Produkt-ID-Mengen.
 *       Eine Variante verdient nur dann eine eigene Seite, wenn ihre Produktmenge sich
 *       materiell unterscheidet (≥ 3 Produkte UND ≥ 20 % Differenz) — sonst Doorway.
 *   node --experimental-strip-types tools/financeads-vergleiche.mjs plan
 *       Zeigt, was `schreiben` tun würde (bestehende CPTs umstellen, neue anlegen).
 *   node --experimental-strip-types tools/financeads-vergleiche.mjs schreiben [--trocken]
 *       Schreibt auf cms-dev (App-Passwort aus .env.cms-dev.local). Bestehende Slugs: nur der
 *       Block `finanzleser/vergleich-quelle` im post_content wird ersetzt. Neue: CPT anlegen.
 *
 * 🚨 Höchstens zwei Anfragen parallel — gegen financeads sequenziell (1–12 s je Abruf).
 * 🚨 Nie gegen das Produktions-CMS: CMS_DEV_URL / cms-dev ist fest verdrahtet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchVergleich } from "../lib/financeads/client.ts";
import { kategorieDef } from "../lib/financeads/registry.ts";
import { apiParams } from "../lib/financeads/quelle.ts";

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUELLE = path.join(wurzel, "docs/inhalte/financeads-vergleiche.json");

function ladeEnv(datei) {
  const p = path.join(wurzel, datei);
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const l of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(l)) continue;
    const i = l.indexOf("=");
    out[l.slice(0, i)] = l.slice(i + 1).trim().split(/\s+/).pop();
  }
  return out;
}
// .env.local trägt den financeads-Zugang; der Client liest process.env.
for (const [k, v] of Object.entries(ladeEnv(".env.local"))) if (!process.env[k]) process.env[k] = v;

const daten = JSON.parse(fs.readFileSync(QUELLE, "utf8"));
const befehl = process.argv[2] || "pruefen";
const trocken = process.argv.includes("--trocken");

async function ids(kategorie, params) {
  const def = kategorieDef(kategorie);
  if (!def) throw new Error(`unbekannte Kategorie ${kategorie}`);
  const antwort = await fetchVergleich(def.version, kategorie, apiParams(def, params), { timeoutMs: 40000 });
  return new Set((antwort.data?.products || []).map((p) => p.base_data.id));
}

async function pruefen() {
  console.log("Varianten-Prüfung (Produkt-ID-Mengen, sequenziell)\n");
  const zeilen = [];
  for (const k of daten.varianten_pruefung) {
    const t = Date.now();
    let a, b, fehler;
    try { a = await ids(k.kategorie, k.basis); b = await ids(k.kategorie, k.variante); } catch (e) { fehler = e.message; }
    if (fehler) { zeilen.push([k.name, "FEHLER", fehler.slice(0, 80)]); console.log(`  ${k.name}: FEHLER ${fehler}`); continue; }
    const gemeinsam = [...a].filter((x) => b.has(x)).length;
    const nurB = b.size - gemeinsam;
    const nurA = a.size - gemeinsam;
    const differenz = Math.max(nurA, nurB);
    const anteil = a.size ? differenz / Math.max(a.size, b.size) : 0;
    const urteil = a.size === b.size && gemeinsam === a.size ? "IDENTISCH → keine Seite"
      : b.size < 3 ? `nur ${b.size} Produkte → keine Seite`
      : differenz >= 3 && anteil >= 0.2 ? "eigene Seite möglich (mit eigenem Text)"
      : "zu nah an der Basis → keine Seite";
    zeilen.push([k.name, `${a.size} vs ${b.size} (gemeinsam ${gemeinsam})`, urteil]);
    console.log(`  ${k.name.padEnd(24)} Basis ${String(a.size).padStart(3)}  Variante ${String(b.size).padStart(3)}  gemeinsam ${String(gemeinsam).padStart(3)}  ${urteil}  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
  }
  console.log("\nRegel: eigene Seite nur bei ≥ 3 Produkten Unterschied UND ≥ 20 % Differenz, plus eigenem Redaktionstext.");
  return zeilen;
}

function plan() {
  const bestand = daten.vergleiche.filter((v) => v.bestand);
  const neu = daten.vergleiche.filter((v) => !v.bestand);
  console.log(`Umstellen (Block ersetzen): ${bestand.length}`);
  for (const v of bestand) console.log(`  ${v.slug.padEnd(44)} → ${v.kategorie}${Object.keys(v.fest).length ? " " + JSON.stringify(v.fest) : ""}${v.defekt ? "  (Endpunkt defekt)" : ""}`);
  console.log(`\nNeu anlegen (publish): ${neu.length}`);
  for (const v of neu) console.log(`  ${v.slug.padEnd(44)} → ${v.kategorie}${Object.keys(v.fest).length ? " " + JSON.stringify(v.fest) : ""}`);
  console.log(`\nWeiterleitungen: ${daten.redirects.length}`);
  for (const r of daten.redirects) console.log(`  ${r.von} → ${r.nach}`);
  const fehlend = daten.vergleiche.filter((v) => !kategorieDef(v.kategorie));
  if (fehlend.length) { console.error("\nUnbekannte Kategorien:", fehlend.map((v) => v.slug)); process.exit(1); }
}

/** base64-JSON wie der Block `vergleich-quelle` (blocks.js encodeQuelle). */
function blockConfig(v) {
  const obj = { embedType: "financeads", kategorie: v.kategorie, fest: v.fest || {}, vor: v.vor || {} };
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

function blockKommentar(v) {
  return `<!-- wp:finanzleser/vergleich-quelle {"config":"${blockConfig(v)}"} /-->`;
}

async function schreiben() {
  const env = ladeEnv(".env.cms-dev.local");
  const BASIS = (env.CMS_DEV_URL || "https://cms-dev.finanzleser.de").replace(/\/$/, "");
  if (!/cms-dev/.test(BASIS)) throw new Error("schreiben nur gegen cms-dev");
  if (!env.CMS_DEV_APP_USER || !env.CMS_DEV_APP_PASS) throw new Error("CMS_DEV_APP_USER/PASS fehlen in .env.cms-dev.local");
  const AUTH = "Basic " + Buffer.from(`${env.CMS_DEV_APP_USER}:${env.CMS_DEV_APP_PASS}`).toString("base64");
  const kopf = { Authorization: AUTH, "Content-Type": "application/json", Accept: "application/json" };

  async function rest(pfad, init = {}) {
    const res = await fetch(`${BASIS}/wp-json/${pfad}`, { ...init, headers: { ...kopf, ...(init.headers || {}) } });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    if (!res.ok) throw new Error(`${pfad}: HTTP ${res.status} ${typeof json === "string" ? json.slice(0, 120) : json?.message || ""}`);
    return json;
  }

  // Bestand holen (roh, context=edit liefert den Block-Kommentar im content.raw)
  const alle = await rest("wp/v2/vergleich?per_page=100&context=edit&_fields=id,slug,title,content,excerpt,status");
  const bySlug = new Map(alle.map((p) => [p.slug, p]));
  console.log(`cms-dev: ${alle.length} Vergleich-CPTs\n`);

  let geaendert = 0, angelegt = 0;
  for (const v of daten.vergleiche) {
    const vorhanden = bySlug.get(v.slug);
    const kommentar = blockKommentar(v);
    if (vorhanden) {
      const raw = vorhanden.content?.raw || "";
      const neu = /<!-- wp:finanzleser\/vergleich-quelle [\s\S]*?\/-->/.test(raw)
        ? raw.replace(/<!-- wp:finanzleser\/vergleich-quelle [\s\S]*?\/-->/, kommentar)
        : `${kommentar}\n${raw}`.trim();
      const body = { content: neu };
      if (!(vorhanden.excerpt?.raw || "").trim() && v.excerpt) body.excerpt = v.excerpt;
      console.log(`  ${trocken ? "würde umstellen" : "umstellen"}: ${v.slug} (#${vorhanden.id})`);
      if (!trocken) await rest(`wp/v2/vergleich/${vorhanden.id}`, { method: "POST", body: JSON.stringify(body) });
      geaendert++;
    } else {
      const body = { title: v.titel, slug: v.slug, status: "publish", content: kommentar, excerpt: v.excerpt || "" };
      console.log(`  ${trocken ? "würde anlegen" : "anlegen"}: ${v.slug}`);
      if (!trocken) await rest("wp/v2/vergleich", { method: "POST", body: JSON.stringify(body) });
      angelegt++;
    }
  }
  console.log(`\n${geaendert} umgestellt, ${angelegt} angelegt${trocken ? " (Trockenlauf)" : ""}.`);
  if (!trocken) console.log("Jetzt: Refresh laufen lassen (tools/financeads-refresh.mjs) und den Dev-Server per POST /api/revalidate auffrischen.");
}

if (befehl === "pruefen") await pruefen();
else if (befehl === "plan") plan();
else if (befehl === "schreiben") await schreiben();
else { console.error("Befehl: pruefen | plan | schreiben [--trocken]"); process.exit(1); }
