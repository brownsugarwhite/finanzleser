#!/usr/bin/env bash
# Eigenen WordPress-Code aus wordpress/ auf den KLON cms-dev spielen.
#
# 🚨 Nur cms-dev. Das Produktions-CMS (cms/) wird von diesem Skript nie angefasst — der
# Zielpfad ist fest verdrahtet und wird vor dem Übertragen gegengeprüft.
#
# Zugang kommt aus .env.cms-dev.local (CMS_SSH_USER, CMS_SSH_HOST, CMS_SSH_PASS, CMS_ROOT).
#
#   tools/plugin-deploy.sh plugins/finanzleser-blocks
#   tools/plugin-deploy.sh mu-plugins/finanzleser-faden.php
#
# Ohne Argument werden alle Plugins und mu-plugins übertragen.
set -euo pipefail

WURZEL="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$WURZEL/.env.cms-dev.local" ] && set -a && . "$WURZEL/.env.cms-dev.local" && set +a

CMS_SSH="${CMS_SSH:-${CMS_SSH_USER:-}@${CMS_SSH_HOST:-access-5021324858.webspace-host.com}}"
CMS_ROOT="${CMS_ROOT:-/home/www}"
ZIEL="$CMS_ROOT/cms-dev/wp-content"

case "$ZIEL" in
  */cms-dev/*) : ;;
  *) echo "✗ Zielpfad zeigt nicht auf cms-dev: $ZIEL"; exit 1 ;;
esac

SSH_CMD=(ssh -o StrictHostKeyChecking=accept-new)
if [ -n "${CMS_SSH_PASS:-}" ]; then
  command -v sshpass >/dev/null || { echo "✗ sshpass fehlt (brew install sshpass)"; exit 1; }
  SSH_CMD=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no)
  export SSHPASS="$CMS_SSH_PASS"
fi

PFADE=("$@")
[ ${#PFADE[@]} -eq 0 ] && PFADE=(plugins mu-plugins)

for p in "${PFADE[@]}"; do
  QUELLE="$WURZEL/wordpress/$p"
  [ -e "$QUELLE" ] || { echo "✗ gibt es nicht: wordpress/$p"; exit 1; }
  echo "→ wordpress/$p  →  $CMS_SSH:$ZIEL/$p"
  if [ -d "$QUELLE" ]; then
    rsync -az --delete -e "$(printf '%q ' "${SSH_CMD[@]}")" "$QUELLE/" "$CMS_SSH:$ZIEL/$p/"
  else
    rsync -az -e "$(printf '%q ' "${SSH_CMD[@]}")" "$QUELLE" "$CMS_SSH:$ZIEL/$p"
  fi
done

echo "→ Gegenprobe"
"${SSH_CMD[@]}" "$CMS_SSH" ZIEL="$ZIEL" 'bash -s' <<'PROBE'
set -e
ls -la "$ZIEL/plugins/finanzleser-blocks" 2>/dev/null | tail -n +2 | awk '{printf "  %s  %8s  %s\n", $6" "$7" "$8, $5, $9}'
PROBE
echo "✓ fertig"
