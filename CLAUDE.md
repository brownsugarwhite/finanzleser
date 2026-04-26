# CLAUDE.md – Projektkontext finanzleser.de

> Diese Datei gibt Claude Code den vollständigen Kontext über das Projekt.
> Lies sie zu Beginn jeder Session vollständig durch.
>
> Stand: **2026-04-26**

---

## 🧭 Projektübersicht

**Projekt:** Kompletter Relaunch von finanzleser.de
**Kunde:** Finconext GmbH, Frankfurt am Main
**Art:** Deutsches Finanzmagazin (Ratgeber, Rechner, Vergleiche, Checklisten)
**Themen:** Steuern, Finanzen, Versicherungen, Recht
**Sprache:** Deutsch (einsprachig)

**Aktueller Status (April 2026):**
- ✅ WordPress-Backend neu aufgesetzt, Custom Post Types + ACF eingerichtet
- ✅ Next.js Frontend weitestgehend fertig (Layout, Animationen, Slider, Megamenü, Article-Preview, KI-Section)
- ✅ Cleanup-Phasen 1–4 abgeschlossen (SEO-Fundament, Dead Code, GSAP-Konsolidierung, CSS-Hygiene)
- 🔄 **Aktuelle Roadmap:** Doku-Konsolidierung → Repo-Struktur → WP-Backend-Cleanup → Staging → ACF-Eliminierung. Siehe [ROADMAP.md](ROADMAP.md).
- 📅 **Live (IONOS) ist Legacy** mit alten ~1026 Beiträgen; neue Inhalte stehen lokal. Live wird zum Launch durch Staging-Inhalt ersetzt.

---

## 🏗️ Architektur

```
Headless WordPress + Next.js

Besucher → Netlify CDN → Next.js Frontend → WordPress GraphQL API → WordPress + MySQL (IONOS)
```

### WordPress (Backend/CMS)
- Lokale Entwicklung: `http://finanzleser.local` (Local by Flywheel)
- GraphQL Endpoint (lokal): `http://finanzleser.local/graphql`
- Live (Legacy): `https://www.finanzleser.de` (IONOS)
- Staging (in Vorbereitung): `https://staging.finanzleser.de`
- Zweck: Nur CMS für Redakteure – kein Frontend-Rendering

### Next.js (Frontend)
- Lokale Entwicklung: `http://localhost:3000`
- Hosting: Netlify (Free Tier)
- Deployment: Automatisch via GitHub Push (`main` → Production, `staging` → Staging-Preview)

### Claude Code MCP-Connector zu WordPress
- Custom Plugin unter `/Users/bsw/Projekte/plugins/Wordpress-Claude-Plugin-main/`
- Python-MCP-Server (`mcp/server.py`) registriert in `.mcp.json` (Projekt-lokal)
- Zugang via WP-Application-Password
- Tools: `wp_whoami`, `list_posts`, `create_post`, `update_post`, `list_pages`, `upload_media`, `list_categories`, `set_comment_status` u. v. m.

---

## 🛠️ Tech Stack

### Frontend
| Technologie | Zweck |
|---|---|
| Next.js 15 (App Router, TypeScript) | Framework, SSR/SSG/ISR, Routing |
| Tailwind CSS v4 | Styling-Engine (`@theme` + `@utility` direkt in `app/globals.css`, keine `tailwind.config.ts`) |
| GSAP + ScrollTrigger + ScrollToPlugin + MotionPathPlugin + Flip | Animationen, Scroll-Effekte, Slider |
| Embla Carousel | Slider-Engine |
| Lottie | Vektor-Animationen (FinanztoolsHero) |
| Netlify | Hosting, CDN, Preview Deployments |

### Backend
| Technologie | Zweck |
|---|---|
| WordPress | CMS für Redakteure |
| ACF Pro | Custom Fields (🚧 wird in Roadmap-Phase E entfernt, alles auf Gutenberg) |
| WPGraphQL | GraphQL API |
| WPGraphQL for ACF | ACF-Felder über GraphQL (🚧 entfällt mit Phase E) |
| Yoast SEO Premium | Meta-Daten |
| `finanzleser-blocks` (eigenes Plugin) | Custom Gutenberg Blocks (`finanzleser/rechner`, `/checkliste`, `/vergleich`) |
| `core-extend` (eigenes Plugin) | Custom Hooks/Filter |

### Tools
| Tool | Zweck |
|---|---|
| Figma | UI-Design |
| Figma MCP Server | Figma-Designs direkt in Claude Code lesen |
| Claude Code | Code-Generierung, MCP-Integration zu WordPress |
| Git + GitHub | Versionskontrolle |

---

## 🎨 Design-Prinzipien

