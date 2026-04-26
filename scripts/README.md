# Scripts

Migrations- und Datenpflege-Skripte. **Alle Skripte sind historisch** — sie wurden während der Aufbauphase einmalig oder mehrfach gegen WordPress (lokal) ausgeführt. Werden nicht aus der Anwendung importiert.

## Ausführung

Pro Skript benötigst du:
- Node.js (für `*.js`)
- PHP-CLI (für `*.php`)
- Python 3 (für `*.py`)
- WP-CLI (für `seed-rechner.sh`, `update-rechner-wpcli.sh`)
- Eine WP-Application-Password-Konfiguration (siehe `lib/wordpress.ts` bzw. `.env.local`)

Beispiel:
```bash
node scripts/seed-beitraege.js
bash scripts/seed-rechner.sh
```

## Daten-Files (JSON, CSV)

Werden von Skripten via `require("./xxx.json")` direkt aus diesem Ordner geladen. Bitte **nicht** in Subordner verschieben, sonst brechen die Skripte.

| Datei | Zweck |
|---|---|
| `articles-converted.json` | Bereinigte Artikel-Daten nach `convert-articles*.js` |
| `beitraege-master.json` | Quelldaten für Beiträge (aus Excel) |
| `checklisten-data.json` | Checklisten-Strukturen |
| `anbieter-import.json` | Anbieter-Import-Daten (in `.gitignore`) |
| `faqs-generated.json` | KI-generierte FAQ-Inhalte |
| `finanzleser_posts.csv` | Beitrags-Inventar (Live-Bestand-Snapshot) |

## Skripte nach Funktion

### Konvertierung & Aufbereitung
- `convert-articles.js`, `convert-articles-v2.js` — Excel/Word → JSON
- `parse-beitraege-excel.js` — Excel-Parser
- `extract-checkliste-titles.js` — PDF-Parser für Checklisten

### Initial-Seeding (Erstbefüllung WordPress)
- `seed-beitraege.js` — Beiträge aus `articles-converted.json` anlegen
- `seed-checklisten.js` — Checklisten aus `checklisten-data.json` anlegen
- `seed-rechner.js`, `seed-rechner.sh` — Rechner-CPT seeden
- `seed-vergleiche.js`, `seed-vergleich-urls.js` — Vergleich-CPTs anlegen
- `import-anbieter.php`, `import-anbieter.py` — Anbieter-CPTs importieren

### Updates (nach Initial-Seed)
- `update-beitraege.js` — Beiträge bulk-aktualisieren
- `update-beitraege-faq-tags.js` — FAQ-Tags ergänzen
- `update-beitraege-related-block.js` — Related-Posts-Block anhängen
- `update-rechner-descriptions.js`, `update-rechner-meta.js`, `update-rechner-wpcli.js`, `update-rechner-wpcli.sh` — Rechner-Metadaten
- `update-kategorie-beschreibungen.js` — Kategorie-Beschreibungen

### Fixes (Reparatur historischer Probleme)
- `fix-categories.js`, `fix-categories-v2.js` — Kategorie-Zuordnungen korrigieren
- `fix-h2s.js`, `generate-h2s.js` — H2-Untertitel reparieren

### FAQ-Generierung (Batch-Pipeline)
- `prepare-faq-batches.js` — Artikel in Batches teilen
- `merge-faq-batches.js` — KI-generierte FAQ-Batches zusammenführen
- `faq-batches/` — Zwischenergebnisse (in `.gitignore`)

## Hinweis

Werden die Skripte nochmal benötigt (z. B. für Staging-Aufbau), prüfen ob ihre relativen Pfade noch passen und ob die WP-API/Endpoints sich seit letzter Ausführung geändert haben.
