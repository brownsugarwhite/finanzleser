// Mapping: welcher Vergleich-CPT gehört in welchen Beitrag (Staging).
// Liest /tmp/staging-posts.json (slug -> {id, vergleiche[]}) + master.
// Ausgabe: scripts/data/vergleiche-verteilung.json + Konsolen-Review.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));

const posts = JSON.parse(readFileSync("/tmp/staging-posts.json", "utf-8"));
const master = JSON.parse(readFileSync(join(__dirname, "data", "vergleiche-master.json"), "utf-8"));

const norm = (s) => s.toLowerCase().replace(/vergleich/g, "").replace(/rechner/g, "").replace(/[^a-z]/g, "");
const postNorm = {};
for (const p of Object.keys(posts)) postNorm[p] = norm(p);

// Manuelle Ziel-Overrides für Fälle ohne klaren Slug-Match
const TARGET_OVERRIDE = {
  "mietkaution-rechner": "mietkaution",
  "rentenlueckenrechner": "rentenluecke",
  "unfallversicherung-leistungen": "unfallversicherung",
  "hundehaftpflicht-vergleich": "hundehaftpflichtversicherung",
  "depot-vergleich": "depot",
  "girokonto-vergleich": "girokonto",
  "kreditkarten-vergleich": "kreditkarte",
  "minikredit-vergleich": "minikredit",
  "studentenkonto-vergleich": "studentenkonto",
  "studentenkreditkarte-vergleich": "studentenkreditkarte",
  "geschaeftskonto-vergleich": "geschaeftskonto",
};

function findTargets(cpt) {
  if (TARGET_OVERRIDE[cpt.slug]) {
    const t = TARGET_OVERRIDE[cpt.slug];
    if (posts[t]) return { targets: [t], kind: "override" };
    // override-stem fuzzy
    const ns = norm(t);
    const cand = Object.keys(posts).filter((p) => postNorm[p] === ns || postNorm[p].includes(ns) || ns.includes(postNorm[p]));
    if (cand.length) return { targets: cand, kind: "override~" };
    return { targets: [], kind: "KEIN (override fehlt)" };
  }
  const stem = norm(cpt.slug);
  const exact = Object.keys(posts).filter((p) => postNorm[p] === stem);
  if (exact.length) return { targets: exact, kind: "exakt" };
  const cont = Object.keys(posts)
    .filter((p) => stem && (postNorm[p].includes(stem) || stem.includes(postNorm[p])) && Math.abs(postNorm[p].length - stem.length) <= 6)
    .sort((a, b) => Math.abs(postNorm[a].length - stem.length) - Math.abs(postNorm[b].length - stem.length));
  if (cont.length) return { targets: cont, kind: "teil" };
  return { targets: [], kind: "KEIN" };
}

const existing = new Set(master.filter((m) => m.existing).map((m) => m.slug));
const result = [];
console.log("SLUG".padEnd(42), "KIND".padEnd(12), "ZIEL (Status)");
for (const m of [...master].sort((a, b) => a.slug.localeCompare(b.slug))) {
  if (existing.has(m.slug)) continue; // nur neue + restored
  const { targets, kind } = findTargets(m);
  const target = targets[0] || null;
  let status = "—";
  if (target) {
    const cur = posts[target].vergleiche;
    status = cur.includes(m.slug) ? "schon drin" : cur.length ? "⚠ hat: " + cur.join(",") : "leer→einfügen";
  }
  result.push({ cpt: m.slug, target, postId: target ? posts[target].id : null, kind, status, alt: targets.slice(1, 3) });
  console.log(m.slug.padEnd(42), kind.padEnd(12), target ? `${target} (${status})` : "— kein Artikel —", m.slug in TARGET_OVERRIDE ? "" : "", (targets.length > 1 ? "  alt: " + targets.slice(1, 3).join(",") : ""));
}
writeFileSync(join(__dirname, "data", "vergleiche-verteilung.json"), JSON.stringify(result, null, 2));
console.log("\nGeschrieben: scripts/data/vergleiche-verteilung.json");
const ok = result.filter((r) => r.target && r.status === "leer→einfügen").length;
const drin = result.filter((r) => r.status === "schon drin").length;
const konflikt = result.filter((r) => r.target && r.status.startsWith("⚠")).length;
const kein = result.filter((r) => !r.target).length;
console.log(`\nEinfügbar (leerer Artikel): ${ok} | schon drin: ${drin} | Konflikt (anderer Block): ${konflikt} | kein Artikel: ${kein}`);
