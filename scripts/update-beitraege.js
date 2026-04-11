#!/usr/bin/env node

/**
 * Updates alle 202 Beiträge in WordPress mit korrekten Titeln, Untertiteln, H2 und Content.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const articles = require("./articles-converted.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024
  }).trim();
}

console.log(`\n📝 Update ${articles.length} Beiträge...\n`);

let updated = 0, errors = 0;

for (const article of articles) {
  try {
    const postId = wp(`post list --post_type=post --name="${article.slug}" --format=ids`).trim();
    if (!postId) {
      console.log(`⚠️  ${article.slug}: nicht gefunden`);
      errors++;
      continue;
    }

    // Write content to temp file
    const tmpFile = `/tmp/wp-update-${article.slug}.html`;
    fs.writeFileSync(tmpFile, article.content);

    // Update title + content
    wp(`post update ${postId} "${tmpFile}" --post_title="${article.title.replace(/"/g, '\\"')}"`);

    // Update untertitel
    wp(`post meta update ${postId} beitrag_untertitel "${article.untertitel.replace(/"/g, '\\"')}"`);

    // Update SEO
    if (article.seo.titleTag) {
      wp(`post meta update ${postId} _yoast_wpseo_title "${article.seo.titleTag.replace(/"/g, '\\"')}"`);
    }
    if (article.seo.metaDesc) {
      wp(`post meta update ${postId} _yoast_wpseo_metadesc "${article.seo.metaDesc.replace(/"/g, '\\"')}"`);
    }
    if (article.seo.focusKw) {
      wp(`post meta update ${postId} _yoast_wpseo_focuskw "${article.seo.focusKw.replace(/"/g, '\\"')}"`);
    }

    fs.unlinkSync(tmpFile);
    console.log(`✅ ${article.slug} → "${article.title}"`);
    updated++;
  } catch (e) {
    console.log(`❌ ${article.slug}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ ${updated} aktualisiert, ${errors} Fehler\n`);
