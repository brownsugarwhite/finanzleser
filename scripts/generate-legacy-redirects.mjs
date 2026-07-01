// Generiert die 301/308-Redirect-Map für die Legacy-Flach-URLs, die im neuen
// System sonst 404 liefern (~645). Quelle-Wahrheit:
//   - Legacy-URLs: live Yoast-Sitemap von www.finanzleser.de
//   - Neue Inhalte: REST der neuen WP-Instanz (staging.finanzleser.de)
//
// Ausgabe:
//   scripts/output/legacy-redirects.json   → { source, destination, rule, confidence }[]
//   scripts/output/legacy-redirects.review.txt → menschenlesbarer Report + UNMAPPED-Liste
//
// Die Post-Slugs (202 auflösbare) werden NICHT hier behandelt — die erledigt der
// permanentRedirect im Flach-Resolver (app/[kategorie]/page.tsx) automatisch.
//
// Nutzung:  node scripts/generate-legacy-redirects.mjs
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const LEGACY = "https://www.finanzleser.de";
const NEW = "https://staging.finanzleser.de";
const OUT_JSON = "scripts/output/legacy-redirects.json";
const OUT_REVIEW = "scripts/output/legacy-redirects.review.txt";
const OUT_MODULE = "lib/redirects.generated.ts";

// Bestehende Redirect-Sources aus next.config.ts einlesen, damit wir keine Doppler erzeugen.
function existingSources() {
  const set = new Set();
  try {
    const cfg = readFileSync("next.config.ts", "utf8");
    for (const m of cfg.matchAll(/source:\s*"\/([^"]+)"/g)) set.add(m[1]);
  } catch { /* ignore */ }
  return set;
}

// Topische Fallback-Kategorie per Keyword — damit NICHTS 404t, wenn kein exaktes Ziel
// gefunden wird. Bewusst grob; alle Fallbacks sind "low confidence" = im Review verfeinern.
function fallbackCategory(slug) {
  const s = slug;
  if (/steuer|absetzen|elster|elstam|abschreibung|gehaltsabrechnung|lohn|freibetrag/.test(s)) return "/steuern";
  if (/versicherung|kranken|pflege|rente|berufsunfaehig|erwerbs|beitragsbemessung|beitragssaetze|vorsorge|riester|basisrente/.test(s)) return "/versicherungen";
  if (/kredit|darlehen|bau|baukredit|geldanlage|fonds|aktien|depot|bauspar|zins|finanzierung|hypothek/.test(s)) return "/finanzen";
  if (/recht|erb|testament|vollmacht|betreuung|patientenverfuegung|pfaend|unterhalt/.test(s)) return "/recht";
  return null; // → wird als echtes UNMAPPED gelistet (kein Blind-Redirect auf /)
}

async function legacyFlatSlugs() {
  const idx = await (await fetch(`${LEGACY}/sitemap_index.xml`)).text();
  const postMaps = [...idx.matchAll(/https:\/\/www\.finanzleser\.de\/[a-z0-9-]*post-sitemap\d*\.xml/g)].map((m) => m[0]);
  const slugs = new Set();
  for (const sm of postMaps) {
    const xml = await (await fetch(sm)).text();
    for (const m of xml.matchAll(/<loc>https:\/\/www\.finanzleser\.de\/([^<]+?)\/?<\/loc>/g)) {
      const s = m[1];
      if (!s.includes("/")) slugs.add(s); // nur flache Single-Segment-Slugs
    }
  }
  return slugs;
}

async function restSlugs(type) {
  const out = new Set();
  const first = await fetch(`${NEW}/wp-json/wp/v2/${type}?per_page=100&_fields=slug`);
  const pages = Number(first.headers.get("x-wp-totalpages") || "1");
  const push = (arr) => arr.forEach((r) => r.slug && out.add(r.slug));
  push(await first.json());
  for (let p = 2; p <= pages; p++) {
    push(await (await fetch(`${NEW}/wp-json/wp/v2/${type}?per_page=100&page=${p}&_fields=slug`)).json());
  }
  return out;
}

