// Extrahiert alle Vergleiche / Vergleichsrechner / Drittanbieter-Finanzwidgets
// aus den aktiven (published) Beiträgen + Seiten der LIVE-Seite finanzleser.de.
//
// Read-only: nutzt ausschließlich die öffentliche WP-REST-API.
// Schlüssel-Technik der Legacy-Seite: WPBakery Page Builder. Die Widgets stecken in
// [vc_raw_html]-Shortcodes als Base64 + URL-encoded HTML (iframe/script).
//
// Ausgabe: scripts/output/live-posts-raw.json (Cache der REST-Antworten)
//          scripts/output/live-embeds.json    (extrahierte, klassifizierte Embeds)
//
// Lauf:  node scripts/extract-live-vergleiche.mjs
//        node scripts/extract-live-vergleiche.mjs --refetch   (Cache ignorieren)

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");
const RAW_FILE = join(OUT_DIR, "live-posts-raw.json");
const EMBEDS_FILE = join(OUT_DIR, "live-embeds.json");
const BASE = "https://www.finanzleser.de/wp-json/wp/v2";
const REFETCH = process.argv.includes("--refetch");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// 1. Fetch-Helfer (paginiert über x-wp-totalpages)
// ---------------------------------------------------------------------------
async function fetchAll(type) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  const fields = "id,slug,title,link,date,modified,categories,content,status";
  do {
    const url = `${BASE}/${type}?per_page=100&page=${page}&status=publish&_fields=${fields}`;
    const res = await fetch(url);
    if (!res.ok) {
      // page > totalPages liefert 400 -> sauber abbrechen
      if (res.status === 400 && page > 1) break;
      throw new Error(`${type} page ${page}: HTTP ${res.status}`);
    }
    totalPages = Number(res.headers.get("x-wp-totalpages") || "1");
    const batch = await res.json();
    all.push(...batch);
    process.stdout.write(`\r  ${type}: Seite ${page}/${totalPages} (${all.length} geladen)   `);
    page++;
  } while (page <= totalPages);
  process.stdout.write("\n");
  return all;
}

async function fetchCategories() {
  const map = {};
  let page = 1;
  let totalPages = 1;
  do {
    const res = await fetch(`${BASE}/categories?per_page=100&page=${page}&_fields=id,name,slug,parent`);
    if (!res.ok) break;
    totalPages = Number(res.headers.get("x-wp-totalpages") || "1");
    for (const c of await res.json()) map[c.id] = c;
    page++;
  } while (page <= totalPages);
  return map;
}

function categoryPath(ids, catMap) {
  return (ids || [])
    .map((id) => {
      const parts = [];
      let cur = catMap[id];
      let guard = 0;
      while (cur && guard++ < 10) {
        parts.unshift(cur.name);
        cur = cur.parent ? catMap[cur.parent] : null;
      }
      return parts.join(" › ");
    })
    .join(" | ");
}

// ---------------------------------------------------------------------------
// 2. Embed-Extraktion aus content.rendered
// ---------------------------------------------------------------------------

// Anbieter-Erkennung per Domain. Erweiterbar — unbekannte Domains landen in "Unklar".
const PROVIDERS = [
  { name: "financeads.net", match: /financeads\.net/i },
  { name: "Check24", match: /check24\.(de|net)/i },
  { name: "Covomo", match: /covomo\.de/i },
  { name: "mr-money.de", match: /mr-money\.de/i },
  { name: "partner-versicherung.de", match: /partner-versicherung\.de/i },
  { name: "finanzen.de", match: /(^|\.)finanzen\.de|fin\.api|fde-/i },
  { name: "bussgeldrechner.org", match: /bussgeldrechner\.org|bussgeld-rechner/i },
  { name: "WP Table Builder (intern)", match: /wptb/i },
  { name: "Tarifcheck", match: /tarifcheck\.de/i },
  { name: "Verivox", match: /verivox\.de/i },
  { name: "Smava", match: /smava\.de/i },
  { name: "Getsafe", match: /getsafe/i },
  { name: "CHECK24 Profis", match: /profis\.check24/i },
  { name: "Tarifrechner.de", match: /tarifrechner\.de/i },
  { name: "Franke & Bornberg", match: /fb-tools|franke-bornberg/i },
  { name: "Mr-Money Maklerservice", match: /maklerservice/i },
  { name: "Interhyp", match: /interhyp\.de/i },
  { name: "InterRisk", match: /interrisk\.de|intervisio/i },
  { name: "GDV / dieversicherer.de", match: /dieversicherer\.de/i },
  { name: "VXCP (Affiliate)", match: /vxcp\.de/i },
  { name: "Die Haftpflichtkasse", match: /haftpflichtkasse\.de/i },
  { name: "brutto-netto-rechner.eu", match: /brutto-netto-rechner\.eu/i },
];

