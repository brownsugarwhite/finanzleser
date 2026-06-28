// Verteilt die NEUEN Vergleiche auf die passenden Staging-Beiträge.
// Aktionen pro Eintrag: insert (anhängen), replace (generischen Block ersetzen),
// add (zusätzlich anhängen, auch wenn schon ein anderer Vergleich drin ist).
// Idempotent: ist der CPT-Slug schon im Beitrag, wird übersprungen.
//
// Lauf: WP_SEED_USER=… WP_SEED_APP=… node scripts/apply-vergleich-distribution.mjs [--dry]

const BASE = "https://staging.finanzleser.de";
const USER = process.env.WP_SEED_USER, APP = process.env.WP_SEED_APP;
const DRY = process.argv.includes("--dry");
if (!USER || !APP) { console.error("WP_SEED_USER/WP_SEED_APP setzen"); process.exit(1); }
const AUTH = "Basic " + Buffer.from(`${USER}:${APP}`).toString("base64");

// post = Artikel-Slug; cpt = Vergleich-CPT-Slug; action; replace = zu ersetzender CPT-Slug
const PLAN = [
  // — saubere Einfügungen in leere Artikel —
  { post: "berufsunfaehigkeitsversicherung", cpt: "berufsunfaehigkeitsversicherung-vergleich", action: "insert" },
  { post: "cyberversicherung", cpt: "cyberversicherung-vergleich", action: "insert" },
  { post: "wertpapierdepot", cpt: "depot-vergleich", action: "insert" },
  { post: "girokonto", cpt: "girokonto-vergleich", action: "insert" },
  { post: "kreditkarte", cpt: "kreditkarten-vergleich", action: "insert" },
  { post: "pferdeversicherung", cpt: "pferdekrankenversicherung-vergleich", action: "insert" },
  { post: "sterbegeldversicherung", cpt: "sterbegeldversicherung-vergleich", action: "insert" },
  { post: "zahnzusatzversicherung", cpt: "zahnzusatzversicherung-vergleich", action: "insert" },
  { post: "hunde-op-versicherung", cpt: "hundekrankenversicherung-vergleich", action: "insert" },
  { post: "kredite", cpt: "minikredit-vergleich", action: "insert" },
  // — generischen Privathaftpflicht-Platzhalter durch spezifischen ersetzen —
  { post: "bauherrenhaftpflichtversicherung", cpt: "bauherren-haftpflichtversicherung-vergleich", action: "replace", replace: "private-haftpflichtversicherung-vergleich" },
  { post: "hundehaftpflichtversicherung", cpt: "hundehaftpflicht-vergleich", action: "replace", replace: "private-haftpflichtversicherung-vergleich" },
  { post: "drohnenhaftpflichtversicherung", cpt: "drohnenversicherung-vergleich", action: "replace", replace: "private-haftpflichtversicherung-vergleich" },
  // — komplementär zusätzlich zum Preisvergleich —
  { post: "unfallversicherung", cpt: "unfallversicherung-leistungen", action: "add" },
  // — bisher unplatzierte Bestands-Vergleiche mit klarem Heimat-Artikel —
  { post: "hausbesitzerhaftpflichtversicherung", cpt: "haus-und-grundbesitzerhaftpflicht-vergleich", action: "replace", replace: "private-haftpflichtversicherung-vergleich" },
  { post: "photovoltaik-foerderung", cpt: "photovoltaik-versicherung-vergleich", action: "insert" },
  { post: "kredite", cpt: "ratenkredit-vergleich", action: "add" },
  // — die 7 „Nischen" über breitere Themen-Zuordnung (2026-06-14, User-Wunsch) —
  { post: "kfz-versicherung", cpt: "autokredit-vergleich", action: "add" },
  { post: "hausratversicherung", cpt: "elektronikversicherung-vergleich", action: "add" },
  { post: "girokonto", cpt: "geschaeftskonto-vergleich", action: "add" },
  { post: "direktbank-vs-filialbank", cpt: "geschaeftskonto-vergleich", action: "add" },
  { post: "wohnungskuendigung", cpt: "mietkaution-rechner", action: "insert" },
  { post: "renteninformation", cpt: "rentenlueckenrechner", action: "insert" },
  { post: "gesetzliche-rente", cpt: "rentenlueckenrechner", action: "insert" },
  { post: "rentenarten", cpt: "rentenlueckenrechner", action: "insert" },
  { post: "rentenbeitrag", cpt: "rentenlueckenrechner", action: "insert" },
  { post: "studenten-krankenversicherung", cpt: "studentenkonto-vergleich", action: "insert" },
  { post: "kfw-studienkredit", cpt: "studentenkonto-vergleich", action: "add" },
  { post: "kreditkarte", cpt: "studentenkreditkarte-vergleich", action: "add" },
  { post: "kfw-studienkredit", cpt: "studentenkreditkarte-vergleich", action: "add" },
  { post: "studenten-krankenversicherung", cpt: "studentenkreditkarte-vergleich", action: "add" },
];

