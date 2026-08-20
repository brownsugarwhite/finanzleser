#!/usr/bin/env -S node --experimental-strip-types
/**
 * Regressionstest fuer die SEO-Weiterleitungen.
 *
 * WOZU
 * app/[kategorie]/page.tsx ist die Kaskade, die die Google-Deindexierung repariert hat
 * (Commits adb4097, 6ee9560, eddd231). Jede Aenderung an dieser Route — insbesondere der
 * Bot-Guard aus lib/botPaths.ts — muss beweisen, dass sie keine einzige der reparierten
 * Weiterleitungen bricht.
 *
 * ZWEI MODI
 *
 *   node --experimental-strip-types tools/verify-redirects.mjs --offline
 *       Ohne Netz. Prueft die Denylist aus lib/botPaths.ts gegen den vollstaendigen
 *       bekannten URL-Bestand. Freigabebedingung: NULL Treffer auf echten URLs.
 *       Laeuft in Sekunden, gehoert vor jeden Commit an botPaths.ts.
 *
 *   node --experimental-strip-types tools/verify-redirects.mjs --preview https://<preview>.netlify.app
 *       Schiesst jede bekannte URL gegen Preview UND Produktion und vergleicht
 *       Statuscode + Location-Header. Freigabebedingung: keine Abweichung.
 *       Zusaetzlich: Stichprobe bekannter Scanner-Pfade, die 404 liefern muessen.
 *       Optional --limit N fuer einen schnellen Durchlauf.
 *
 * QUELLEN DES URL-BESTANDS
 *   lib/redirects.generated.ts       generierte Legacy-Redirects
 *   docs/redirect_arbeitsliste.csv   GSC-Arbeitsliste
 *   next.config.ts                   manuelle Redirects + GONE-Liste
 *   <prod>/sitemap.xml               aktueller Live-Bestand
 */

import fs from "node:fs";
import path from "node:path";

const PROD = "https://www.finanzleser.de";
const ROOT = path.resolve(import.meta.dirname, "..");

const args = process.argv.slice(2);
const OFFLINE = args.includes("--offline");
const PREVIEW = args[args.indexOf("--preview") + 1];
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

// 🚨 Parallelitaet bewusst NIEDRIG (Default 3, vorher fest 8).
//
// Dieser Lauf fragt jede URL gegen Preview UND Produktion ab. Auf der Produktion trifft
// er dabei abgelaufene ISR-Eintraege und loest deren Neuerzeugung aus — und die laeuft
// gegen ein IONOS-WordPress, das bei ~2,3s pro Abfrage unter Parallellast mit
// "Error establishing a database connection" aussteigt. Genau so sind am 19.08.2026
// 12 Anbieterseiten als 404 und 25 mit Startseiten-Canonical in den Cache gebacken
// worden: durch einen Mess-Sweep mit 12 parallelen Verbindungen. Der Zeitstempel
// x-nextjs-date der kaputten Seiten lag exakt im Fenster dieses Sweeps.
//
// Ein Pruefwerkzeug darf das, was es prueft, nicht beschaedigen. Hoeher als 6 nie setzen.
const CONCURRENCY = args.includes("--concurrency")
  ? Math.max(1, Number(args[args.indexOf("--concurrency") + 1]))
  : 3;

// --- Denylist direkt aus lib/botPaths.ts ------------------------------------
// Kein Nachbau, kein Duplikat: Node 22+ kann TypeScript per --experimental-strip-types
// direkt laden. Damit testet dieses Skript garantiert genau den Code, der auch laeuft.
const { isBotPathSegment: isBotSegment } = await import("../lib/botPaths.ts");

// --- URL-Bestand einsammeln --------------------------------------------------
function fromGeneratedRedirects() {
  const f = path.join(ROOT, "lib/redirects.generated.ts");
  if (!fs.existsSync(f)) return [];
  return [...fs.readFileSync(f, "utf8").matchAll(/"(\/[^"]*)"/g)]
    .map((m) => m[1])
    .filter((p) => !p.includes("*") && !p.includes(":"));
}

function fromWorklistCsv() {
  const f = path.join(ROOT, "docs/redirect_arbeitsliste.csv");
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, "utf8")
    .split("\n").slice(1)
    .map((line) => (line.split(";")[1] || "").trim())
    .filter((u) => u.startsWith("http"))
    .map((u) => { try { return new URL(u).pathname; } catch { return null; } })
    .filter(Boolean);
}

function fromNextConfig() {
  const f = path.join(ROOT, "next.config.ts");
  if (!fs.existsSync(f)) return [];
  return [...fs.readFileSync(f, "utf8").matchAll(/source:\s*"(\/[^"]*)"/g)]
    .map((m) => m[1])
    .filter((p) => !p.includes(":") && !p.includes("*"));
}

async function fromSitemap(base) {
  try {
    const res = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(30000) });
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => { try { return new URL(m[1]).pathname; } catch { return null; } })
      .filter(Boolean);
  } catch (e) {
    console.warn(`  Sitemap nicht erreichbar (${e.message}) — ohne sie weiter.`);
    return [];
  }
}

