#!/usr/bin/env bash
# =====================================================================================
# clone-cms.sh — cms.finanzleser.de → cms-dev.finanzleser.de (Wegwerf-Klon)
#
# Zweck: Der Klon ist die Spielwiese für den Faden-Umbau (neue Inhaltstypen, Migration
# der 1026 Beiträge, Content-Studio-Erweiterung). Er wird NIE gepflegt und fließt NIE
# zurück; wer ihn braucht, lässt dieses Skript einfach noch einmal laufen.
#
# Vorbedingungen (Stand 03.09.2026, gemessen):
#   - zweiter IONOS-Zugang mit SFTP + SSH (`access-5021324858.webspace-host.com`)
#   - WP-CLI 2.12 auf der Shell vorinstalliert, PHP 8.3 (CLI)
#   - Ordner $CMS_ROOT/cms (Produktion) und $CMS_ROOT/cms-dev (Klon) existieren;
#     in cms-dev liegt eine wp-config.php, die auf die ZWEITE Datenbank zeigt
#   - DNS: cms-dev.finanzleser.de zeigt bereits auf den Webspace (dig, 07.09.)
#
# Aufruf (lokal, ohne Passwörter in der Datei):
#   CMS_SSH=<user>@access-5021324858.webspace-host.com \
#   CMS_DEV_USER=faden CMS_DEV_PASS='<Passwort>' \
#   tools/clone-cms.sh
#
# Was das Skript NICHT tut: Produktion anfassen (nur lesen), DNS ändern, `www.`
# umschreiben (es sucht ausschließlich `cms.finanzleser.de`), sed über den Dump
# (Serialisierung! → wp search-replace).
# =====================================================================================
set -euo pipefail

# Zugangsdaten aus .env.cms-dev.local (gitignored, chmod 600) – oder als Umgebungsvariablen übergeben.
HIER="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$HIER/.env.cms-dev.local" ]; then set -a; . "$HIER/.env.cms-dev.local"; set +a; fi
if [ -z "${CMS_SSH:-}" ] && [ -n "${CMS_SSH_USER:-}" ]; then CMS_SSH="$CMS_SSH_USER@${CMS_SSH_HOST:-access-5021324858.webspace-host.com}"; fi
# Passwort-Login ohne Rückfrage nur über sshpass (liest das Passwort aus der Umgebung, nie aus der Kommandozeile).
SSH_CMD=(ssh -o StrictHostKeyChecking=accept-new)
if [ -n "${CMS_SSH_PASS:-}" ]; then command -v sshpass >/dev/null || { echo "✗ sshpass fehlt (brew install sshpass)"; exit 1; }; SSH_CMD=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no); export SSHPASS="$CMS_SSH_PASS"; fi

: "${CMS_SSH:?CMS_SSH=<user>@access-5021324858.webspace-host.com setzen (oder CMS_SSH_USER in .env.cms-dev.local)}"
: "${CMS_DEV_USER:?CMS_DEV_USER (Basic-Auth-Benutzer für den Klon) setzen}"
: "${CMS_DEV_PASS:?CMS_DEV_PASS (Basic-Auth-Passwort für den Klon) setzen}"
CMS_ROOT="${CMS_ROOT:-/home/www}"

if [ "${1:-}" = "--check" ]; then
  echo "→ Verbindungsprobe zu $CMS_SSH"
  "${SSH_CMD[@]}" "$CMS_SSH" CMS_ROOT="$CMS_ROOT" 'bash -s' <<'PROBE'
set -e
echo "  angemeldet als $(whoami) auf $(hostname)"; echo "  WP-CLI: $(wp --version 2>/dev/null || echo fehlt)"; echo "  PHP: $(php -v | head -1)"
for d in cms cms-dev; do printf "  %s: " "$CMS_ROOT/$d"; if [ -d "$CMS_ROOT/$d" ]; then echo "$(ls -1 "$CMS_ROOT/$d" | wc -l | tr -d ' ') Einträge$([ -f "$CMS_ROOT/$d/wp-config.php" ] && echo ', wp-config vorhanden' || echo ', KEINE wp-config')"; else echo "fehlt"; fi; done
for d in cms cms-dev; do [ -f "$CMS_ROOT/$d/wp-config.php" ] && printf "  DB %s: %s\n" "$d" "$(wp --path="$CMS_ROOT/$d" config get DB_NAME 2>/dev/null || echo '?')"; done
PROBE
  exit 0
