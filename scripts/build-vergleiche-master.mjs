// Baut die Master-Liste aller Vergleiche (ein Eintrag pro echtem Widget) aus:
//   - den 20 bereits kuratierten Configs (heutige app/api/vergleich-data/[slug]/route.ts)
//   - dem bereinigten Live-Inventar (scripts/output/live-embeds.json)
//   - vollständigen Roh-Snippets aus dem Live-Cache (scripts/output/live-posts-raw.json)
//
// Dedupe-Regel (User): EIN CPT pro echtem Widget. Identische Widgets (gleicher
// Anbieter + gleiches Tool) werden zusammengeführt; Drittanbieter-"-rechner"
// laufen als vergleich-CPT (typ "vergleichsrechner"), nicht als In-House-Rechner.
//
// Ausgabe: scripts/data/vergleiche-master.json  +  Review-Tabelle auf der Konsole.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "data");
const OUT = join(OUT_DIR, "vergleiche-master.json");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const embeds = JSON.parse(readFileSync(join(__dirname, "output", "live-embeds.json"), "utf-8"));
const raw = JSON.parse(readFileSync(join(__dirname, "output", "live-posts-raw.json"), "utf-8"));
const rawBySlug = {};
for (const p of [...raw.posts, ...raw.pages]) rawBySlug[p.slug] = p.content?.rendered || "";

// ── 1) Die 20 bereits kuratierten Einträge (1:1 aus heutiger route.ts) ─────────
// Diese gelten als Wahrheit; ihre Slugs/Configs bleiben unangetastet.
const EXISTING = {
  "private-haftpflichtversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/privathaftpflichtrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "festgeldvergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/festgeldrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "tagesgeldvergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/tagesgeldrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "autokredit-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/autokreditrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "ratenkredit-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/ratenkreditrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "bausparen-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/bausparrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "baufinanzierung-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/baufinanzierungrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "private-krankenversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://form.partner-versicherung.de/form.php?aid=1226&cid=1&partner_id=46986&insurance_id=1&scrollto=page&module=formv4" },
  "gaspreisvergleich": { embedType: "iframe", iframeUrl: "https://koop.energie.check24.de/129535/default/gas/?tracking_id2=264&considerdeposit=no&considerdiscounts=yes&paymentperiod=month&priceguarantee=yes&guidelinematch=yes&packages=no&eco=no&mode=normal&deviceoutput=desktop" },
  "strompreisvergleich": { embedType: "iframe", iframeUrl: "https://koop.energie.check24.de/129535/default/strom/?tracking_id2=264&considerdeposit=no&considerdiscounts=yes&paymentperiod=month&priceguarantee=yes&guidelinematch=yes&packages=no&eco=no&mode=normal&deviceoutput=desktop" },
  "risikolebensversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/risikolebensrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "reisekrankenversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/auslandskrankenrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "fahrradversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://rechner.covomo.de/bike?theme=covomo&r=eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D&vehicle_type=11870&type_of_use=11875" },
  "haus-und-grundbesitzerhaftpflicht-vergleich": { embedType: "iframe", iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=hug&id=00204203" },
  "unfallversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=unf&id=00204203" },
  "gebaeudeversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://www.mr-money.de/cookievgl.php?sp=wg&id=00204203" },
  "rechtsschutzversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/rechtsschutzrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "hausratversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://tools.financeads.net/hausratrechner.php?tp=dif&wf=24770&ntpl=responsive&h=1" },
  "kfz-versicherung-vergleich": { embedType: "iframe", iframeUrl: "https://kfz.check24.de/auto/rechner/web/rechner?appSettings=44b37067-61a3-408f-946c-72505fc56de4" },
  "rentenversicherung-vergleich": { embedType: "iframe", iframeUrl: "https://form.partner-versicherung.de/383ebb4ad0b6436d692cfca05cef2c89/form.php?aid=1226&cid=2&partner_id=46986&insurance_id=2&scrollto=page&module=formv4" },
  "lebensversicherung-vergleich": { embedType: "finanzen-de", scriptConfig: { type: "finanzen-de", slotId: "1721399007", siteKey: "httpswwwfinanzleserde", designId: "11912", productId: "38", scriptSrc: "https://vue-singlepage.am.fgrp.net/de/fdeam.nocache.module.js" } },
  "photovoltaik-versicherung-vergleich": { embedType: "iframe", iframeUrl: "https://rechner.covomo.de/photovoltaik?theme=covomo&r=eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D" },
  "bussgeldrechner-vergleich": { embedType: "bussgeld", scriptConfig: { type: "bussgeld", publisherId: "66dec4e85e311", scriptSrc: "https://widget.bussgeldrechner.org/3" } },
};

