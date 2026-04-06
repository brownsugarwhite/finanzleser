#!/usr/bin/env node
/**
 * Updates ACF rechner_beschreibung meta field via WP-CLI
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const WP_PATH = "/Users/bsw/Local Sites/finanzleser/app/public";
const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const WP_CLI = "/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";

function wp(...args) {
  const cmd = `"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_PATH}" ${args.join(" ")}`;
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

// Import descriptions
const script = fs.readFileSync(path.join(__dirname, "update-rechner-descriptions.js"), "utf8");
const match = script.match(/const calculators = \[([\s\S]*?)\n\];/);
if (!match) { console.error("Could not parse calculators"); process.exit(1); }
const calculators = eval("[" + match[1] + "]");

console.log(`\nUpdating ${calculators.length} ACF rechner_beschreibung fields...\n`);

let success = 0;
let failed = 0;

for (const calc of calculators) {
  try {
    const csv = wp("post", "list", "--post_type=rechner", `--name=${calc.slug}`, "--fields=ID", "--format=csv");
    const lines = csv.split("\n").filter(l => l && l !== "ID");
    if (lines.length === 0) { console.log(`⚠  SKIP  ${calc.slug}`); failed++; continue; }

    const postId = lines[0].trim();
    const tmpFile = `/tmp/rechner-meta-${calc.slug}.txt`;
    fs.writeFileSync(tmpFile, calc.description);

    execSync(
      `"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_PATH}" post meta update ${postId} rechner_beschreibung "$(cat '${tmpFile}')"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );

    fs.unlinkSync(tmpFile);
    console.log(`✓  OK    ${calc.slug} (ID ${postId})`);
    success++;
  } catch (err) {
    console.log(`✗  FAIL  ${calc.slug} — ${(err.message || "").split("\n")[0]}`);
    failed++;
  }
}

console.log(`\nDone. ${success} updated, ${failed} failed/skipped.`);
