// Seedet alle Vergleiche aus scripts/data/vergleiche-master.json als vergleich-CPT
// auf dem Ziel-WordPress (Default: Staging). Die Embed-Config wird als
// finanzleser/vergleich-quelle-Block in den post_content geschrieben:
//   <!-- wp:finanzleser/vergleich-quelle {"config":"<b64>"} -->
//   <div data-fl-vergleich-src data-config="<b64>"></div>
//   <!-- /wp:finanzleser/vergleich-quelle -->
//
// Bestehende CPTs: nur Config-Block (content) aktualisieren, Titel/Excerpt/Slug bleiben.
// Neue CPTs: anlegen (status aus master: publish | draft).
//
// Lauf:
//   WP_SEED_USER="flofre.BCN" WP_SEED_APP="xxxx ..." \
//   node scripts/seed-vergleiche.mjs [--base https://staging.finanzleser.de] [--dry]

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const master = JSON.parse(readFileSync(join(__dirname, "data", "vergleiche-master.json"), "utf-8"));

const argBase = process.argv.indexOf("--base");
const BASE = (argBase > -1 ? process.argv[argBase + 1] : "https://staging.finanzleser.de").replace(/\/$/, "");
const DRY = process.argv.includes("--dry");
const USER = process.env.WP_SEED_USER;
const APP = process.env.WP_SEED_APP;
if (!USER || !APP) {
  console.error("Fehlt: WP_SEED_USER und WP_SEED_APP als Umgebungsvariablen setzen.");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${USER}:${APP}`).toString("base64");

function configFor(m) {
  const c = { embedType: m.embedType };
  if (m.iframeUrl) c.iframeUrl = m.iframeUrl;
  if (m.scriptConfig) c.scriptConfig = m.scriptConfig;
  if (m.rawHtml) c.rawHtml = m.rawHtml;
  return c;
}

function contentBlock(m) {
  const b64 = Buffer.from(JSON.stringify(configFor(m))).toString("base64");
  // Dynamischer Block (save()=null, PHP render_callback gibt den Config-Div aus).
  // Self-closing → kein Inner-HTML → keine Editor-Validierungswarnung.
  return `<!-- wp:finanzleser/vergleich-quelle {"config":"${b64}"} /-->`;
}

function excerptFor(m) {
  if (m.desc) return m.desc;
  const t = m.title || m.slug;
  return `Vergleichen Sie ${t} und finden Sie schnell das passende Angebot verschiedener Anbieter.`;
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}/wp-json/wp/v2${path}`, {
    ...opts,
    headers: { Authorization: AUTH, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function fetchExisting() {
  const map = {};
  let page = 1;
  for (;;) {
    const res = await fetch(`${BASE}/wp-json/wp/v2/vergleich?per_page=100&page=${page}&status=any&_fields=id,slug,status`, {
      headers: { Authorization: AUTH },
    });
    if (!res.ok) break;
    const batch = await res.json();
    for (const p of batch) map[p.slug] = p;
    if (batch.length < 100) break;
    page++;
  }
  return map;
}

async function main() {
  console.log(`Ziel: ${BASE}${DRY ? "  (DRY RUN)" : ""}`);
  const existing = await fetchExisting();
  console.log(`Bestehende vergleich-CPTs: ${Object.keys(existing).length}\n`);

  let created = 0, updated = 0, skipped = 0;
  for (const m of master) {
    const content = contentBlock(m);
    const ex = existing[m.slug];
    if (ex) {
      // content immer; excerpt NUR wenn master eine Beschreibung trägt (= neue
      // Vergleiche). Bestehende 23 haben kein desc → ihr kuratierter Textauszug bleibt.
      const body = m.desc ? { content, excerpt: m.desc } : { content };
      if (DRY) { console.log(`UPDATE  ${m.slug} (id ${ex.id})${m.desc ? " +excerpt" : ""}`); updated++; continue; }
      await api(`/vergleich/${ex.id}`, { method: "POST", body: JSON.stringify(body) });
      console.log(`✓ UPDATE  ${m.slug} (id ${ex.id}) [${m.embedType}]${m.desc ? " +excerpt" : ""}`);
      updated++;
    } else {
      const body = {
        title: m.title || m.slug,
        slug: m.slug,
        status: m.status || "publish",
        content,
        excerpt: excerptFor(m),
      };
      if (DRY) { console.log(`CREATE  ${m.slug} [${m.status}] [${m.embedType}]`); created++; continue; }
      const r = await api(`/vergleich`, { method: "POST", body: JSON.stringify(body) });
      console.log(`✓ CREATE  ${m.slug} (id ${r.id}) [${m.status}] [${m.embedType}]`);
      created++;
    }
  }

  console.log(`\nFertig. Erstellt: ${created} | Aktualisiert: ${updated} | Übersprungen: ${skipped}`);
  const drafts = master.filter((m) => m.status === "draft").map((m) => m.slug);
  if (drafts.length) console.log(`\n⚠ Als Entwurf (bitte im Backend prüfen & ggf. veröffentlichen):\n  ${drafts.join("\n  ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