fi
echo "→ Klon cms → cms-dev auf $CMS_SSH (Wurzel $CMS_ROOT)"
"${SSH_CMD[@]}" "$CMS_SSH" CMS_ROOT="$CMS_ROOT" CMS_DEV_USER="$CMS_DEV_USER" CMS_DEV_PASS="$CMS_DEV_PASS" CMS_DEV_DB_NAME="${CMS_DEV_DB_NAME:-}" CMS_DEV_DB_USER="${CMS_DEV_DB_USER:-}" CMS_DEV_DB_PASS="${CMS_DEV_DB_PASS:-}" CMS_DEV_DB_HOST="${CMS_DEV_DB_HOST:-}" 'bash -s' <<'REMOTE'
set -euo pipefail
SRC="$CMS_ROOT/cms"; DST="$CMS_ROOT/cms-dev"
[ -f "$SRC/wp-config.php" ] || { echo "✗ $SRC/wp-config.php fehlt"; exit 1; }
# Klon noch leer? Dann wp-config aus den Klon-DB-Zugangsdaten erzeugen (die Produktions-DB ist tabu, siehe Prüfung unten).
if [ ! -f "$DST/wp-config.php" ]; then
  : "${CMS_DEV_DB_NAME:?cms-dev hat noch keine wp-config.php: CMS_DEV_DB_NAME/USER/PASS in .env.cms-dev.local eintragen}"
  : "${CMS_DEV_DB_USER:?CMS_DEV_DB_USER fehlt}"; : "${CMS_DEV_DB_PASS:?CMS_DEV_DB_PASS fehlt}"
  mkdir -p "$DST"; cp -a "$SRC/." "$DST/" 2>/dev/null || true; rm -f "$DST/wp-config.php" "$DST/.htaccess" "$DST/.htpasswd"
  wp --path="$DST" config create --dbname="$CMS_DEV_DB_NAME" --dbuser="$CMS_DEV_DB_USER" --dbpass="$CMS_DEV_DB_PASS" --dbhost="${CMS_DEV_DB_HOST:-db5021339056.hosting-data.io}" --dbprefix="$(wp --path="$SRC" config get table_prefix)" --skip-check --quiet --extra-php <<'PHP'
define('WP_ENVIRONMENT_TYPE', 'staging');
define('DISALLOW_INDEXING', true);
PHP
  chmod 640 "$DST/wp-config.php"
  wp --path="$DST" db query "SELECT 1" >/dev/null 2>&1 || { echo "✗ Klon-Datenbank nicht erreichbar: Zugangsdaten prüfen"; exit 1; }
fi
[ -f "$DST/wp-config.php" ] || { echo "✗ $DST/wp-config.php fehlt"; exit 1; }
command -v wp >/dev/null || { echo "✗ wp-cli nicht im PATH"; exit 1; }
SRC_DB=$(wp --path="$SRC" config get DB_NAME); DST_DB=$(wp --path="$DST" config get DB_NAME)
[ "$SRC_DB" != "$DST_DB" ] || { echo "✗ cms und cms-dev zeigen auf dieselbe Datenbank ($SRC_DB) — Abbruch"; exit 1; }
echo "  Produktion: $SRC ($SRC_DB) → Klon: $DST ($DST_DB)"

# 1) Dateien: Core, Plugins, Themes, mu-plugins. Mediathek nicht kopieren, sondern verlinken
#    (spart Platz, kein Drift; der Klon schreibt nichts in die Produktions-Mediathek, weil
#    Uploads im Klon nur für Tests dienen — wer Medien testet, hängt hier einen echten Ordner ein).
rsync -a --delete --exclude 'wp-content/uploads' --exclude 'wp-config.php' --exclude '.htaccess' --exclude '.htpasswd' "$SRC/" "$DST/"
rm -rf "$DST/wp-content/uploads"; ln -sfn "$SRC/wp-content/uploads" "$DST/wp-content/uploads"

