#!/usr/bin/env bash
#
# Baut aus einem Markdown-Dokument ein Word-Dokument im finanzleser-Layout.
#
#   tools/docx/build.sh docs/Infrastruktur_Phase2.md
#   → docs/Infrastruktur_Phase2.docx
#
# Ueberschriften werden durchnummeriert (1, 1.1, 1.2 …). Die Nummern erben Schrift
# und Farbe der jeweiligen Ueberschrift — "Section Number" ist ein Zeichenformat
# ohne eigene Vorgaben, das muss also nicht gesondert gestaltet werden.
#
# Ein Inhaltsverzeichnis wird bewusst NICHT erzeugt. Wer eines braucht:
#
#   TOC=1 tools/docx/build.sh docs/Datei.md
#
# Voraussetzungen: pandoc, python3 mit python-docx (pip install python-docx)
#
# Warum ein Skript und keine Handarbeit: die Formatvorlage wird bei jedem Lauf neu
# aus pandocs Standardvorlage erzeugt (reference-style.py), statt als Binärdatei im
# Repo zu liegen. Damit ist das Layout diffbar und reviewbar wie normaler Code.
#
# 🚨 Seitenumbrueche: pandoc verwirft `\newpage` bei Word-Ausgabe KOMMENTARLOS.
# Das Skript setzt es deshalb vor dem Lauf in einen Raw-OpenXML-Block um. Wer
# `\newpage` direkt an pandoc gibt, bekommt ein Dokument ganz ohne Umbrueche und
# merkt es nicht.

set -euo pipefail

QUELLE="${1:?Aufruf: tools/docx/build.sh <datei.md> [ausgabe.docx]}"
ZIEL="${2:-${QUELLE%.md}.docx}"
HIER="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v pandoc >/dev/null || { echo "pandoc fehlt (brew install pandoc)" >&2; exit 1; }
python3 -c "import docx" 2>/dev/null || { echo "python-docx fehlt (pip3 install python-docx)" >&2; exit 1; }

# 1 · Formatvorlage erzeugen
pandoc --print-default-data-file reference.docx > "$TMP/reference.docx"
( cd "$TMP" && python3 "$HIER/reference-style.py" )

# 2 · \newpage in einen Word-Seitenumbruch uebersetzen
python3 - "$QUELLE" "$TMP/quelle.md" <<'PY'
import sys
quelle, ziel = sys.argv[1], sys.argv[2]
UMBRUCH = '```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```'
text = open(quelle, encoding="utf-8").read()
anzahl = text.count("\\newpage")
open(ziel, "w", encoding="utf-8").write(text.replace("\\newpage", UMBRUCH))
print(f"  {anzahl} Seitenumbrueche uebersetzt")
PY

# 3 · Bauen
#
# Kein Array fuer die optionalen Argumente: macOS liefert bash 3.2, dort bricht
# "${ARRAY[@]}" bei LEEREM Array unter `set -u` mit "unbound variable" ab. Eine
# einfache Zeichenkette ist hier gefahrlos, weil die Argumente keine Leerzeichen
# enthalten.
VERZEICHNIS=""
if [[ -n "${TOC:-}" ]]; then
  VERZEICHNIS="--toc --toc-depth=2"
  echo "  Inhaltsverzeichnis: an"
fi

# shellcheck disable=SC2086
pandoc "$TMP/quelle.md" \
  --reference-doc="$TMP/finanzleser-reference.docx" \
  --number-sections \
  $VERZEICHNIS \
  -o "$ZIEL"

# Gegenprobe: ist die Datei wirklich neu? Ein Lauf, der nichts erzeugt, aber
# nichts sagt, ist schlimmer als einer, der abbricht.
[[ "$ZIEL" -nt "$QUELLE" ]] || { echo "FEHLER: $ZIEL wurde nicht neu erzeugt" >&2; exit 1; }

echo "✅ $ZIEL"
