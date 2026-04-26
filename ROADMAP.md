# Roadmap finanzleser.de

> Stand: **2026-04-26**
> Vollständiger Projektkontext: [CLAUDE.md](CLAUDE.md)

---

## ✅ Cleanup-Phasen 1–4 (April 2026, abgeschlossen)

Vor-Launch-Cleanup, alle in `main` und live deploybar.

| Phase | Branch | Commit | Was |
|---|---|---|---|
| 1 — SEO-Fundament | `chore/cleanup-phase-1-seo` | `bfb5a51` | `app/sitemap.ts` (680 URLs), `app/robots.ts`, `generateMetadata()` für 6 dynamische Routen, JSON-LD (Article/Breadcrumb/Org/Website), Yoast-bereit, ISR 1h |
| 2 — Dead Code & Deps | `chore/cleanup-phase-2-deadcode` | `93d8c41` | `_archive/` (10 Files) + `framer-motion` (~60 KB) entfernt, `tsconfig.tsbuildinfo` aus Git, 9 TS-Bestand-Errors gefixt, `typescript.ignoreBuildErrors` deaktiviert |
| 3 — GSAP-Konsolidierung | `chore/cleanup-phase-3-gsap-config` | `efe3169` | Alle GSAP-Plugins zentral in `lib/gsapConfig.ts`, alle 24 Komponenten auf `@/lib/gsapConfig` umgestellt — keine Modul-Identity-Issues mehr |
| 4 — CSS-Hygiene | `chore/cleanup-phase-4-css` | `1611279` | 32 ungenutzte Tokens raus (177→119 Z.), `lib/cn.ts`, Layout-Inline-Styles in CSS-Klassen extrahiert |

**Snapshot-Tags:** `pre-cleanup-phase-1` … `pre-cleanup-phase-4` für Rollback.

---

## 🔄 Aktuelle Roadmap — Vor-Launch-Konsolidierung

5 sequenzielle Phasen, jede ein eigener Branch + Snapshot-Tag.

### Phase A — MD-Dokumentation aktualisieren 🟢

**Status:** in Arbeit
**Branch:** `chore/docs-consolidation`
**Risiko:** Null (rein dokumentarisch)

CLAUDE.md neu, README.md ausgebaut, ROADMAP.md (diese Datei) ergänzt, `docs/` aufgeräumt, Memory aktualisiert.

### Phase B — Repo-Struktur aufräumen 🟢

**Status:** ausstehend
**Branch:** `chore/repo-structure`
**Risiko:** Niedrig

- `backup/`, `wp-cli.phar`, `wordpress-setup/`, `tsconfig.tsbuildinfo` raus
- `tailwind.config.ts` prüfen (vermutlich obsolet seit Tailwind v4)
- `scripts/` neu strukturieren (`scripts/migrations/` + `scripts/data/`)
- `lib/hooks/` (Daten-Hooks) vs `/hooks/` (Animation-Hooks) — Doppelung auflösen
- `lib/` ggf. in Subdirs (`lib/wordpress/`, `lib/utils/`)

### Phase C — WordPress-Backend Cleanup (lokal) 🟡

**Status:** ausstehend
**Risiko:** Mittel — über WP-Admin via Claude-MCP-Connector

48 Plugins → ~25 Plugins. Legacy raus (`js_composer`, `ubermenu`, `shortcodes-ultimate`, `wp-table-builder*`, `advanced-ads*`, `templatera`, `tinymce-advanced`, `header-footer`). Uploads aufräumen (~660 MB Archiv-Jahre, 333 MB ShortPixel-Backups).

Vorher: UpdraftPlus-Backup. Nachher: Speicherplatz-Vergleich, Stichprobe 4-5 Beiträge.

### Phase D — Staging einrichten 🟡

**Status:** ausstehend
**Branch:** `chore/staging-setup`
**Risiko:** Mittel — DNS, SSL, DB-Migration

1. Subdomain `staging.finanzleser.de` bei IONOS + SSL
2. WordPress-Frischinstallation auf Staging mit den in Phase C beibehaltenen Plugins
3. Lokal → Staging: DB-Export/-Import, Uploads rsync, Search-Replace `finanzleser.local` → `staging.finanzleser.de`
4. Frontend: `next.config.ts` `images.remotePatterns` erweitern, Netlify-Branch `staging`, Branch-spezifische Env-Vars
5. Application Password für Claude-MCP auf Staging anlegen (`.env.staging`-Variante im MCP-Plugin)

**Wichtig:** Staging wird aus **lokalem Stand** gespeist, nicht aus Live (Live = Legacy mit alten Beiträgen).

### Phase E — ACF → Gutenberg-Migration 🔴

**Status:** ausstehend
**Branch:** `feat/gutenberg-migration`
**Risiko:** Hoch — Code + WP-Daten betroffen
**Wichtig:** Erst auf Staging, dann auf Lokal nachziehen.

Sub-Phasen:

| # | ACF-Feldgruppe | Strategie |
|---|---|---|
| E1 | `kategorieFelder` (1 Feld: `kategorieBild`) | Term-Meta oder Block-Pattern |
| E2 | `beitragFelder.beitragUntertitel` | Bestehendes `wp-subtitle` Plugin nutzen |
| E3 | `beitragFelder.beitrag{Rechner,Vergleich,Checkliste}` | Bereits über `<!-- wp:finanzleser/* -->` Block-Kommentare in `post_content` — ACF-Typdef vermutlich nur Fossil, prüfen + entfernen |
| E4 | `rechnerFelder` (CPT-Felder) | `register_post_meta` + `register_graphql_field` im `finanzleser-blocks` Plugin |
| E5 | `vergleichFelder.vergleichAnbieter[]` (Repeater) | `register_post_meta` mit JSON-Array |
| E6 | `checklisteFelder.checklistePunkte[]` (Repeater + PDF) | `register_post_meta` + Media-ID statt URL |
| E7 | Rechner-Konfiguration (13 Werte) | WP-Options ODER `config/rates.json` im Repo (User-Entscheidung) |
| E8 | Cleanup | ACF-Plugin + WPGraphQL-ACF deaktivieren, `acf-json/` löschen, `lib/types.ts` bereinigen |

Pro Sub-Phase: Stichprobe 10 Beiträge im Browser, dann nächster Schritt.

---

## 📅 Nach Launch

Nicht-blockierend, kann jederzeit nach Live-Schaltung gemacht werden:

- **KI-Agent-Integration** (Zendesk Conversations API, eigenes Chat-Widget, PDF-Wissensdatenbank — siehe ursprüngliche Phase 4 in CLAUDE.md)
- **Tailwind-Utility-Klassen-Eliminierung** (alte Cleanup-Phase 5: 29 Dateien, ~200 Vorkommen → semantische CSS-Klassen, BEM-style)
- **Pill-Hooks-Deduplikation** (alte Cleanup-Phase 6: `useSliderPill` ↔ `useNavPill` 70 % identisch → `usePillCore` extrahieren)
- **ESLint-Bestand-Cleanup** (447 Issues, separater Branch `chore/eslint-cleanup`)

---

## 🛟 Sicherheitsnetz

Pro Phase:
- Snapshot-Tag `pre-phase-X` vor Start setzen
- Eigener Branch, kein direkter Commit auf `main`
- Atomare Sub-Commits, User-Verifikation vor nächstem Schritt
- Build + TS-Check + Browser-Smoke-Test pflicht

Rollback: `git reset --hard pre-phase-X` jederzeit möglich.