// --- Modus 1: offline --------------------------------------------------------
async function runOffline() {
  console.log("Denylist direkt aus lib/botPaths.ts geladen (kein Duplikat).\n");

  const known = [...new Set([
    ...fromGeneratedRedirects(),
    ...fromWorklistCsv(),
    ...fromNextConfig(),
    ...await fromSitemap(PROD),
  ])];

  const caught = known.filter((p) =>
    p.split("/").filter(Boolean).some(isBotSegment)
  );

  console.log(`Bekannte URLs geprueft: ${known.length}`);
  if (caught.length) {
    console.error(`\nFEHLGESCHLAGEN — der Guard wuerde ${caught.length} echte URL(s) auf 404 schicken:`);
    caught.forEach((p) => console.error("   " + p));
    console.error("\nDenylist enger fassen. NICHT mergen.");
    process.exit(1);
  }
  console.log("Null Treffer auf echten URLs.\n");

  const attacks = [
    "/wp-login.php", "/wp-admin", "/wp-content/plugins/x", "/wp-includes/y", "/wp-json",
    "/.env", "/.git/config", "/.htaccess", "/xmlrpc.php", "/xmlrpc",
    "/vendor/phpunit/phpunit/x", "/phpmyadmin", "/cgi-bin/x", "/config.bak",
    "/backup.zip", "/shell.php", "/dump.sql", "/telescope", "/actuator/env",
  ];
  const missed = attacks.filter((p) => !p.split("/").filter(Boolean).some(isBotSegment));
  console.log(`Scanner-Muster erkannt: ${attacks.length - missed.length}/${attacks.length}`);
  if (missed.length) {
    console.log(`  nicht erkannt (unkritisch — faellt aufs bisherige Verhalten zurueck):`);
    missed.forEach((p) => console.log("   " + p));
  }
  console.log("\nOFFLINE-PRUEFUNG BESTANDEN.");
}

// --- Modus 2: Preview gegen Produktion --------------------------------------
async function probe(base, p) {
  try {
    const res = await fetch(base + p, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "finanzleser-redirect-check" },
    });
    let loc = res.headers.get("location");
    if (loc) { try { loc = new URL(loc, base).pathname; } catch { /* relativ lassen */ } }
    return { status: res.status, location: loc };
  } catch (e) {
    return { status: 0, location: null, error: e.message };
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }));
  return out;
}

async function runLive() {
  if (!PREVIEW) {
    console.error("Fehlt: --preview https://<deploy-preview>.netlify.app");
    process.exit(1);
  }
  const known = [...new Set([
    ...fromGeneratedRedirects(),
    ...fromWorklistCsv(),
    ...fromNextConfig(),
    ...await fromSitemap(PROD),
  ])].slice(0, LIMIT);

  console.log(`Vergleiche ${known.length} URLs: ${PREVIEW}  vs.  ${PROD}`);
  console.log(`Parallelitaet: ${CONCURRENCY} (schont das IONOS-WP — siehe Kommentar bei CONCURRENCY)\n`);

  let done = 0;
  const results = await mapLimit(known, CONCURRENCY, async (p) => {
    const [prev, prod] = await Promise.all([probe(PREVIEW, p), probe(PROD, p)]);
    if (++done % 100 === 0) process.stdout.write(`  ${done}/${known.length}\r`);
    return { path: p, prev, prod };
  });

  const diffs = results.filter((r) =>
    r.prev.status !== r.prod.status || r.prev.location !== r.prod.location
  );

  console.log(`\nGeprueft: ${results.length}`);
  if (diffs.length) {
    console.error(`\nFEHLGESCHLAGEN — ${diffs.length} Abweichung(en):\n`);
    for (const d of diffs) {
      console.error(`  ${d.path}`);
      console.error(`     Produktion: ${d.prod.status}${d.prod.location ? " -> " + d.prod.location : ""}`);
      console.error(`     Preview:    ${d.prev.status}${d.prev.location ? " -> " + d.prev.location : ""}`);
    }
    console.error("\nJede Abweichung ist ein Blocker. NICHT mergen.");
    process.exit(1);
  }
  console.log("Keine Abweichung — alle Weiterleitungen unveraendert.\n");

  const attacks = ["/wp-login.php", "/.env", "/xmlrpc.php", "/wp-content/plugins/x", "/vendor/phpunit/x"];
  console.log("Scanner-Pfade auf dem Preview (erwartet 404):");
  for (const p of attacks) {
    const r = await probe(PREVIEW, p);
    console.log(`  ${r.status === 404 ? "ok  " : "!!  "} ${p} -> ${r.status}`);
  }

  const gone = ["/aenderungen-2019", "/page/7"];
  console.log("\n410-Pfade auf dem Preview (erwartet 410):");
  for (const p of gone) {
    const r = await probe(PREVIEW, p);
    console.log(`  ${r.status === 410 ? "ok  " : "!!  "} ${p} -> ${r.status}`);
  }

  console.log("\nLIVE-PRUEFUNG BESTANDEN.");
}

await (OFFLINE ? runOffline() : runLive());