# 2) Datenbank: Export aus der Produktion (nur lesen), Import in die Klon-DB (alles ersetzen)
TMP=$(mktemp /tmp/cms-XXXXXX.sql)
wp --path="$SRC" db export "$TMP" --add-drop-table --quiet
wp --path="$DST" db import "$TMP" --quiet; rm -f "$TMP"

# 3) Adressen umschreiben, serialisierungssicher. Nur `cms.` → `cms-dev.`; `www.` bleibt unberührt.
wp --path="$DST" search-replace 'https://cms.finanzleser.de' 'https://cms-dev.finanzleser.de' --all-tables --precise --quiet
wp --path="$DST" search-replace 'cms.finanzleser.de' 'cms-dev.finanzleser.de' --all-tables --precise --quiet

# 4) Als Klon kennzeichnen: noindex, Name, Salts neu (Sessions der Produktion gelten hier nicht)
wp --path="$DST" option update blog_public 0 --quiet
wp --path="$DST" option update blogname 'finanzleser CMS-DEV (Wegwerf-Klon)' --quiet
wp --path="$DST" config shuffle-salts --quiet
wp --path="$DST" cache flush --quiet || true

# 5) Basic-Auth vor den Klon; /graphql und /wp-json bleiben offen: das Frontend liest GraphQL, Studio und Importe
#    schreiben per REST mit WordPress-Anwendungspasswort (zwei Basic-Auth-Schichten gehen nicht durch einen Header).
#    fetch() verweigert Zugangsdaten in der URL, deshalb der Ausnahmeweg statt user:pass in WORDPRESS_API_URL.
HASH=$(printf '%s' "$CMS_DEV_PASS" | openssl passwd -apr1 -stdin)
printf '%s:%s\n' "$CMS_DEV_USER" "$HASH" > "$DST/.htpasswd"; chmod 644 "$DST/.htpasswd"   # 644: PHP/Apache laufen als eigener Nutzer (sws…), nicht in der Gruppe; 600/640 → 500 nach der Anmeldung (gemessen 07.09.). Apache liefert .ht* nie aus.
{
  cat <<HT
# --- Klon-Schutz (clone-cms.sh) ---
# Nach dem WordPress-Rewrite heißt die Variable REDIRECT_fl_offen; ohne den zweiten Namen bleibt /graphql gesperrt (gemessen 07.09.).
SetEnvIf Request_URI "^/(graphql|wp-json)" fl_offen
AuthType Basic
AuthName "finanzleser CMS-DEV"
AuthUserFile $DST/.htpasswd
<RequireAny>
  Require env fl_offen REDIRECT_fl_offen
  Require valid-user
</RequireAny>
Header set X-Robots-Tag "noindex, nofollow"
# --- Ende Klon-Schutz ---
HT
  [ -f "$SRC/.htaccess" ] && sed '/# --- Klon-Schutz/,/# --- Ende Klon-Schutz ---/d' "$SRC/.htaccess"
} > "$DST/.htaccess"

echo "✓ Klon steht: https://cms-dev.finanzleser.de (Basic-Auth $CMS_DEV_USER, /graphql offen, noindex)"
wp --path="$DST" post list --post_type=post --post_status=publish --format=count | sed 's/^/  veröffentlichte Beiträge im Klon: /'
REMOTE

echo
echo "Gegenprobe von außen:"
curl -so /dev/null -w "  %{http_code} https://cms-dev.finanzleser.de/ (401 erwartet)\n" https://cms-dev.finanzleser.de/ || true
curl -s -X POST -H 'Content-Type: application/json' -d '{"query":"{ generalSettings { title } }"}' https://cms-dev.finanzleser.de/graphql | sed 's/^/  graphql: /'; echo
