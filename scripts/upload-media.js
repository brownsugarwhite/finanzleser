#!/usr/bin/env node

/**
 * Lädt die optimierten WebP-Visuals (laut assets/webp/manifest.json) in die
 * WordPress-Mediathek und setzt Titel + Alt-Text. Für Titelbilder wird zusätzlich
 * der passende Beitrag gesucht und das Bild als featured_media gesetzt.
 *
 * Idempotent: existiert ein Medium mit gleichem Slug bereits, wird NICHT erneut
 * hochgeladen — nur der Alt-Text angeglichen (verhindert WP-Suffixe wie -1.webp).
 *
 * Auth: REST + Basic-Auth via Application Password. NICHTS wird gespeichert.
 *
 * Aufruf:
 *   WP_URL=https://staging.finanzleser.de \
 *   WP_USER='dein.user' \
 *   WP_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx' \
 *   node scripts/upload-media.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "assets", "webp", "manifest.json");
const RESULTS = path.join(ROOT, "assets", "webp", "upload-results.json");

const DRY_RUN = process.argv.includes("--dry-run");
const CATEGORIES_ONLY = process.argv.includes("--categories"); // nur Kategorie-Bilder
const GENERAL_ONLY = process.argv.includes("--general"); // nur general-Pool-Grafiken
const BASE_URL = (process.env.WP_URL || "").replace(/\/$/, "");
const USER = process.env.WP_USER || "";
const PASS = process.env.WP_APP_PASSWORD || "";

if (!BASE_URL || !USER || !PASS) {
  console.error("❌ Bitte WP_URL, WP_USER und WP_APP_PASSWORD als ENV setzen.");
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

// ── Helpers ───────────────────────────────────────────────────────────────

/** WP-style Slug (sanitize_title-ähnlich): Akzente entfernen, klein, Bindestriche. */
function wpSlugify(s) {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Deutsche Slug-Variante (ö→oe …) — manche WP-Installs transliterieren so. */
function deSlugify(s) {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Vergleichs-Key: nur alnum (für lockeren Title/Slug-Abgleich). */
function cmpKey(s) {
  return wpSlugify(s).replace(/-/g, "");
}

async function api(method, endpoint, { body, headers } = {}) {
  const res = await fetch(`${BASE_URL}/wp-json/wp/v2${endpoint}`, {
    method,
    headers: { Authorization: AUTH, ...headers },
    body,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    const msg = json && json.message ? json.message : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

/** Existierendes Medium per Slug finden (Slug = Dateiname ohne Endung). */
async function findExistingMedia(sanitizedName) {
  const list = await api("GET", `/media?slug=${encodeURIComponent(sanitizedName)}&per_page=5`);
  return Array.isArray(list) && list.length ? list[0] : null;
}

async function uploadBinary(absPath, filename) {
  const buffer = fs.readFileSync(absPath);
  return api("POST", "/media", {
    body: buffer,
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function setMeta(mediaId, title, altText) {
  return api("POST", `/media/${mediaId}`, {
    body: JSON.stringify({ title, alt_text: altText }),
    headers: { "Content-Type": "application/json" },
  });
}

/** Titelbild → Beitrag matchen. Liefert { post, reason } oder { post:null, reason }. */
async function matchPost(germanTopic) {
  const targetKey = cmpKey(germanTopic);

  // 1) exakter Slug-Treffer (beide Transliterations-Varianten probieren)
  const slugCandidates = [...new Set([wpSlugify(germanTopic), deSlugify(germanTopic)])];
  for (const cand of slugCandidates) {
    const bySlug = await api("GET", `/posts?slug=${encodeURIComponent(cand)}&status=any&per_page=5`);
    if (Array.isArray(bySlug) && bySlug.length === 1) {
      return { post: bySlug[0], reason: "slug-exakt" };
    }
  }

  // 2) Volltextsuche + lockerer Abgleich (Slug ODER Titel)
  const found = await api("GET", `/posts?search=${encodeURIComponent(germanTopic)}&status=any&per_page=20`);
  if (!Array.isArray(found) || found.length === 0) {
    return { post: null, reason: "kein Treffer" };
  }
  const matches = found.filter(
    (p) => cmpKey(p.slug || "") === targetKey || cmpKey((p.title && p.title.rendered) || "") === targetKey
  );
  if (matches.length === 1) return { post: matches[0], reason: "fuzzy-eindeutig" };
  if (matches.length > 1) return { post: null, reason: `mehrdeutig (${matches.length} Treffer)` };
  return { post: null, reason: `kein exakter Match (${found.length} Suchtreffer)` };
}

/** Aus Manifest-Source den deutschen Original-Topic ableiten (mit Umlaut). */
function germanTopicFromSource(sourceRel) {
  const base = path.basename(sourceRel, path.extname(sourceRel)).normalize("NFC");
  return base.replace(/^\d+[_\s]+/, "").replace(/[_\s]+/g, " ").trim();
}

// ── Hauptlauf ───────────────────────────────────────────────────────────────

async function main() {
  let manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (GENERAL_ONLY) manifest = manifest.filter((m) => m.type === "general");
  else if (CATEGORIES_ONLY) manifest = manifest.filter((m) => Boolean(m.termSlug));
  const tag = GENERAL_ONLY ? "[nur general] " : CATEGORIES_ONLY ? "[nur Kategorien] " : "";
  console.log(`${DRY_RUN ? "🧪 DRY-RUN  " : ""}${tag}Ziel: ${BASE_URL}  ·  ${manifest.length} Einträge\n`);

  const results = [];

  for (const item of manifest) {
    const absPath = path.join(ROOT, item.output);
    const filename = `${item.sanitizedName}.webp`;
    const entry = { sanitizedName: item.sanitizedName, type: item.type, termSlug: item.termSlug };

    try {
      // 1) Medium upload bzw. wiederverwenden
      let media = await findExistingMedia(item.sanitizedName);
      if (media) {
        entry.mediaId = media.id;
        entry.sourceUrl = media.source_url;
        const currentAlt = (media.alt_text || "").trim();
        if (currentAlt !== item.altText) {
          if (!DRY_RUN) await setMeta(media.id, item.title, item.altText);
          entry.action = "alt-aktualisiert";
        } else {
          entry.action = "übersprungen (existiert)";
        }
      } else if (DRY_RUN) {
        entry.action = "würde hochladen";
      } else {
        media = await uploadBinary(absPath, filename);
        await setMeta(media.id, item.title, item.altText);
        entry.mediaId = media.id;
        entry.sourceUrl = media.source_url;
        entry.action = "hochgeladen";
      }

      // 2) Titelbild → Beitrag als featured_media
      if (item.type === "titelbild") {
        const topic = germanTopicFromSource(item.source);
        const { post, reason } = await matchPost(topic);
        entry.postMatch = reason;
        if (post) {
          entry.postId = post.id;
          entry.postSlug = post.slug;
          if (entry.mediaId && !DRY_RUN) {
            await api("POST", `/posts/${post.id}`, {
              body: JSON.stringify({ featured_media: entry.mediaId }),
              headers: { "Content-Type": "application/json" },
            });
            entry.featuredSet = true;
          }
        }
      }

      const tag = item.type === "titelbild" ? `→ ${entry.postMatch || ""}${entry.postSlug ? " ·#" + entry.postId : ""}` : "";
      console.log(`✅ ${filename}  [${entry.action}]  ${tag}`);
    } catch (err) {
      entry.action = "FEHLER";
      entry.error = err.message;
      console.log(`❌ ${filename}: ${err.message}`);
    }
    results.push(entry);
  }

  if (!DRY_RUN) {
    // Upsert per sanitizedName: bei Teil-Läufen (--categories/--general) bleiben
    // alle übrigen Einträge erhalten, nur die berührten werden aktualisiert.
    let out = results;
    if (fs.existsSync(RESULTS)) {
      const prev = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
      const touched = new Set(results.map((r) => r.sanitizedName));
      out = [...prev.filter((r) => !touched.has(r.sanitizedName)), ...results];
    }
    fs.writeFileSync(RESULTS, JSON.stringify(out, null, 2) + "\n");
  }

  // ── Report ──
  const by = (a) => results.filter(a).length;
  console.log("\n── Zusammenfassung ──");
  console.log(`  hochgeladen:        ${by((r) => r.action === "hochgeladen")}`);
  console.log(`  würde hochladen:    ${by((r) => r.action === "würde hochladen")}`);
  console.log(`  existiert/aktual.:  ${by((r) => /übersprungen|aktualisiert/.test(r.action))}`);
  console.log(`  Fehler:             ${by((r) => r.action === "FEHLER")}`);

  const titel = results.filter((r) => r.type === "titelbild");
  const matched = titel.filter((r) => r.postId);
  console.log(`\n  Titelbilder gematcht: ${matched.length}/${titel.length}`);
  const unmatched = titel.filter((r) => !r.postId);
  if (unmatched.length) {
    console.log(`  ⚠️  Nicht zugeordnet (manuell prüfen):`);
    unmatched.forEach((r) => console.log(`     • ${r.sanitizedName} — ${r.postMatch}`));
  }
  if (!DRY_RUN) console.log(`\n  Ergebnis: ${path.relative(ROOT, RESULTS)}`);

  if (by((r) => r.action === "FEHLER") > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ Abbruch:", err);
  process.exit(1);
});
