// Aggressive Verteilung: jeden Vergleich in ALLE thematisch passenden Beiträge
// (gleicher Vergleich darf in mehreren Beiträgen vorkommen). Idempotent.
// Lauf: WP_SEED_USER=… WP_SEED_APP=… node scripts/distribute-vergleiche-aggressive.mjs [--dry]
import { readFileSync } from "node:fs";

const BASE = "https://staging.finanzleser.de";
const USER = process.env.WP_SEED_USER, APP = process.env.WP_SEED_APP;
const DRY = process.argv.includes("--dry");
if (!USER || !APP) { console.error("WP_SEED_USER/WP_SEED_APP setzen"); process.exit(1); }
const AUTH = "Basic " + Buffer.from(`${USER}:${APP}`).toString("base64");
const posts = JSON.parse(readFileSync("/tmp/staging-posts.json", "utf-8"));

// Globale Tabu-Artikel (Steuer-/Kündigungs-/Kontakt-Themen passen nie)
const GLOBAL_EXCLUDE = /steuer|kuendig|kontakt|absetzen|von-der|-pdf$|erklaerung|voranmeldung|bescheid|tabelle$|freibetrag|klassen/;

// Vergleich-CPT -> { kw: [Substrings], ex: [Substrings] }
const DISTR = {
  "private-haftpflichtversicherung-vergleich": { kw: ["private-haftpflicht", "berufshaftpflicht", "betriebshaftpflicht"] },
  "bauherren-haftpflichtversicherung-vergleich": { kw: ["bauherren"] },
  "hundehaftpflicht-vergleich": { kw: ["hundehaftpflicht", "hundeversicherung"] },
  "haus-und-grundbesitzerhaftpflicht-vergleich": { kw: ["hausbesitzerhaftpflicht", "grundbesitz"] },
  "drohnenversicherung-vergleich": { kw: ["drohn"] },
  "kfz-versicherung-vergleich": { kw: ["kfz-versicherung", "wohnmobil-versicherung", "e-scooter"] },
  "hausratversicherung-vergleich": { kw: ["hausrat"] },
  "gebaeudeversicherung-vergleich": { kw: ["wohngebaeude", "gebaeudeversicherung"] },
  "private-krankenversicherung-vergleich": { kw: ["private-krankenversicherung", "pkv", "standardtarif", "basistarif", "wechsel-private", "arbeitgeberzuschuss-private", "betriebliche-krankenversicherung"] },
  "risikolebensversicherung-vergleich": { kw: ["risikoleben"] },
  "lebensversicherung-vergleich": { kw: ["lebensversicherung"], ex: ["risiko"] },
  "reisekrankenversicherung-vergleich": { kw: ["reiseversicherung", "auslandskranken"] },
  "fahrradversicherung-vergleich": { kw: ["fahrrad", "e-bike", "e-scooter"] },
  "unfallversicherung-vergleich": { kw: ["unfallversicherung"] },
  "unfallversicherung-leistungen": { kw: ["unfallversicherung"] },
  "rechtsschutzversicherung-vergleich": { kw: ["rechtsschutz"] },
  "rentenversicherung-vergleich": { kw: ["rentenversicherung", "ruerup", "basisrente", "riester", "betriebliche-altersversorgung", "direktversicherung", "gehaltsumwandlung", "altersvorsorgeaufwendungen"], ex: ["beitrag", "gesetzliche"] },
  "photovoltaik-versicherung-vergleich": { kw: ["photovoltaik"] },
  "zahnzusatzversicherung-vergleich": { kw: ["zahnzusatz"] },
  "berufsunfaehigkeitsversicherung-vergleich": { kw: ["berufsunfaehigkeit", "erwerbsminderung"] },
  "cyberversicherung-vergleich": { kw: ["cyber"] },
  "sterbegeldversicherung-vergleich": { kw: ["sterbegeld"] },
  "pferdekrankenversicherung-vergleich": { kw: ["pferd", "tierversicherung"] },
  "hundekrankenversicherung-vergleich": { kw: ["hunde-op", "hundeversicherung", "hundekranken", "tierversicherung"] },
  // Bank & Finanzen
  "depot-vergleich": { kw: ["depot", "wertpapier", "etf", "fonds", "aktien", "nachhaltige-geldanlagen", "roboadvisor", "kryptowaehrung", "investition-in-gold", "investition-in-sachwerte", "etc-exchange"], ex: ["lebensversicherung", "steuer"] },
  "girokonto-vergleich": { kw: ["girokonto", "direktbank"] },
  "kreditkarten-vergleich": { kw: ["kreditkarte"] },
  "festgeldvergleich": { kw: ["festgeld", "einlagensicherung"] },
  "tagesgeldvergleich": { kw: ["tagesgeld"] },
  "bausparen-vergleich": { kw: ["bauspar"] },
  "baufinanzierung-vergleich": { kw: ["baufinanzierung", "grundschuld", "zinsbindung"] },
  "ratenkredit-vergleich": { kw: ["kredite", "ratenkredit"] },
  "minikredit-vergleich": { kw: ["minikredit"] },
  "autokredit-vergleich": { kw: ["autokredit"] },
  "gaspreisvergleich": { kw: ["gaspreis"] },
  "strompreisvergleich": { kw: ["strompreis"] },
  "bussgeldrechner-vergleich": { kw: ["bussgeld"] },
  // niche ohne Artikel
  "elektronikversicherung-vergleich": { kw: ["elektronikversicherung"] },
  "geschaeftskonto-vergleich": { kw: ["geschaeftskonto", "firmenkonto"] },
  "studentenkonto-vergleich": { kw: ["studentenkonto"] },
  "studentenkreditkarte-vergleich": { kw: ["studentenkreditkarte"] },
  "mietkaution-rechner": { kw: ["mietkaution"] },
  "rentenlueckenrechner": { kw: ["rentenluecke"] },
};