**Visueller Stil:** Glassmorphism (Apple-Style Glass Effects), wenige Grundfarben + viele Transparenz-Abstufungen, Lottie-Animationen für UI, GSAP für komplexe Scroll/Morph-Animationen.

**Design Tokens** liegen in [app/tokens.css](app/tokens.css) (~30 aktive Tokens nach Phase-4-Audit). Kategorien:
- Brand (`--color-brand`, `--color-brand-secondary`)
- Text (`--color-text-primary`, `-medium`, `-secondary`)
- Bg (`--color-bg-page`, `-surface`, `-subtle`)
- Borders (`--color-border-default`)
- Glass (`--glass-white-{10,40}`, `--glass-dark-20`, `--glass-brand-{5,10,20}`, `--glass-blur-{sm,md}`)
- Tool-Farben (`--color-tool-rechner`, `-vergleiche`, `-checklisten`)
- Author-Gradients (1–6, dynamisch via `Author.tsx`)
- Visual-Fills (1–10, dynamisch via `VisualLottie.tsx`)

**Glassmorphism-Klassen** in [app/components.css](app/components.css) als `@utility`:
- `glass-card` — heller Glass-Effekt
- `glass-dark` — dunkler Glass-Effekt
- `glass-brand` — Brand-getönter Glass
- `glass-subtle` — minimaler Blur

**Typografie:**
- Headings: Merriweather (variable, via `next/font`)
- Body: Open Sans (variable width axis, via `next/font`)

---

## 📁 Projektstruktur (Next.js)

```
/app
  layout.tsx, page.tsx, providers.tsx
  globals.css, tokens.css, components.css, rechner.css
  sitemap.ts, robots.ts                       → SEO (Cleanup-Phase 1)
  /[kategorie]/page.tsx                       → Hauptkategorie + Legacy-Post-Resolver
  /[kategorie]/[sub]/page.tsx                 → Subkategorie
  /[kategorie]/[sub]/[slug]/page.tsx          → Beitrag
  /finanztools/page.tsx
  /finanztools/rechner/[slug]/page.tsx
  /finanztools/vergleiche/[slug]/page.tsx
  /finanztools/checklisten/[slug]/page.tsx
  /suche/page.tsx
  /api/*                                       → REST-Endpoints (rates, megamenu, etc.)

/components
  /ui          → Atoms (Button, MayaIcon, Spark, Author, …)
  /layout      → Header, Footer, Navigation, Sidebar, Wrapper
  /sections    → Hero, Slider, Article-Preview, Morphing, Teaser, TOC
  /animations  → (leer, geplant für Animation-Wrapper)
  /toc         → Dynamisches Inhaltsverzeichnis
  /seo         → JsonLd-Komponente
  /rechner     → 56 Rechner-Komponenten (lazy via dynamic())
  /vergleich   → VergleichEmbed
  /checkliste  → InteraktiveCheckliste, PDF-Export-Komponenten

/lib
  wordpress.ts          → GraphQL API-Funktionen
  types.ts              → TypeScript Interfaces
  seo.ts                → buildMetadata-Helper, SITE_URL, stripHtml
  urls.ts               → URL-Builder pro Content-Typ
  cn.ts                 → className-Joiner (clsx-style)
  gsapConfig.ts         → ZENTRALE GSAP-Plugin-Registrierung (default-import gsap)
  categories.ts         → MAIN_CATEGORY_SLUGS, isMainCategory
  navItems.ts           → Nav-Konfiguration
  NavContext.tsx        → Nav-Provider
  scrollToBookmarkSticky.ts
  html-utils.ts         → HTML-Entity-Decoding
  content-utils.ts
  anbieter-utils.ts
  checklisteParser.ts   → PDF-Parser für Checklisten
  /calculators/         → Rechner-Logik (Pure-JS-Funktionen)
  /hooks/               → useRates, useRechner, useRechnerState (Daten-Hooks)

/hooks                  → useNavPill, useSliderPill, useRevolverSlider (Animation-Hooks)
                          🚧 Doppelung mit lib/hooks/ wird in Roadmap-Phase B aufgelöst

/acf-json               → group_rechner_config.json (🚧 wird in Phase E gelöscht)

/scripts                → Migrations-Scripts (seed-*, update-*, convert-*, fix-*)
                          🚧 wird in Roadmap-Phase B in scripts/migrations/ + scripts/data/ getrennt

/docs                   → WORDPRESS_ACF_SETUP.md, beitraege_kategorien.md, etc.
                          siehe ROADMAP.md für aktuellen Stand
```

> **Hinweis Tailwind v4:** Keine `tailwind.config.ts` – alle Tokens und Utilities
> direkt in `app/globals.css` via `@theme inline` und `@utility`.

---

## 🗺️ URL-Struktur