// ── 2) Titel/Excerpt/Typ-Helfer ───────────────────────────────────────────────
function titleFromSlug(slug) {
  return slug.replace(/-/g, " ").replace(/\bvergleich\b/i, "").replace(/\s+/g, " ").trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function typFromUrl(url, slug) {
  const u = (url || "").toLowerCase();
  if (/financeads|check24|koop\.energie/.test(u)) return /kredit|kreditkarte|konto|festgeld|tagesgeld|depot|bauspar/.test(slug) ? "bank" : "versicherung";
  return "versicherung";
}

// ── 3) Widget-Key zum Deduplizieren ───────────────────────────────────────────
function widgetKey(e) {
  const u = e.url || "";
  if (/financeads\.net/.test(u)) {
    const m = u.match(/financeads\.net\/([a-z0-9]+)\.php/i);
    return "financeads:" + (m ? m[1] : u);
  }
  if (/mr-money\.de/.test(u)) { const m = u.match(/sp=([a-z]+)/i); return "mrmoney:" + (m ? m[1] : u); }
  if (/check24/.test(u)) { const m = u.match(/(gas|strom|power|kfz|auto)/i); return "check24:" + (m ? m[1].toLowerCase() : u); }
  if (/covomo/.test(u)) return "covomo:" + e.slug;       // pro Produkt
  if (/partner-versicherung/.test(u)) return "partnerv:" + e.slug;
  if (/interhyp/.test(u)) return "interhyp:" + (/tilgung/.test(u) ? "tilgung" : "zins");
  if (/interrisk/.test(u)) return "interrisk:" + e.slug;
  if (/finanzen\.de|fgrp/.test(u)) return "finanzende:" + e.slug;
  if (/dieversicherer/.test(u)) return "gdv:rente";
  if (/brutto-netto-rechner/.test(u)) return "bnr:gehalt";
  return "other:" + (e.domain || u);
}

// Duplikate (gleiches Widget, anderer Live-Slug) → auf kanonischen Slug mappen
function canonicalSlug(slug) {
  const map = {
    "gaspreise": "gaspreisvergleich", "strompreise": "strompreisvergleich",
    "festgeld-rechner": "festgeldvergleich", "tagesgeld-rechner": "tagesgeldvergleich",
    "autokredit-rechner": "autokredit-vergleich",
    "auslandskrankenversicherung-rechner": "reisekrankenversicherung-vergleich",
    "baufinanzierung-rechner": "baufinanzierung-vergleich", "hauskreditrechner": "baufinanzierung-vergleich", "hypothekenrechner": "baufinanzierung-vergleich",
    "kfz-versicherung-rechner": "kfz-versicherung-vergleich",
    "private-krankenversicherung-rechner": "private-krankenversicherung-vergleich",
    "rentenversicherung-rechner": "rentenversicherung-vergleich",
    "berufsunfaehigkeitsversicherung-rechner": "berufsunfaehigkeitsversicherung-vergleich",
    "bussgeldrechner": "bussgeldrechner-vergleich",  // gleiches Bußgeld-Widget wie bestehend
  };
  return map[slug] || slug;
}

// Hand-verifizierte Configs für Script-/Sonder-Widgets (aus Live decodiert).
// Werte 1:1 aus dem Live-Embed (Affiliate-IDs unverändert = Monetarisierung).
const OVERRIDES = {
  "cyberversicherung-vergleich": { embedType: "covomo", typ: "versicherung", scriptConfig: { type: "covomo", embedType: "iframe", dataType: "cyv", affiliate: "eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D", scriptSrc: "https://cdn.covomo.de/integrations/widget/covomoIframeWidget.js" } },
  "elektronikversicherung-vergleich": { embedType: "covomo", typ: "versicherung", scriptConfig: { type: "covomo", embedType: "iframe", dataType: "electronic", affiliate: "eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D", scriptSrc: "https://cdn.covomo.de/integrations/widget/covomoIframeWidget.js" } },
  "hundekrankenversicherung-vergleich": { embedType: "covomo", typ: "versicherung", scriptConfig: { type: "covomo", embedType: "iframe", dataType: "pet-dog-health-new", affiliate: "eyJhZmZpbGlhdGVfaWQiOiI1MDAwMDA3MjkxIiwiYSI6IjUwMDAwMDcyOTEifQ%3D%3D", scriptSrc: "https://cdn.covomo.de/integrations/widget/covomoIframeWidget.js" } },
  "berufsunfaehigkeitsversicherung-vergleich": { embedType: "raw", typ: "versicherung", rawHtml: '<div style="width:100%" id="tcpp-iframe-buv"></div><script src="https://form.partner-versicherung.de/widgets/46986/tcpp-iframe-buv/buv-iframe.js"></script>' },
  "rentenlueckenrechner": { embedType: "raw", typ: "versicherung", rawHtml: "<script src='https://rentenrechner.dieversicherer.de/embed.js' id='app-finanzleser' data-domain='https://www.finanzleser.de/'></script>" },
};

// Verworfen (User-Entscheid 2026-06-13): überlappen In-House-Rechner bzw. kein Preisvergleich.
const DISCARD = new Set([
  "baufinanzierung",              // Interhyp-Zinscheck → baufinanzierung-vergleich deckt es ab
  "gehaltsrechner",              // brutto-netto-rechner.eu → In-House BruttoNettoRechner
  "tilgungsrechner",             // Interhyp → In-House TilgungRechner
  // unfallversicherung-leistungen wieder aktiv (2026-06-13): eigenständiger
  // InterRisk Leistungs-Navigator, KEIN Duplikat des mr-money-Preisvergleichs.
]);
const NEEDS_REVIEW = new Set([]);

// ── 4) Live-Embeds bereinigen + nach Widget gruppieren ────────────────────────
const HELPER = /iframeControls\.js|iframeResizeMe|qualityClickLoa|vxcp_qualityClick/i;
const cleaned = embeds.filter((e) => {
  const s = (e.slug + " " + e.title).toLowerCase();
  if (e.provider === "WP Table Builder (intern)") return false;
  if (s.includes("kontakt") || s.includes("impressum")) return false;
  if (e.tech === "link") return false;
  if (HELPER.test(e.url)) return false;
  return true;
});

const byWidget = {};
for (const e of cleaned) {
  const key = widgetKey(e);
  if (!byWidget[key]) byWidget[key] = [];
  byWidget[key].push(e);
}

// ── 5) Master zusammenbauen ───────────────────────────────────────────────────
const master = {};
function ensure(slug) {
  if (!master[slug]) master[slug] = { slug, title: titleFromSlug(slug), typ: "versicherung", liveSlugs: [], source: "" };
  return master[slug];
}

// 5a) bestehende 20 zuerst (kuratierte Config = Wahrheit)
for (const [slug, cfg] of Object.entries(EXISTING)) {
  const m = ensure(slug);
  Object.assign(m, cfg);
  m.existing = true;
  m.typ = typFromUrl(cfg.iframeUrl, slug);
  m.source = "route.ts (kuratiert)";
}

// 5b) Live-Widgets ergänzen (nur wenn der kanonische Slug noch keine Config hat)
for (const [key, group] of Object.entries(byWidget)) {
  const primary = group.slice().sort((a, b) => (a.tech !== "iframe") - (b.tech !== "iframe"))[0];
  const slug = canonicalSlug(primary.slug);
  const m = ensure(slug);
  if (!m.liveSlugs.includes(primary.slug)) m.liveSlugs.push(...new Set(group.map((g) => g.slug)));
  if (m.existing || m.iframeUrl || m.scriptConfig || m.rawHtml) continue; // schon kuratiert

  m.provider = primary.provider || primary.domain;
  m.source = "live (" + m.provider + ")";

  if (OVERRIDES[slug]) {
    Object.assign(m, OVERRIDES[slug]);          // hand-verifizierte Config
  } else if (primary.tech === "iframe") {
    m.embedType = "iframe";
    m.iframeUrl = primary.url;
    m.typ = typFromUrl(primary.url, slug);
  } else {
    m.embedType = "raw";
    m.rawHtml = `<!-- TODO Roh-Embed prüfen für ${primary.slug} (${primary.url}) -->`;
    m.needsReview = true;
    m.typ = typFromUrl(primary.url, slug);
  }
  if (NEEDS_REVIEW.has(slug)) m.needsReview = true;
}

// Beschreibungen (Textauszug) für die NEUEN Vergleiche anhängen
const DESCS = JSON.parse(readFileSync(join(OUT_DIR, "vergleiche-descriptions-neu.json"), "utf-8"));
for (const m of Object.values(master)) {
  if (!m.existing && DESCS[m.slug]) m.desc = DESCS[m.slug];
}

// Status: bestehende + saubere Neue = publish; zu prüfende = draft
for (const m of Object.values(master)) {
  m.status = m.existing ? "publish" : (m.needsReview ? "draft" : "publish");
}

// Roh-Snippet (vollständiges decodiertes vc_raw_html) für einen Live-Slug holen
function extractRawSnippet(slug, domain) {
  const content = rawBySlug[slug];
  if (!content) return null;
  const blocks = [...content.matchAll(/\[vc_raw_(?:html|js)\]([\s\S]*?)\[\/vc_raw_(?:html|js)\]/gi)];
  for (const b of blocks) {
    let dec;
    try { dec = Buffer.from(b[1].trim(), "base64").toString("utf-8"); } catch { continue; }
    if (/%[0-9A-Fa-f]{2}/.test(dec)) { try { dec = decodeURIComponent(dec); } catch { /* */ } }
    const dom = domain.replace(/^www\./, "").split(".").slice(-2).join(".");
    if (dec.includes(dom)) return dec.trim();
  }
  return null;
}

// ── 6) Schreiben + Review ─────────────────────────────────────────────────────
for (const slug of DISCARD) delete master[slug];
const list = Object.values(master).sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(OUT, JSON.stringify(list, null, 2));

const neu = list.filter((m) => !m.existing);
console.log(`Master: ${list.length} Vergleiche gesamt | ${list.filter((m) => m.existing).length} bestehend | ${neu.length} neu`);
console.log(`\n=== NEUE Einträge (zu prüfen) ===`);
console.log(`${"SLUG".padEnd(42)} ${"TYP".padEnd(8)} ${"EMBED".padEnd(10)} PROVIDER / liveSlugs`);
for (const m of neu) {
  const flag = m.needsReview ? " ⚠raw" : "";
  console.log(`${m.slug.padEnd(42)} ${m.typ.padEnd(8)} ${(m.embedType || "").padEnd(10)} ${m.provider || ""}${flag}  [${m.liveSlugs.join(",")}]`);
}
console.log(`\nGeschrieben: ${OUT}`);
