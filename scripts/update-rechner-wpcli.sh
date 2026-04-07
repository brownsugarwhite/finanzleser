#!/bin/bash
#
# Updates all Rechner CPT excerpts via WP-CLI (Local by Flywheel)
#
# Usage: bash scripts/update-rechner-wpcli.sh
#

WP_PATH="/Users/bsw/Local Sites/finanzleser/app/public"
PHP_BIN="/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php"
WP_CLI="/Applications/Local.app/Contents/Resources/extraResources/bin/wp-cli/wp-cli.phar"
MYSQL_SOCK="/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock"

wp_cmd() {
  "$PHP_BIN" -d "mysqli.default_socket=$MYSQL_SOCK" "$WP_CLI" --path="$WP_PATH" "$@" 2>/dev/null
}

update_rechner() {
  local slug="$1"
  local desc="$2"

  # Find post ID by slug
  local post_id
  post_id=$(wp_cmd post list --post_type=rechner --name="$slug" --fields=ID --format=csv 2>/dev/null | tail -1)

  if [ -z "$post_id" ] || [ "$post_id" = "ID" ]; then
    echo "⚠  SKIP  $slug — not found"
    return 1
  fi

  # Update excerpt
  if wp_cmd post update "$post_id" --post_excerpt="$desc" > /dev/null 2>&1; then
    echo "✓  OK    $slug (ID $post_id)"
    return 0
  else
    echo "✗  FAIL  $slug (ID $post_id)"
    return 1
  fi
}

echo ""
echo "Updating Rechner descriptions via WP-CLI..."
echo ""

SUCCESS=0
FAILED=0

# Use node to extract descriptions from the JS file and output as slug\tdescription pairs
node -e "
const fs = require('fs');
const script = fs.readFileSync('scripts/update-rechner-descriptions.js', 'utf8');
// Extract the calculators array by evaluating just that part
const match = script.match(/const calculators = \[([\s\S]*?)\n\];/);
if (!match) { console.error('Could not parse calculators'); process.exit(1); }
const calculators = eval('[' + match[1] + ']');
calculators.forEach(c => {
  // Output as JSON lines for safe parsing
  console.log(JSON.stringify({slug: c.slug, description: c.description}));
});
" | while IFS= read -r line; do
  slug=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.slug)")
  desc=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); process.stdout.write(d.description)")

  if update_rechner "$slug" "$desc"; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "Done."