function longestInsurerPrefix(slug, insurers) {
  let best = null;
  for (const ins of insurers) {
    if ((slug === ins || slug.startsWith(ins + "-")) && (!best || ins.length > best.length)) best = ins;
  }
  return best;
}

async function main() {
  const [legacy, posts, anbieter, dokument, checkliste, rechner, vergleich] = await Promise.all([
    legacyFlatSlugs(),
    restSlugs("posts"),
    restSlugs("anbieter"),
    restSlugs("dokument"),
    restSlugs("checkliste"),
    restSlugs("rechner"),
    restSlugs("vergleich"),
  ]);

  // Auflösbar am Flach-Pfad = Post (→ Resolver-Redirect) oder Anbieter (rendert flach)
  // oder bereits in next.config.ts als Redirect vorhanden.
  const existing = existingSources();
  const resolvable = new Set([...posts, ...anbieter]);
  const dead = [...legacy].filter((s) => !resolvable.has(s) && !existing.has(s)).sort();

  // Versicherer-Präfixe aus Anbieter-Slugs ableiten (Suffixe abschneiden).
  const insurers = new Set();
  for (const a of anbieter) {
    const ins = a
      .replace(/-versicherung-kontakt$/, "")
      .replace(/-kontakt$/, "");
    if (ins) insurers.add(ins);
  }
  const anbieterBest = (insurer) =>
    anbieter.has(`${insurer}-versicherung-kontakt`)
      ? `${insurer}-versicherung-kontakt`
      : [...anbieter].find((a) => a.startsWith(insurer + "-")) || null;

  // Manuelle Ziele für sonst mehrdeutige Slugs (vom Entwickler bestätigt).
  const MANUAL = {
    "kindergeldauszahlung": "/finanzen",
    "neue-gesetze-und-regelungen-ab-januar-2026-das-aendert-sich": "/steuern",
    "wohnmobilkauf-worauf-sie-vor-dem-kauf-achten-sollten": "/versicherungen",
  };

  const redirects = [];
  const unmapped = [];
  const add = (source, destination, rule, confidence) =>
    redirects.push({ source: `/${source}`, destination, rule, confidence });

  for (const slug of dead) {
    if (MANUAL[slug]) { add(slug, MANUAL[slug], "manual", "high"); continue; }
    // 1) Vergleich
    if (slug.endsWith("-vergleich") && vergleich.has(slug)) {
      add(slug, `/finanztools/vergleiche/${slug}`, "vergleich-exact", "high");
      continue;
    }
    // 2) Rechner (exact, -rechner strip, rechner strip)
    if (slug.endsWith("rechner")) {
      const cand = [slug, slug.replace(/-rechner$/, ""), slug.replace(/rechner$/, "")].filter(Boolean);
      const hit = cand.find((c) => rechner.has(c));
      if (hit) { add(slug, `/finanztools/rechner/${hit}`, "rechner-match", "high"); continue; }
    }
    // 3) PDF → Dokument
    if (slug.startsWith("pdf-") || slug.endsWith("-pdf")) {
      const stripped = slug.replace(/^pdf-/, "").replace(/-pdf$/, "");
      const hit = dokument.has(stripped) ? stripped : [...dokument].find((d) => d.includes(stripped) || stripped.includes(d));
      if (hit) { add(slug, `/dokumente/${hit}`, "pdf-dokument", hit === stripped ? "high" : "medium"); continue; }
    }
    // 4) Checkliste
    if (slug.startsWith("checkliste-")) {
      const stripped = slug.replace(/^checkliste-/, "");
      const hit = checkliste.has(stripped)
        ? stripped
        : [...checkliste].find((c) => stripped.startsWith(c) || c.startsWith(stripped) || stripped.includes(c));
      if (hit) { add(slug, `/finanztools/checklisten/${hit}`, "checkliste-match", hit === stripped ? "high" : "low"); continue; }
    }
    // 5) Kündigen → Anbieter-Kontaktseite des Versicherers
    if (slug.endsWith("-kuendigen")) {
      const ins = longestInsurerPrefix(slug.replace(/-kuendigen$/, ""), insurers);
      const dest = ins && anbieterBest(ins);
      if (dest) { add(slug, `/${dest}`, "kuendigen-anbieter", "medium"); continue; }
    }
    // 6) Typ-Fallbacks (kein exaktes Ziel, aber klarer Bereich)
    if (slug.endsWith("rechner")) { add(slug, "/finanztools/rechner", "rechner-fallback", "low"); continue; }
    if (slug.endsWith("vergleich")) { add(slug, "/finanztools/vergleiche", "vergleich-fallback", "low"); continue; }
    if (slug.startsWith("checkliste-")) { add(slug, "/finanztools/checklisten", "checkliste-fallback", "low"); continue; }
    if (slug.startsWith("pdf-") || slug.endsWith("-pdf")) { add(slug, "/dokumente", "pdf-fallback", "low"); continue; }
    if (slug.endsWith("-kuendigen")) { add(slug, "/versicherungen", "kuendigen-fallback", "low"); continue; }
    // 7) Topische Kategorie per Keyword
    const cat = fallbackCategory(slug);
    if (cat) { add(slug, cat, "category-fallback", "low"); continue; }
    // 8) Wirklich kein Ziel → manuelle Entscheidung (kein Blind-Redirect)
    unmapped.push(slug);
  }

  // Report
  const byRule = {};
  for (const r of redirects) byRule[r.rule] = (byRule[r.rule] || 0) + 1;
  const byConf = {};
  for (const r of redirects) byConf[r.confidence] = (byConf[r.confidence] || 0) + 1;

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(redirects, null, 2));

  // TS-Modul für next.config.ts (nur source→destination, alle permanent 301).
  const mod =
    `// AUTO-GENERIERT von scripts/generate-legacy-redirects.mjs — nicht von Hand editieren.\n` +
    `// Legacy-Flach-URL-Redirects (301) für Beiträge/Tools, die im neuen System sonst 404en.\n` +
    `// Review-Details: scripts/output/legacy-redirects.review.txt\n` +
    `import type { Redirect } from "next/dist/lib/load-custom-routes";\n\n` +
    `export const legacyRedirects: Redirect[] = ${JSON.stringify(
      redirects.map((r) => ({ source: r.source, destination: r.destination, permanent: true })),
      null,
      2
    )};\n`;
  writeFileSync(OUT_MODULE, mod);

  const lines = [];
  lines.push(`Legacy flache Slugs gesamt: ${legacy.size}`);
  lines.push(`Am Flach-Pfad auflösbar (Post→Resolver-301 / Anbieter): ${legacy.size - dead.length}`);
  lines.push(`404-Kandidaten (brauchen Redirect): ${dead.length}`);
  lines.push(`Automatisch gemappt: ${redirects.length}`);
  lines.push(`UNMAPPED (manuell entscheiden): ${unmapped.length}`);
  lines.push("");
  lines.push("Nach Regel: " + JSON.stringify(byRule));
  lines.push("Nach Confidence: " + JSON.stringify(byConf));
  lines.push("");
  lines.push("=== LOW/MEDIUM confidence (bitte prüfen) ===");
  for (const r of redirects.filter((r) => r.confidence !== "high"))
    lines.push(`[${r.confidence}] ${r.source}  ->  ${r.destination}   (${r.rule})`);
  lines.push("");
  lines.push("=== UNMAPPED (kein Auto-Ziel gefunden) ===");
  unmapped.forEach((s) => lines.push(`/${s}`));
  writeFileSync(OUT_REVIEW, lines.join("\n"));

  console.log(lines.slice(0, 10).join("\n"));
  console.log(`\n→ ${OUT_JSON}\n→ ${OUT_REVIEW}\n→ ${OUT_MODULE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
