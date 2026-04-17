#!/usr/bin/env node

/**
 * Setzt für alle 202 Beiträge:
 *   1. WordPress-Tags (post_tag) aus articles-converted.json → seo.keywords
 *   2. Yoast-FAQ-Block aus faqs-generated.json an den Content (nach Checkliste-Block)
 *
 * Usage:
 *   node scripts/update-beitraege-faq-tags.js --dry-run          # nichts schreiben, nur anzeigen
 *   node scripts/update-beitraege-faq-tags.js --slug <s>         # nur ein Artikel
 *   node scripts/update-beitraege-faq-tags.js --limit N          # nur erste N
 *   node scripts/update-beitraege-faq-tags.js --only-tags        # nur Tags setzen
 *   node scripts/update-beitraege-faq-tags.js --only-faq         # nur FAQ setzen
 *   node scripts/update-beitraege-faq-tags.js --force            # bestehenden FAQ-Block ersetzen
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const articles = require("./articles-converted.json");
const faqsPath = path.join(__dirname, "faqs-generated.json");
const faqs = fs.existsSync(faqsPath) ? require("./faqs-generated.json") : {};

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
const ONLY_TAGS = flag("--only-tags");
const ONLY_FAQ = flag("--only-faq");
const FORCE = flag("--force");

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function wpSafe(cmd) {
  try { return wp(cmd); } catch (e) { return null; }
}

function splitKeywords(keywords) {
  if (!keywords) return [];
  return keywords
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && k.length <= 50);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Baut das Yoast FAQ-Block-HTML.
 * Format laut Yoast-Block-Editor: wp:yoast/faq-block mit div.schema-faq > div.schema-faq-section
 * Jede Section bekommt eine eindeutige faq-question-<timestamp> ID.
 */
function buildYoastFaqBlock(faqEntries) {
  const base = Date.now();
  const ids = faqEntries.map((_, i) => `faq-question-${base + i}`);

  const attrs = JSON.stringify({
    questions: faqEntries.map((f, i) => ({
      id: ids[i],
      question: [f.question],
      answer: [f.answer],
      jsonQuestion: f.question,
      jsonAnswer: f.answer,
    })),
  });

  const sections = faqEntries
    .map((f, i) => `<div class="schema-faq-section" id="${ids[i]}"><strong class="schema-faq-question">${escapeHtml(f.question)}</strong> <p class="schema-faq-answer">${escapeHtml(f.answer)}</p> </div>`)
    .join(" ");

  return `<!-- wp:yoast/faq-block ${attrs} -->
<div class="schema-faq wp-block-yoast-faq-block">${sections}</div>
<!-- /wp:yoast/faq-block -->`;
}

const FAQ_HEADING = '<h2 class="faq-heading">Häufig gestellte Fragen</h2>';

function injectFaqIntoContent(content, faqBlock, force) {
  const faqWithHeading = `${FAQ_HEADING}\n\n${faqBlock}`;
  const faqPattern = /(?:<h2[^>]*class="faq-heading"[^>]*>[\s\S]*?<\/h2>\s*)?<!-- wp:yoast\/faq-block[\s\S]*?<!-- \/wp:yoast\/faq-block -->/;
  if (faqPattern.test(content)) {
    if (!force) return { content, action: "skipped-existing" };
    content = content.replace(faqPattern, faqWithHeading);
    return { content, action: "replaced" };
  }
  const checklistePattern = /<!-- wp:finanzleser\/checkliste \{[^}]*\} \/-->/g;
  const matches = [...content.matchAll(checklistePattern)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1];
    const insertAt = last.index + last[0].length;
    const newContent = content.slice(0, insertAt) + "\n\n" + faqWithHeading + content.slice(insertAt);
    return { content: newContent, action: "after-checkliste" };
  }
  return { content: content + "\n\n" + faqWithHeading, action: "end" };
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

console.log(`\n🔧 Beitrags-Update`);
console.log(`   Modus:        ${DRY ? "DRY-RUN" : "LIVE"}${FORCE ? " (force)" : ""}`);
console.log(`   Zu verarbeiten: ${toProcess.length}/${articles.length}`);
console.log(`   Tags:         ${ONLY_FAQ ? "übersprungen" : "aktiv"}`);
console.log(`   FAQ-Block:    ${ONLY_TAGS ? "übersprungen" : "aktiv"}`);
console.log(`   FAQs geladen: ${Object.keys(faqs).length}\n`);

let tagOk = 0, tagSkip = 0, faqOk = 0, faqSkip = 0, errors = 0;

for (const article of toProcess) {
  const slug = article.slug;
  try {
    // Post-ID holen
    const idRaw = wpSafe(`post list --name="${slug}" --post_type=post --post_status=any --field=ID --format=ids`);
    if (!idRaw) {
      console.log(`⚠️  ${slug}: nicht in WP gefunden`);
      errors++;
      continue;
    }
    const id = idRaw.trim().split(/\s+/)[0];

    // 1. Tags
    if (!ONLY_FAQ) {
      const kws = splitKeywords(article.seo?.keywords);
      if (kws.length === 0) {
        tagSkip++;
        console.log(`  ⚠ ${slug}: keine Keywords → Tags übersprungen`);
      } else if (DRY) {
        console.log(`  [DRY] ${slug} (ID ${id}): Tags → ${kws.join(", ")}`);
        tagOk++;
      } else {
        const phpArray = kws.map((k) => `"${k.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
        const phpCode = `wp_set_post_terms(${id}, [${phpArray}], "post_tag", false);`;
        wp(`eval '${phpCode.replace(/'/g, "'\\''")}'`);
        tagOk++;
      }
    }

    // 2. FAQ-Block
    if (!ONLY_TAGS) {
      const faqEntry = faqs[slug];
      if (!faqEntry || !faqEntry.faqs || faqEntry.faqs.length !== 4) {
        faqSkip++;
        console.log(`  ⚠ ${slug}: keine 4 FAQ in faqs-generated.json`);
      } else {
        const currentContent = wpSafe(`post get ${id} --field=post_content`);
        if (currentContent === null) {
          errors++;
          continue;
        }
        const faqBlock = buildYoastFaqBlock(faqEntry.faqs);
        const { content: newContent, action } = injectFaqIntoContent(currentContent, faqBlock, FORCE);
        if (action === "skipped-existing") {
          faqSkip++;
          if (!ONLY_FAQ && !ONLY_TAGS) {
            // Tag-only log oben schon gemacht
          } else {
            console.log(`  ⚠ ${slug}: FAQ bereits vorhanden (use --force)`);
          }
        } else if (DRY) {
          console.log(`  [DRY] ${slug} (ID ${id}): FAQ-Block (${action}, +${newContent.length - currentContent.length} Zeichen)`);
          faqOk++;
        } else {
          const tmpFile = `/tmp/wp-update-${slug}.html`;
          fs.writeFileSync(tmpFile, newContent);
          wp(`post update ${id} "${tmpFile}"`);
          fs.unlinkSync(tmpFile);
          faqOk++;
        }
      }
    }

    console.log(`✅ ${slug} (ID ${id})`);
  } catch (e) {
    console.log(`❌ ${slug}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ Fertig:`);
if (!ONLY_FAQ) console.log(`   Tags:      ${tagOk} gesetzt, ${tagSkip} übersprungen`);
if (!ONLY_TAGS) console.log(`   FAQ-Block: ${faqOk} injiziert, ${faqSkip} übersprungen`);
console.log(`   Fehler:    ${errors}`);
