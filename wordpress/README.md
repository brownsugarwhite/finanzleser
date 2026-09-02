# `wordpress/` — eigener WordPress-Code

Hier liegt **ausschließlich selbstgeschriebener** PHP-Code, der im WordPress-CMS läuft.
Fremde Plugins, WordPress-Kern und Themes gehören weiterhin **nicht** ins Git
(CLAUDE.md, Regel 2) — die werden beim Aufbau frisch von wordpress.org bzw. vom
Hersteller geholt.

## Warum das hier liegt

Bis zum 02.09.2026 existierte dieser Code **nur auf dem Server** und in einem
Backup-ZIP in `../finanzleser-assets/backups/` — einem Ordner ohne Git, ohne Remote,
ohne zweite Kopie. Beim Einbruch vom August 2026 war genau das der blinde Fleck: die
Security-Firma konnte Kern und Fremd-Plugins gegen die wordpress.org-Prüfsummen
abgleichen, diese Dateien aber gegen nichts.

Zusätzlich: ein ZIP ist keine Arbeitskopie. Nicht diffbar, nicht reviewbar, nicht
deploybar.

Quelle des hier eingecheckten Stands: `finanzleser-backup-2026-08-11_sauber`
(gezogen nach der Bereinigung, alle Dateigrößen gegen die Server-Baseline geprüft).
`finanzleser-headless.php` war bereits in Git und ist **byteidentisch** zum Backup.

## Inhalt

### `mu-plugins/` — Must-Use-Plugins (immer aktiv, nicht abschaltbar)

| Datei | Zweck |
|---|---|
| `finanzleser-headless.php` | Vorschau-/Permalink-URLs aufs Next.js-Frontend umbiegen, On-Demand-Revalidation |
| `finanzleser-site-settings.php` | „Einstellungen → Site-Einstellungen" + REST `/finanzleser/v1/site-settings` (ACF-frei) |
| `finanzleser-config.php` | ACF Options Page „Rechner-Konfiguration" + `rates.json` — 🚧 entfällt mit Roadmap-Phase E |
| `finanzleser-dokumente.php` | CPT `dokument` (PDF-Broschüren) |
| `finanzleser-anbieter.php` | CPT `anbieter` (147 Versicherer-Kontaktseiten) |
| `finanzleser-kategorie-bilder.php` | Kategorie-Bildfelder per `register_term_meta` (ACF-frei) |
| `finanzleser-cpt-excerpt.php` | Excerpt-Support für `rechner`/`checkliste`/`vergleich` |
| `finanzleser-block-passthrough.php` | Erhält `core/latest-posts` als Block-Kommentar im `post_content` |
| `finanzleser-noindex.php` | Sperrt das CMS gegen Suchmaschinen |

### `plugins/` — reguläre Plugins

| Ordner | Zweck |
|---|---|
| `finanzleser-blocks/` | Gutenberg-Blöcke `finanzleser/rechner`, `/checkliste`, `/vergleich`. **Existiert nirgends sonst.** |
| `finanzleser-studio-helper/` | Yoast-Felder per REST für Nicoles Content Studio. Eigenes Projekt: [nicolehahn2890/finanzleser-content-studio](https://github.com/nicolehahn2890/finanzleser-content-studio) — hier liegt die **exakt deployte Version 1.1.4** als Referenz für den Wiederaufbau, nicht als Arbeitskopie. Änderungen gehören ins Ursprungs-Repo. |

### `einmal-skripte/` — historisch, nicht deployen

Einmal-mu-plugins aus der Bereinigung des Sicherheitsvorfalls (11.08.2026). Wurden nach
Ausführung wieder vom Server entfernt. Bleiben als Nachweis, was ausgeführt wurde.

## Deploy

Per SFTP nach `wp-content/mu-plugins/` bzw. `wp-content/plugins/`.

```bash
lftp -u ACC,'PWD' -p 22 sftp://access-5021324858.webspace-host.com -e "
  mirror -R wordpress/mu-plugins wp-content/mu-plugins;
  mirror -R wordpress/plugins/finanzleser-blocks wp-content/plugins/finanzleser-blocks;
  bye
"
```

`einmal-skripte/` bewusst **nicht** mitspiegeln.

## Konfiguration (`wp-config.php` der jeweiligen Instanz)

`finanzleser-headless.php` aktiviert sich nur, wenn alle drei Konstanten gesetzt sind:

```php
define( 'FL_HEADLESS_FRONTEND_URL',      'https://www.finanzleser.de' );
define( 'FL_HEADLESS_PREVIEW_SECRET',    'hex(24)' );
define( 'FL_HEADLESS_REVALIDATE_SECRET', 'hex(24)' );
```

Korrespondierende Next.js-Routen: `app/api/preview/route.ts` (`WP_PREVIEW_SECRET`),
`app/api/revalidate/route.ts` (`WP_REVALIDATE_SECRET`). Die Secrets müssen in mu-plugin
**und** Netlify-Env gleichzeitig rotiert werden.

## 🚨 Sync-Pflichten

- `fl_headless_main_category_slugs()` in `finanzleser-headless.php` MUSS synchron zu
  `MAIN_CATEGORY_SLUGS` in [../lib/categories.ts](../lib/categories.ts) bleiben.
- Ändert sich hier etwas, ist es erst live, wenn es **deployed** wurde — Git allein
  bewirkt nichts. Das Frontend-Deployment über Netlify fasst diese Dateien nicht an.
