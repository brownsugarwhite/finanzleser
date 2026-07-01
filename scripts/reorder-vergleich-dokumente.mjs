// Sortiert in Beiträgen, die BEIDE Block-Typen enthalten, alle finanzleser/vergleich-
// Blöcke direkt VOR den ersten finanzleser/dokumente-Block (Vergleich immer über Dokumenten).
// Idempotent (skip, wenn bereits korrekt). Staging-REST.
// Lauf: WP_SEED_USER=… WP_SEED_APP=… node scripts/reorder-vergleich-dokumente.mjs [--dry]

const BASE = "https://staging.finanzleser.de";
const USER = process.env.WP_SEED_USER, APP = process.env.WP_SEED_APP;
const DRY = process.argv.includes("--dry");
if (!USER || !APP) { console.error("WP_SEED_USER/WP_SEED_APP setzen"); process.exit(1); }
const AUTH = "Basic " + Buffer.from(`${USER}:${APP}`).toString("base64");

// Ein vollständiger Block (paariger Kommentar+Div ODER self-closing)
const blockRe = (type) =>
  new RegExp(`<!-- wp:finanzleser/${type}\\b[\\s\\S]*?<!-- /wp:finanzleser/${type} -->|<!-- wp:finanzleser/${type}\\b[^>]*?/-->`, "g");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fetchRetry(url, opts = {}, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, opts); if (r.ok) return r; if (i === tries - 1) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`); }
    catch (e) { if (i === tries - 1) throw e; }
    await sleep(800 * (i + 1));
  }
}

function reorder(content) {
  const vergAll = [...content.matchAll(blockRe("vergleich"))];
  const dokAll = [...content.matchAll(blockRe("dokumente"))];
  if (!vergAll.length || !dokAll.length) return null; // nicht beide → nichts zu tun
  const dokIndex = dokAll[0].index;
  const anyAfter = vergAll.some((m) => m.index > dokIndex);
  if (!anyAfter) return null; // alle Vergleiche stehen schon vor Dokumente

  const vergStrings = vergAll.map((m) => m[0]);
  // alle Vergleich-Blöcke entfernen, überflüssige Leerzeilen glätten
  let next = content.replace(blockRe("vergleich"), "").replace(/\n{3,}/g, "\n\n");
  const dm = [...next.matchAll(blockRe("dokumente"))][0];
  if (!dm) return null;
  const at = dm.index;
  next = next.slice(0, at) + vergStrings.join("\n\n") + "\n\n" + next.slice(at);
  return next;
}

async function main() {
  console.log(`Ziel: ${BASE}${DRY ? "  (DRY)" : ""}\n`);
  // alle published Posts holen
  const posts = [];
  let page = 1;
  for (;;) {
    const r = await fetchRetry(`${BASE}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish&context=edit&_fields=id,slug,content`, { headers: { Authorization: AUTH } });
    const batch = await r.json();
    posts.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  console.log(`${posts.length} Beiträge geladen.\n`);

  let changed = 0, ok = 0;
  for (const p of posts) {
    const raw = p.content?.raw || "";
    const next = reorder(raw);
    if (!next) continue;
    changed++;
    if (DRY) { console.log(`REORDER ${p.slug} (id ${p.id})`); continue; }
    await fetchRetry(`${BASE}/wp-json/wp/v2/posts/${p.id}`, { method: "POST", headers: { Authorization: AUTH, "Content-Type": "application/json" }, body: JSON.stringify({ content: next }) });
    console.log(`✓ REORDER ${p.slug} (id ${p.id})`);
    ok++;
    await sleep(400);
  }
  console.log(`\nFertig. ${DRY ? "Zu ändern" : "Geändert"}: ${changed}${DRY ? "" : ` (${ok} ok)`}.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
