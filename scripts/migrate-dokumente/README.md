# Dokumente-Migration

3-Phasen-Skripte für den initialen Import der ~137 PDFs aus
`/Users/bsw/Desktop/finanzleser/1. DOKUMENTE` in den `dokument`-CPT.

## Reihenfolge

```bash
# 1. Inventar erstellen (mechanisch: scan + filter, Jahres-Dedup)
node scripts/migrate-dokumente/01-inventory.js
# → inventory.json (gitignored, re-generierbar)

# 2a. PDF-Volltext der ersten Seite extrahieren (mechanisch)
node scripts/migrate-dokumente/02a-extract-pdf-texts.js
# → pdf-extracts.json (gitignored, re-generierbar)

# 2. Titel + Beschreibung pro PDF generieren
#    Zwei Wege:
#    a) Via Anthropic-API mit Sonnet (braucht ANTHROPIC_API_KEY in .env.local):
node scripts/migrate-dokumente/02-generate-titles.js
#    b) Per Sub-Agent in der Claude-Code-Session (siehe pdf-extracts.json
#       als Input, schreibt titles.json)
# → titles.json (versioniert — redaktionelles Asset)

# 3. Upload nach lokalem WordPress (via WP-CLI gegen Local by Flywheel)
node scripts/migrate-dokumente/03-upload.js
# → upload-log.json (gitignored, lokal-spezifisch)
```

## Idempotenz

Alle Skripte können mehrfach ausgeführt werden:
- Phase 1 schreibt das Inventar deterministisch neu
- Phase 2/2a überspringen bereits verarbeitete `sha256`
- Phase 3 überspringt Posts, deren Slug bereits existiert (Log-basiert + Slug-Lookup als Fallback)

## Korrektur-Skripte

- `04-fix-categories.js` — einmalig nach dem ersten Upload nötig gewesen (Term-IDs als Term-Namen). Im Skript-Header dokumentiert. Kann gelöscht werden, wenn nicht mehr benötigt.

## Voraussetzungen

- Node 20+ (für `--env-file`-kompatibles Setup, hier nicht zwingend)
- `pdfjs-dist` (Repo-Dependency)
- WP-CLI über Local-by-Flywheel — Pfade in `03-upload.js` hardcoded
- Optional: Anthropic-API-Key in `.env.local` (nur für `02-generate-titles.js`)