### KRITISCH: URL-Erhalt der Live-Beiträge bei Cutover
**~1026 Beitrags-URLs auf Live (IONOS)** sind bei Google indexiert. Beim Launch werden alte URLs durch das neue System abgelöst, **bestehende URL-Pfade müssen erhalten bleiben** (sofern Beitrag noch aktiv).

42 explizite 301-Redirects sind in [next.config.ts](next.config.ts) hinterlegt für zusammengefasste/umgezogene Beiträge.

### Aktuelle Routen
| URL | Typ | Beschreibung |
|---|---|---|
| `/` | Landing | Hero, Kategorie-Slider, FinanztoolsHero, Teaser |
| `/finanzen/` | Hauptkategorie | + Subkategorien |
| `/finanzen/geldanlage/` | Subkategorie | Beitrags-Liste |
| `/finanzen/geldanlage/festgeld/` | Beitrag | Artikel mit eingebetteten Tools |
| `/finanztools/` | Tool-Übersicht | |
| `/finanztools/rechner/[slug]/` | Rechner | Einzelner interaktiver Rechner |
| `/finanztools/vergleiche/[slug]/` | Vergleich | Aktuell 22 reale Vergleiche |
| `/finanztools/checklisten/[slug]/` | Checkliste | 202 interaktive Checklisten |
| `/suche/` | Suche | Volltextsuche |
| `/[anbieter-slug]/` | Anbieter | 147 Versicherer-Kontaktseiten (Legacy-Pfad-Pattern) |
| `/sitemap.xml` | SEO | Dynamisch aus WP, ISR 1h |
| `/robots.txt` | SEO | |

ISR mit `revalidate = 3600` auf allen dynamischen Routen (Cleanup-Phase 1).

---

## 📊 Content-Typen & Felder

### Custom Post Types (WordPress)
```
post        → Standard-Beiträge (Ratgeber-Artikel)
rechner     → Interaktive Finanzrechner (56 lokal)
vergleich   → Vergleichstabellen (22 aktive + Block-Embed)
checkliste  → Interaktive Checklisten (202)
anbieter    → Versicherer-Kontaktseiten (147)
```

### 🚧 ACF-Feldgruppen (in Migration zu Gutenberg, siehe Roadmap-Phase E)

Aktuell noch in WordPress:
- `beitragFelder` (Untertitel, Zusammenfassung, PDF, Featured-Tool-Flag, Relationships zu Rechner/Vergleich/Checkliste)
- `rechnerFelder` (Typ, Beschreibung, Konfiguration, Icon, Kategorie)
- `vergleichFelder` (Typ, Beschreibung, Anbieter-Repeater)
- `checklisteFelder` (Beschreibung, Punkte-Repeater, PDF)
- `kategorieFelder` (Bild)
- ACF Options Page „Rechner-Konfiguration" (13 Werte: Mindestlohn, Kindergeld, BBG, etc.)

**Migrations-Strategie (Phase E):**
- `beitragUntertitel` → bestehendes `wp-subtitle` Plugin
- Relationships → bereits über Gutenberg-Block-Kommentare im `post_content` (`<!-- wp:finanzleser/rechner {"slug":"..."} -->`)
- Repeater → `register_post_meta` mit JSON-Array
- Rechner-Konfiguration → entweder WP-Options oder `config/rates.json` im Repo

### Gutenberg-Blocks (`finanzleser-blocks` Plugin)
Bereits aktiv:
- `finanzleser/rechner` (statisch, `slug`-Attribut)
- `finanzleser/vergleich` (statisch, `slug`-Attribut)
- `finanzleser/checkliste` (dynamisch, `render_callback`)

Frontend-Parser: [components/sections/ArticleContent.tsx](components/sections/ArticleContent.tsx) parst die `<!-- wp:finanzleser/* -->` Block-Kommentare aus `post_content` und rendert die jeweiligen React-Komponenten.

---

## 🔌 GraphQL API

Endpoint: `http://finanzleser.local/graphql` (lokal) | `https://www.finanzleser.de/graphql` (live)

Zentrale Funktionen in [lib/wordpress.ts](lib/wordpress.ts) (~22 exportierte Functions):
- `getAllPosts()`, `getLatestPosts()`, `getPostBySlug()`, `getPostsByCategory()`
- `getCategoryWithChildren()`, `getCategoryBySlug()`
- `getNavItems()`, `getToolCategories()`
- `getAllRechner()`, `getRechnerBySlug()`
- `getAllChecklisten()`, `getChecklisteBySlug()`
- `getAllVergleiche()`
- `getAllAnbieter()`, `getAnbieterBySlug()`
- `getRechnerConfig()` (REST: `/wp-json/finanzleser/v1/rechner-config`)

---

## 🧩 Komponenten-Prinzip

