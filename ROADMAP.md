# Roadmap finanzleser.de

> Stand: **2026-08-10**
> Vollständiger Projektkontext: [CLAUDE.md](CLAUDE.md)

---

## 🚨 Aktuell: Sicherheitsvorfall (10.08.2026)

Der IONOS-Account wurde kompromittiert (**wp2shell / CVE-2026-63030**), eine
Security-Firma arbeitet am Fall. Vier unbekannte Administrator-Accounts (IDs 16–19).
Vollständiger Befund, Runbook und die Vorher-Baseline zum Gegenprüfen:
Memory `project_security_wp2shell_2026_08_10.md`.

**Nicht vergessen, sobald das WP sauber ist:** Application Passwords aller User
widerrufen (auch das des MCP-Connectors), `WP_REVALIDATE_SECRET` und
`WP_PREVIEW_SECRET` rotieren — in der Netlify-Env **und** im mu-plugin.

---

## ✅ Cleanup August 2026 (Branch `chore/cleanup-und-compute`)

Snapshot-Tag: `pre-cleanup-2026-08-10`.

| Commit | Was |
|---|---|
| `87518fd` | **ISR-Fix:** `revalidate = 86400` war nie aktiv — `getClient()` gab jedem Fetch 3600 mit, Next nimmt das Minimum. 685/689 Routen liefen auf 3600 statt 86400. `CONTENT_REVALIDATE` ist jetzt die einzige Quelle |
| `eba9636` | PDF-Preload serverseitig (feuerte auf allen 202 Artikel-Views), Durable-Header für `dokument-pdf`, Rechner-Konfig bustet nicht mehr alle 689 Seiten, 410 auf CDN-Ebene, Such-Debounce 150→300 ms |
| `690694c` | 13 tote Module (~1341 LOC), 2 ungenutzte Deps, 3 gemergte Branches, 3 Glass-Tokens |
| `5b5b34e` | `assets/` + `scripts/` (156 MB) nach `../finanzleser-assets` ausgelagert |
| `d67518d` | Bot-Guard vor der SEO-Kaskade + `tools/verify-redirects.mjs` als Pflicht-Regressionstest |

Ergebnis: Arbeitsbaum ~171 MB → ~15 MB, getrackte Dateien 1981 → 525.

**Offen aus diesem Block:**
- Build-Verifikation + Deploy-Preview (wartet, bis das WordPress wieder stabil ist —
  ein Build zieht ~689 Seiten über GraphQL)
- `@netlify/plugin-nextjs` in `package.json` pinnen (bewusst aufgeschoben: nicht ohne
  Deploy testbar, aktuell Auto-Install v5.15.13)
- Struktur-Refactoring: `lib/wordpress.ts` (2094 Z.) aufteilen, `LeoIcon.tsx` (1450 Z.,
  Inline-SVG raus), `app/components.css` (4015 Z.) nach Feature splitten,
  `useListHoverBox`/`useSliderHoverBox` zusammenführen. Braucht visuelle Verifikation
- `--visual-fill-1..10` in `tokens.css`: ungenutzt, aber per Kommentar für spätere
  dynamische Nutzung reserviert → Entscheidung offen
- `origin/feature/gamification-boxen` remote löschen (lokal schon weg)

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

### ✅ Phase A — MD-Dokumentation aktualisieren

**Status:** erledigt (zuletzt 10.08.2026)
**Branch:** `chore/docs-consolidation`
**Risiko:** Null (rein dokumentarisch)

CLAUDE.md neu, README.md ausgebaut, ROADMAP.md (diese Datei) ergänzt, `docs/` aufgeräumt, Memory aktualisiert.

### ✅ Phase B — Repo-Struktur aufräumen (abgeschlossen)

Erledigt in Commit `5494206` (April) und im August-Block oben. `scripts/` wurde nicht
umstrukturiert, sondern ganz ausgelagert — laut eigenem README war nichts davon
importiert. Verbleibend als Teil des Struktur-Refactorings oben:
`lib/` in Subdirs, `tailwind.config.ts` prüfen (Tailwind v4 braucht sie nicht mehr).

### ✅ Phase C — WordPress-Backend Cleanup (abgeschlossen)

**Status:** ✅ erledigt am 2026-04-26
**Vorgehen:** WP-CLI via Local-by-Flywheel bundled phar (`/Applications/Local.app/.../wp-cli.phar`)

**Resultat: 48 Plugins → 11 Plugins + 3 mu-plugins, ~1.7 GB freigeräumt**

Aktive Plugins finale Liste:
- ACF Pro · WPGraphQL · WPGraphQL-ACF (alle bis Phase E)
- Yoast SEO + Premium
- finanzleser-blocks (eigene Custom Blocks)
- UpdraftPlus (Backups)
- Sucuri Scanner + BBQ Firewall (Security)
- Yoast Duplicate Post (Komfort)
- Zendesk (Vorbereitung KI-Agent)

Aktive mu-plugins: `finanzleser-anbieter`, `finanzleser-block-passthrough`, `finanzleser-config` (alle Eigenentwicklung, alle nötig).

Gelöscht (35 total):
- 28 inaktive Legacy-Plugins (WPBakery, UberMenu, Shortcodes Ultimate, WP Table Builder + Pro, Advanced Ads + Pro + Tracking, Templatera, TinyMCE Advanced, Header-Footer, etc.)
- 7 weitere als entbehrlich identifiziert (WP Sheet Editor + Redirection — wird durch MCP-Connector ersetzt; Native PHP Sessions; Catch IDs; Last Modified Timestamp; Health Check; WP Crontrol)
- `fix-categories.php` mu-plugin (Legacy-Migration, längst gelaufen)

Uploads-Cleanup:
- ShortPixel-Backups (333 MB)
- Alte Jahresordner 2016-2021 (~625 MB) — vorher per SQL geprüft: 0 Referenzen in publizierten Posts
- WP-Rocket-Reste (~40 MB)
- 2020 behalten (1 Bild noch als Featured-Image referenziert: Startseite)
- 2026 selbstverständlich behalten (neue Inhalte)

Alle Smoke-Tests grün (GraphQL + alle Next.js-Routen 200 OK).

### ✅ Phase D — Staging einrichten (abgeschlossen)

**Status:** erledigt — ⚠️ mit einer Einschränkung, die alles Weitere praegt:
es gibt am Ende nur EIN WordPress (`staging.finanzleser.de`), das gleichzeitig
Produktions-CMS ist. Siehe Memory `project_single_wp_architecture.md`. Das ist der
Grund fuer `forceAllAdsOn` und das staerkste Argument fuer das in Phase 2 geplante
eigene Backend.

**Urspruengliche Planung (historisch):**
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
| E4 | `rechnerFelder` (CPT-Felder) | `register_post_meta` + `register_graphql_field` im `finanzleser-blocks` Plugin. **Bei Sub-Feld `kategorie` evaluieren:** Standard-`category`-Taxonomie auch für `rechner`-CPT registrieren (`register_taxonomy_for_object_type`) — vereinheitlicht Beiträge + Rechner unter gleichem Kategorisierungs-Schema. Analoge Frage für `vergleich` und `checkliste`. |
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
