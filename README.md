# finanzleser.de Frontend

Next.js 15 Frontend für **finanzleser.de** — deutsches Finanzmagazin der Finconext GmbH.
Headless-Setup mit WordPress als CMS, GraphQL-API und Netlify-Hosting.

## Stack

- **Next.js 15** (App Router, TypeScript) · **Tailwind CSS v4** · **GSAP** · **Embla Carousel** · **Lottie**
- Backend: **WordPress + WPGraphQL + ACF Pro** (ACF wird in Roadmap-Phase E entfernt)
- Hosting: **Netlify**

## Quickstart

```bash
# Dependencies installieren
npm install

# Lokale Env-Variablen setzen (.env.local)
echo "WORDPRESS_API_URL=http://finanzleser.local/graphql" > .env.local

# Dev-Server starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

**Voraussetzung:** WordPress läuft lokal unter `http://finanzleser.local` (Local by Flywheel) mit WPGraphQL + ACF Pro + WPGraphQL-ACF + `finanzleser-blocks` Plugin aktiv.

## Skripte

```bash
npm run dev      # Dev-Server (Hot Reload)
npm run build    # Production-Build
npm run start    # Production-Server lokal
npm run lint     # ESLint (aktuell deaktiviert in Build wg. Bestand-Issues)
```

## Architektur

```
Besucher → Netlify CDN → Next.js → WordPress GraphQL → MySQL
```

Frontend rendert per SSR/SSG/ISR, holt Daten zur Build-/Request-Zeit aus WordPress. ISR (`revalidate = 3600`) auf allen dynamischen Routen.

## Wichtige Dateien

- [CLAUDE.md](CLAUDE.md) — Vollständiger Projektkontext (für Claude Code Sessions)
- [ROADMAP.md](ROADMAP.md) — Phasen-Status
- [next.config.ts](next.config.ts) — 42 Legacy-301-Redirects, Image-Patterns, Build-Config
- [lib/wordpress.ts](lib/wordpress.ts) — Zentrale GraphQL-Schicht
- [lib/gsapConfig.ts](lib/gsapConfig.ts) — Single Source für GSAP + Plugins (immer von hier importieren)
- [lib/seo.ts](lib/seo.ts) — Metadata-Helper für `generateMetadata()`

## Code-Konventionen

- **GSAP-Imports:** ausschließlich aus `@/lib/gsapConfig`
- **Class-Names mehrfach:** via `cn()` aus `@/lib/cn`
- **Neue Felder:** Gutenberg Blocks statt ACF (siehe ROADMAP Phase E)

## Repository

`https://github.com/brownsugarwhite/finanzleser`

## Live & Staging

- **Live:** https://www.finanzleser.de (Legacy WP, wird beim Launch ersetzt)
- **Staging:** `staging.finanzleser.de` (in Vorbereitung, Roadmap-Phase D)
- **Lokal:** `http://finanzleser.local` (WP) · `http://localhost:3000` (Next.js)