```
Atoms      → Button, Icon, Badge, Input, Tag (components/ui/)
Molecules  → Card, NavItem, ToolCard
Organisms  → Navigation, Hero, Slider, ArticleHeader (components/layout/, sections/)
Templates  → PostLayout, CategoryLayout, ToolLayout (components/layout/)
Pages      → Next.js App-Router-Pages (app/)
```

### GSAP-Konvention (seit Cleanup-Phase 3)
**ALLE GSAP-Imports kommen aus `@/lib/gsapConfig`** — niemals direkt aus `gsap` oder `gsap/...`. Das stellt sicher, dass es nur eine einzige Modul-Instanz von gsap + Plugins gibt:

```typescript
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger, Flip } from "@/lib/gsapConfig";
```

`lib/gsapConfig.ts` registriert alle Plugins eager beim Modul-Load — keine `gsap.registerPlugin()`-Aufrufe mehr in einzelnen Komponenten.

### Class-Name-Konvention
Mehrfach-Klassen via `cn()` aus [lib/cn.ts](lib/cn.ts):
```typescript
import { cn } from "@/lib/cn";
className={cn("base", isActive && "active", extra)}
```

---

## 📋 Roadmap

Aktuelle Phasen siehe [ROADMAP.md](ROADMAP.md). Kurzfassung:

**✅ Cleanup-Phasen 1–4 (April 2026, abgeschlossen):**
1. SEO-Fundament (sitemap, robots, Metadata, JSON-LD)
2. Dead Code & Dependencies (`framer-motion`, `_archive`, TS-Errors)
3. GSAP-Konsolidierung (`lib/gsapConfig.ts` als Single Source)
4. CSS-Hygiene (Token-Audit, `cn`-Utility, Layout-Inline-Styles raus)

**🔄 Aktuelle Phasen A–E:**
- A — Doku-Konsolidierung (diese Phase)
- B — Repo-Struktur aufräumen
- C — WordPress-Backend Plugin-Cleanup
- D — Staging-Umgebung einrichten (`staging.finanzleser.de`)
- E — ACF → Gutenberg-Migration

**📅 Nach Launch:**
- KI-Agent-Integration (Zendesk Conversations API + PDF-Wissensdatenbank)
- Tailwind-Utility-Klassen-Eliminierung (alte Cleanup-Phase 5, 29 Dateien)
- Pill-Hooks-Deduplikation (alte Cleanup-Phase 6)

---

## 👨‍💻 Über den Entwickler

- **Erfahrener Grafiker** mit starken HTML/CSS-Kenntnissen
- **Erfahrung mit:** Figma, Webflow, Adobe Creative Cloud, GSAP, Barba.js
- **Lernt aktiv:** React, Next.js, TypeScript
- **Arbeitsweise:** Visuell → Design in Figma → Code via Claude Code
- **Bevorzugt:** klares CSS (mag Tailwind-Utility-Klassen weniger), atomare Refactor-Schritte mit visueller Verifikation, sicheres Vorgehen mit Snapshot-Tags + Branches

---

## 🚨 Wichtige Regeln

1. **URL-Erhalt:** bestehende Beitrags-URLs nie ohne 301-Redirect ändern
2. **WordPress-Dateien gehören nicht ins Git** — nur Next.js-Frontend
3. **ACF JSON Sync** nutzen solange ACF lebt — Felder als JSON in `acf-json/` versionieren
4. **Mobile-first** — alle Komponenten zuerst für Mobile
5. **Deutsche Sprache** — `lang="de"`, alle UI-Texte auf Deutsch
6. **Performance** — SSG bevorzugen, ISR (1h) für dynamische Inhalte
7. **Glassmorphism sparsam auf Mobile** — max 3-4 blur-Elemente gleichzeitig
8. **Atomare Sub-Commits** bei größeren Refactorings — pro Schritt User-Verifikation
9. **GSAP-Imports aus `@/lib/gsapConfig`** — niemals direkt aus `gsap`
10. **Gutenberg statt ACF für Neues** — siehe Memory `feedback_gutenberg_over_acf.md`

---

## 📂 Dokumentation

- [ROADMAP.md](ROADMAP.md) — Aktueller Phasen-Stand
- [README.md](README.md) — Quickstart
- `docs/WORDPRESS_ACF_SETUP.md` — ACF Options Page Setup (⚠️ wird mit Phase E obsolet)
- `docs/beitraege_kategorien.md` — Beitrags-Inventar (1026 Live-Bestand)

Memory (Cross-Session-Notizen): siehe `/Users/bsw/.claude/projects/-Users-bsw-Projekte-finanzleser/memory/MEMORY.md`

---

*Zuletzt aktualisiert: 2026-04-26 (Roadmap-Phase A: Doku-Konsolidierung)*
