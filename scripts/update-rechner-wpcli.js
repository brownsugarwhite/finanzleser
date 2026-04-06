#!/usr/bin/env node
/**
 * Updates all Rechner CPT excerpts via WP-CLI (Local by Flywheel)
 * Usage: node scripts/update-rechner-wpcli.js
 */

const { execSync } = require("child_process");
const path = require("path");

const WP_PATH = "/Users/bsw/Local Sites/finanzleser/app/public";
const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const WP_CLI = "/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";

function wp(...args) {
  const cmd = `"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_PATH}" ${args.join(" ")}`;
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

// Import descriptions from the update script
const fs = require("fs");
const script = fs.readFileSync(path.join(__dirname, "update-rechner-descriptions.js"), "utf8");
const match = script.match(/const calculators = \[([\s\S]*?)\n\];/);
if (!match) { console.error("Could not parse calculators"); process.exit(1); }
const calculators = eval("[" + match[1] + "]");

async function main() {
  console.log(`\nUpdating ${calculators.length} Rechner descriptions via WP-CLI...\n`);

  let success = 0;
  let failed = 0;

  for (const calc of calculators) {
    try {
      // Find post ID by slug
      const csv = wp("post", "list", "--post_type=rechner", `--name=${calc.slug}`, "--fields=ID", "--format=csv");
      const lines = csv.split("\n").filter(l => l && l !== "ID");

      if (lines.length === 0) {
        console.log(`⚠  SKIP  ${calc.slug} — not found`);
        failed++;
        continue;
      }

      const postId = lines[0].trim();

      // Write description to temp file to avoid shell escaping issues
      const tmpFile = `/tmp/rechner-desc-${calc.slug}.txt`;
      fs.writeFileSync(tmpFile, calc.description);

      // Update excerpt using file input
      wp("post", "update", postId, `--post_excerpt="$(cat '${tmpFile}')"`);

      // Clean up
      fs.unlinkSync(tmpFile);

      console.log(`✓  OK    ${calc.slug} (ID ${postId})`);
      success++;
    } catch (err) {
      console.log(`✗  FAIL  ${calc.slug} — ${err.message?.split("\n")[0] || err}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} updated, ${failed} failed/skipped.`);
}

main();