// Reine Helfer-/Noise-Skripte (kein Vergleich/Rechner) -> werden markiert & rausgefiltert
const NOISE = /crsend\.com|rss_archive|iframeResizeMe|iframeresize|fa_iframeresize/i;

function classifyProvider(url) {
  for (const p of PROVIDERS) if (p.match.test(url)) return p.name;
  return null;
}

// Typ-Heuristik (Rechner vs Vergleich vs Formular) inkl. Grauzone
function classifyType(url, domain) {
  const u = url.toLowerCase();
  if (/rechner|calc|berechn/.test(u)) return "Vergleichsrechner";
  if (/vergleich|tarif.*vergleich|compare/.test(u)) return "Vergleich";
  if (/antrag|formular|lead|form|angebot/.test(u)) return "Formular";
  // finanzen.de Vue-Slots sind i.d.R. Lead-Formulare
  if (/finanzen\.de|fde-/.test(u)) return "Formular";
  return "Unklar";
}

// Affiliate-/Tracking-ID aus URL ziehen
function affiliateId(url) {
  const params = ["wf", "pid", "tp", "partner", "pc", "wmid", "aid", "subid", "ref", "campaign"];
  try {
    const q = new URL(url).searchParams;
    const hits = [];
    for (const p of params) if (q.has(p)) hits.push(`${p}=${q.get(p)}`);
    return hits.join("&");
  } catch {
    return "";
  }
}

function tryDecodeBase64Url(raw) {
  const s = raw.trim();
  try {
    let decoded = Buffer.from(s, "base64").toString("utf-8");
    // WPBakery vc_raw_html ist zusätzlich URL-encoded
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
      try { decoded = decodeURIComponent(decoded); } catch { /* teils ungültig */ }
    }
    return decoded;
  } catch {
    return null;
  }
}

// Zieht aus einem HTML-Fragment alle iframe/script-src + externe Links
function extractUrlsFromHtml(html) {
  const urls = [];
  for (const m of html.matchAll(/<iframe[^>]*\ssrc=["']([^"']+)["']/gi)) urls.push({ url: m[1], tech: "iframe" });
  for (const m of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)) urls.push({ url: m[1], tech: "script" });
  for (const m of html.matchAll(/data-src=["']([^"']+)["']/gi)) urls.push({ url: m[1], tech: "iframe(data-src)" });
  // Web-Components / Custom Elements (z.B. <bussgeld-rechner>)
  for (const m of html.matchAll(/<([a-z]+-[a-z-]+)[\s>]/gi)) urls.push({ url: `webcomponent:${m[1]}`, tech: "web-component" });
  // externe href-Links (Affiliate)
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
    if (!/finanzleser\.de/i.test(m[1])) urls.push({ url: m[1], tech: "link" });
  }
  return urls;
}

const SHORTCODE_WHITELIST = /\[(wptb|tarifcheck|smava|finanzcheck|tablepress|su_|verivox|c24|check24)[^\]]*\]/gi;

