#!/usr/bin/env node

/**
 * Fügt in alle Beiträge einen core/latest-posts Gutenberg-Block ein,
 * der automatisch mit den Kategorien des jeweiligen Beitrags vorbefüllt ist
 * (10 neueste Beiträge aus der gleichen Kategorie).
 *
 * Usage:
 *   node scripts/update-beitraege-related-block.js --dry-run
 *   node scripts/update-beitraege-related-block.js --slug <s>
 *   node scripts/update-beitraege-related-block.js --limit N
 *   node scripts/update-beitraege-related-block.js --force
 */

const { execSync } = require("child_process");
const fs = require("fs");

const articles = require("./articles-converted.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};

const DRY = flag("--dry-run");
const ONLY_SLUG = val("--slug");
const LIMIT = val("--limit") ? parseInt(val("--limit")) : null;
const FORCE = flag("--force");

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function wpSafe(cmd) {
  try { return wp(cmd); } catch (e) { return null; }
}

/**
 * Baut den Gutenberg core/latest-posts Block-Kommentar.
 * Self-closing Block (dynamic block, wird WP-seitig gerendert; wir parsen ihn im Next.js).
 *
 * Attribute:
 *   postsToShow: Anzahl (default 10)
 *   categories: Array von {id, slug} Objekten (GB-Core Format)
 *   orderBy: "date"
 *   order: "desc"
 *   displayFeaturedImage: false (wir rendern sowieso via ArticleSlider)
 */
function buildLatestPostsBlock(categories, count = 10) {
  const attrs = {
    postsToShow: count,
    categories: categories.map((c) => ({ id: c.id, value: c.name })),
    orderBy: "date",
    order: "desc",
    displayFeaturedImage: false,
  };
  return `<!-- wp:latest-posts ${JSON.stringify(attrs)} /-->`;
}

/**
 * Wählt die "beste" Kategorie für den Block:
 * Bevorzugt eine Sub-Kategorie (parent != 0). Wenn keine, nimm die erste.
 */
function pickBestCategories(terms) {
  if (terms.length === 0) return [];
  // Filter: keine "Dokumente", "Checklisten", "Anbieter" etc. (technische Kategorien)
  const SKIP_SLUGS = new Set(["anbieter", "checkliste", "checklisten", "dokumente"]);
  const filtered = terms.filter((t) => !SKIP_SLUGS.has(t.slug));
  if (filtered.length === 0) return [];

  // Prefer Sub-Kategorien (parent != 0)
  const subs = filtered.filter((t) => parseInt(t.parent, 10) !== 0);
  if (subs.length > 0) return subs.slice(0, 1); // Nur die erste Subcat
  return filtered.slice(0, 1);
}

function injectBlock(content, block, force) {
  const pattern = /<!-- wp:latest-posts[\s\S]*?\/-->/;
  if (pattern.test(content)) {
    if (!force) return { content, action: "skipped-existing" };
    return { content: content.replace(pattern, block), action: "replaced" };
  }
  // Nach FAQ-Block einfügen, falls vorhanden
  const faqEnd = /<!-- \/wp:yoast\/faq-block -->/;
  if (faqEnd.test(content)) {
    return {
      content: content.replace(faqEnd, (m) => `${m}\n\n${block}`),
      action: "after-faq",
    };
  }
  return { content: content + "\n\n" + block, action: "end" };
}

// ─── Run ───

let toProcess = articles;
if (ONLY_SLUG) {
  toProcess = toProcess.filter((a) => a.slug === ONLY_SLUG);
  if (toProcess.length === 0) {
    console.error(`❌ Kein Artikel mit slug=${ONLY_SLUG}`);
    process.exit(1);
  }
}
if (LIMIT) toProcess = toProcess.slice(0, LIMIT);

console.log(`\n🔧 Related-Posts-Block Injection`);
console.log(`   Modus:        ${DRY ? "DRY-RUN" : "LIVE"}${FORCE ? " (force)" : ""}`);
console.log(`   Zu verarbeiten: ${toProcess.length}/${articles.length}\n`);

let ok = 0, skip = 0, errors = 0;

for (const article of toProcess) {
  const slug = article.slug;
  try {
    const idRaw = wpSafe(`post list --name="${slug}" --post_type=post --post_status=any --field=ID --format=ids`);
    if (!idRaw) {
      console.log(`⚠️  ${slug}: nicht in WP gefunden`);
      errors++;
      continue;
    }
    const id = idRaw.trim().split(/\s+/)[0];

    // Kategorien des Posts holen
    const termsJson = wpSafe(`post term list ${id} category --fields=term_id,name,slug,parent --format=json`);
    if (!termsJson) {
      console.log(`⚠️  ${slug}: keine Kategorien`);
      skip++;
      continue;
    }
    const terms = JSON.parse(termsJson).map((t) => ({
      id: parseInt(t.term_id, 10),
      name: t.name,
      slug: t.slug,
      parent: t.parent,
    }));

    const bestCats = pickBestCategories(terms);
    if (bestCats.length === 0) {
      console.log(`⚠  ${slug}: keine nutzbare Kategorie`);
      skip++;
      continue;
    }

    const block = buildLatestPostsBlock(bestCats, 10);
    const currentContent = wpSafe(`post get ${id} --field=post_content`);
    if (currentContent === null) {
      errors++;
      continue;
    }

    const { content: newContent, action } = injectBlock(currentContent, block, FORCE);
    if (action === "skipped-existing") {
      skip++;
      console.log(`  ⚠ ${slug}: bereits vorhanden (use --force)`);
      continue;
    }

    if (DRY) {
      console.log(`[DRY] ${slug} (ID ${id}): Kategorie "${bestCats[0].slug}" (ID ${bestCats[0].id}) — ${action}`);
      ok++;
    } else {
      const tmpFile = `/tmp/wp-related-${slug}.html`;
      fs.writeFileSync(tmpFile, newContent);
      wp(`post update ${id} "${tmpFile}"`);
      fs.unlinkSync(tmpFile);
      console.log(`✅ ${slug} (ID ${id}): Kategorie ${bestCats[0].slug}`);
      ok++;
    }
  } catch (e) {
    console.log(`❌ ${slug}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ Fertig: ${ok} ok, ${skip} übersprungen, ${errors} Fehler`);