function matchArticles(cfg) {
  const out = [];
  for (const slug of Object.keys(posts)) {
    if (GLOBAL_EXCLUDE.test(slug)) continue;
    if (cfg.ex && cfg.ex.some((e) => slug.includes(e))) continue;
    if (cfg.kw.some((k) => slug.includes(k))) out.push(slug);
  }
  return out;
}

const block = (slug) => `<!-- wp:finanzleser/vergleich {"slug":"${slug}"} -->\n<div data-finanzleser-vergleich="${slug}"></div>\n<!-- /wp:finanzleser/vergleich -->`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(url, opts = {}, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, opts); if (r.ok) return r; if (i === tries - 1) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`); }
    catch (e) { if (i === tries - 1) throw e; }
    await sleep(800 * (i + 1));
  }
}

// Plan bauen
const plan = []; // {post, cpt}
for (const [cpt, cfg] of Object.entries(DISTR)) {
  for (const post of matchArticles(cfg)) {
    if (posts[post].vergleiche.includes(cpt)) continue; // schon drin
    plan.push({ post, cpt });
  }
}
// nach Beitrag gruppieren (ein PUT pro Beitrag mit allen neuen Blöcken)
const byPost = {};
for (const p of plan) (byPost[p.post] ||= []).push(p.cpt);

console.log(`Geplante Einfügungen: ${plan.length} in ${Object.keys(byPost).length} Beiträgen${DRY ? "  (DRY)" : ""}\n`);
for (const [post, cpts] of Object.entries(byPost).sort()) console.log(`  ${post.padEnd(42)} += ${cpts.join(", ")}`);

if (DRY) {
  const cov = {};
  for (const cpt of Object.keys(DISTR)) {
    const total = matchArticles(DISTR[cpt]).length;
    cov[cpt] = total;
  }
  console.log("\n=== Abdeckung je Vergleich (Artikel gesamt nach Verteilung) ===");
  for (const [cpt, n] of Object.entries(cov).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${cpt}`);
  process.exit(0);
}

let done = 0;
for (const [post, cpts] of Object.entries(byPost)) {
  const r = await fetchRetry(`${BASE}/wp-json/wp/v2/posts/${posts[post].id}?context=edit&_fields=content`, { headers: { Authorization: AUTH } });
  let raw = (await r.json()).content.raw;
  for (const cpt of cpts) {
    if (raw.includes(`data-finanzleser-vergleich="${cpt}"`) || raw.includes(`"${cpt}"`)) continue;
    raw = raw.trimEnd() + "\n\n" + block(cpt);
  }
  await fetchRetry(`${BASE}/wp-json/wp/v2/posts/${posts[post].id}`, { method: "POST", headers: { Authorization: AUTH, "Content-Type": "application/json" }, body: JSON.stringify({ content: raw }) });
  console.log(`✓ ${post} += ${cpts.join(", ")}`);
  done++;
  await sleep(400);
}
console.log(`\nFertig. ${done} Beiträge aktualisiert, ${plan.length} Blöcke eingefügt.`);