function extractEmbeds(content) {
  const embeds = [];
  const seen = new Set();

  function push(url, tech, source) {
    const key = `${tech}|${url}`;
    if (seen.has(key)) return;
    seen.add(key);
    const domain = (() => {
      try { return new URL(url).hostname; } catch { return url.startsWith("webcomponent:") ? url : ""; }
    })();
    embeds.push({
      url,
      tech,
      source,
      domain,
      provider: classifyProvider(url),
      typ: classifyType(url, domain),
      affiliate: affiliateId(url),
    });
  }

  // a) vc_raw_html / vc_raw_js -> base64 -> urldecode
  for (const m of content.matchAll(/\[vc_raw_(html|js)\]([\s\S]*?)\[\/vc_raw_\1\]/gi)) {
    const decoded = tryDecodeBase64Url(m[2]);
    if (decoded) {
      for (const { url, tech } of extractUrlsFromHtml(decoded)) push(url, tech, "vc_raw_html");
    }
  }

  // b) inline iframe/script direkt im content (nicht base64)
  for (const { url, tech } of extractUrlsFromHtml(content)) push(url, tech, "inline");

  // c) benannte Shortcodes (Tabellen-Plugins, Drittanbieter-Shortcodes)
  for (const m of content.matchAll(SHORTCODE_WHITELIST)) {
    push(`shortcode:${m[0]}`, "shortcode", "shortcode");
  }

  return embeds;
}

// ---------------------------------------------------------------------------
// 3. Hauptlauf
// ---------------------------------------------------------------------------
async function main() {
  let posts, pages, catMap;

  if (!REFETCH && existsSync(RAW_FILE)) {
    console.log("Nutze Cache:", RAW_FILE);
    ({ posts, pages, catMap } = JSON.parse(readFileSync(RAW_FILE, "utf-8")));
  } else {
    console.log("Lade Kategorien …");
    catMap = await fetchCategories();
    console.log(`  ${Object.keys(catMap).length} Kategorien.`);
    console.log("Lade Beiträge …");
    posts = await fetchAll("posts");
    console.log("Lade Seiten …");
    pages = await fetchAll("pages");
    writeFileSync(RAW_FILE, JSON.stringify({ posts, pages, catMap }, null, 0));
    console.log("Roh-Cache gespeichert:", RAW_FILE);
  }

  const items = [...posts.map((p) => ({ ...p, _type: "post" })), ...pages.map((p) => ({ ...p, _type: "page" }))];
  console.log(`\nAnalysiere ${items.length} Inhalte (${posts.length} Beiträge + ${pages.length} Seiten) …`);

  const rows = [];
  let withEmbeds = 0;
  const domainCounts = {};

  for (const it of items) {
    const content = it.content?.rendered || "";
    const embeds = extractEmbeds(content);
    // nur "echte" Embeds (iframe/script/web-component/shortcode/table-link) zählen,
    // reine externe Info-Links rausfiltern, außer sie zeigen auf bekannte Anbieter
    const relevant = embeds.filter(
      (e) => !NOISE.test(e.url) && (e.tech !== "link" || e.provider !== null)
    );
    if (relevant.length) withEmbeds++;
    for (const e of relevant) {
      domainCounts[e.domain || e.url] = (domainCounts[e.domain || e.url] || 0) + 1;
      rows.push({
        type: it._type,
        id: it.id,
        title: (it.title?.rendered || "").replace(/&#0?38;|&amp;/g, "&").replace(/&#8211;/g, "–"),
        slug: it.slug,
        link: it.link,
        kategorie: categoryPath(it.categories, catMap),
        modified: it.modified,
        ...e,
      });
    }
  }

  writeFileSync(EMBEDS_FILE, JSON.stringify(rows, null, 2));
  console.log(`\nFertig. ${rows.length} Embeds in ${withEmbeds} Inhalten gefunden.`);
  console.log("Embeds gespeichert:", EMBEDS_FILE);

  console.log("\n=== Domain-Häufigkeit (Top 30) ===");
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([d, n]) => console.log(`  ${String(n).padStart(4)}  ${d}`));

  const unklarDomains = [...new Set(rows.filter((r) => !r.provider).map((r) => r.domain || r.url))];
  console.log(`\n=== Domains ohne Anbieter-Zuordnung (${unklarDomains.length}) — ggf. Whitelist ergänzen ===`);
  unklarDomains.slice(0, 40).forEach((d) => console.log("  -", d));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