// Ohne passenden Artikel (nur Report, NICHT eingefügt):
const NO_HOME = [];

const block = (slug) => `<!-- wp:finanzleser/vergleich {"slug":"${slug}"} -->\n<div data-finanzleser-vergleich="${slug}"></div>\n<!-- /wp:finanzleser/vergleich -->`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(url, opts = {}, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, opts);
      if (r.ok) return r;
      if (i === tries - 1) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(800 * (i + 1));
  }
}
async function getPost(slug) {
  const r = await fetchRetry(`${BASE}/wp-json/wp/v2/posts?slug=${slug}&status=any&context=edit&_fields=id,content`, { headers: { Authorization: AUTH } });
  const a = await r.json();
  return a[0] || null;
}
async function putContent(id, content) {
  await fetchRetry(`${BASE}/wp-json/wp/v2/posts/${id}`, { method: "POST", headers: { Authorization: AUTH, "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
}

async function main() {
  console.log(`Ziel: ${BASE}${DRY ? "  (DRY)" : ""}\n`);
  let done = 0, skipped = 0, missing = 0;
  for (const step of PLAN) {
    const p = await getPost(step.post);
    if (!p) { console.log(`✗ FEHLT Artikel '${step.post}' → ${step.cpt}`); missing++; continue; }
    let raw = p.content.raw;

    if (raw.includes(`"${step.cpt}"`) || raw.includes(`data-finanzleser-vergleich="${step.cpt}"`)) {
      console.log(`• schon drin: ${step.post} ← ${step.cpt}`); skipped++; continue;
    }

    if (step.action === "replace") {
      const re = new RegExp(`<!-- wp:finanzleser/vergleich \\{"slug":"${step.replace}"\\} -->[\\s\\S]*?<!-- /wp:finanzleser/vergleich -->`);
      if (!re.test(raw)) { console.log(`⚠ ${step.post}: erwarteter Block '${step.replace}' nicht gefunden → hänge stattdessen an`); raw = raw.trimEnd() + "\n\n" + block(step.cpt); }
      else raw = raw.replace(re, block(step.cpt));
    } else {
      raw = raw.trimEnd() + "\n\n" + block(step.cpt);
    }

    const verb = step.action === "replace" ? `REPLACE (${step.replace}→${step.cpt})` : step.action === "add" ? "ADD" : "INSERT";
    if (DRY) { console.log(`${verb}: ${step.post}`); done++; continue; }
    await putContent(p.id, raw);
    console.log(`✓ ${verb}: ${step.post} (id ${p.id})`);
    done++;
    await sleep(400);
  }
  console.log(`\nFertig. Bearbeitet: ${done} | übersprungen(schon drin): ${skipped} | Artikel fehlt: ${missing}`);
  console.log(`\nOHNE passenden Artikel (manuell platzieren / Artikel anlegen):\n  ${NO_HOME.join("\n  ")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
