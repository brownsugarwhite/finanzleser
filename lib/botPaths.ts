/**
 * Erkennt Pfadsegmente, die WordPress als Slug NIEMALS erzeugen kann — also
 * Scanner-Proben wie /wp-login.php, /.env, /xmlrpc.php, /vendor/phpunit/...
 *
 * WOZU
 * Die Root-Catch-All-Route (app/[kategorie]/page.tsx) loest Legacy-URLs auf den Kanon
 * auf und arbeitet dafuer bis zu 8 GraphQL-Queries sequentiell ab (plus 2 in
 * generateMetadata). Diese Kaskade ist die SEO-Reparatur aus der GSC-Arbeit und muss
 * unangetastet bleiben. Sie lief aber auch fuer jede Bot-Probe — und weil Non-200 nicht
 * im Durable Cache landet, war jede dieser URLs eine eigene teure Function-Invocation,
 * mit der Retry-Logik (bis 6 Versuche) potenziell mehrere Sekunden lang.
 *
 * WARUM DENYLIST UND NICHT ALLOWLIST
 * Eine Allowlist bekannter Slugs waere der gefaehrliche Weg: fehlt ein einziger
 * Legacy-Slug, wird aus einem funktionierenden 301 eine 404 und die Deindexierungs-
 * Reparatur ist teilweise hinueber. Diese Denylist kann per Konstruktion nur Pfade
 * treffen, die ohnehin 404 liefern wuerden.
 *
 * VALIDIERT gegen den vollstaendigen bekannten URL-Bestand (906 Root-Segmente aus
 * lib/redirects.generated.ts + docs/redirect_arbeitsliste.csv + next.config.ts +
 * Sitemap): null Treffer. Der Regressionstest dazu ist Pflicht vor jedem Merge, der
 * diese Muster anfasst.
 *
 * BEWUSST NICHT ENTHALTEN
 * - `.html` — /gehaltsrechner-2026.html ist eine echte Legacy-URL aus der GSC-Liste.
 *   Sie liefert heute zwar 404 (Weiterleitung fehlt noch), aber sobald jemand den
 *   Redirect nachtraegt, soll hier nichts im Weg stehen.
 * - Grossbuchstaben — /AGB, /Datenschutz & Co. sind echte Legacy-Pfade. Sie werden
 *   VOR diesem Guard von der lowercase-Normalisierung auf 308 geschickt.
 * - Prozentzeichen allgemein — der Regressionstest hat gezeigt, warum: die real
 *   gecrawlte URL /generali-versicherung-kontakt/%20hannover (jemand hat mit einem
 *   Leerzeichen verlinkt) liefert heute einen funktionierenden 308. Ein pauschales
 *   `/%/` haette sie auf 404 geschickt. Nur Traversal- und Nullbyte-Encodings sperren.
 */

const BOT_PATTERNS: RegExp[] = [
  /^wp-/i, // wp-login.php, wp-admin, wp-content, wp-includes, wp-json
  /^\./, // .env, .git, .htaccess, .aws
  /%(00|2e|2f|5c|252e|252f|255c)/i, // Nullbyte + encodete . / \ (Traversal-Tricks)
  /\.\./, // Path Traversal
  /\.(php|phtml|phar|asp|aspx|jsp|cgi|pl|py|rb|sh|sql|bak|old|swp|orig|ini|conf|cfg|yml|yaml|env|log|zip|tar|gz|tgz|rar|7z|exe|dll|so)$/i,
];

const BOT_EXACT = new Set([
  "xmlrpc",
  "vendor",
  "cgi-bin",
  "phpmyadmin",
  "phpinfo",
  "administrator",
  "adminer",
  "backup",
  "shell",
  "config",
  "console",
  "telescope",
  "actuator",
]);

/** Ein einzelnes Pfadsegment pruefen. */
export function isBotPathSegment(segment: string): boolean {
  if (!segment) return false;
  const s = segment.toLowerCase();
  if (BOT_EXACT.has(s)) return true;
  return BOT_PATTERNS.some((re) => re.test(segment));
}

/**
 * Trifft eines der Segmente ein Bot-Muster? Fuer verschachtelte Routen, weil
 * /wp-content/plugins/foo erst in [kategorie]/[sub]/[slug] landet.
 */
export function isBotPath(...segments: Array<string | undefined>): boolean {
  return segments.some((s) => (s ? isBotPathSegment(s) : false));
}
