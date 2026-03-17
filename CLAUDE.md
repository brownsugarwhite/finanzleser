# CLAUDE.md – Projektkontext finanzleser.de

> Diese Datei gibt Claude Code den vollständigen Kontext über das Projekt.
> Lies sie zu Beginn jeder Session vollständig durch.

---

## 🧭 Projektübersicht

**Projekt:** Kompletter Relaunch von finanzleser.de
**Kunde:** Finconext GmbH, Frankfurt am Main
**Art:** Deutsches Finanzmagazin (Ratgeber, Rechner, Vergleiche, Checklisten)
**Themen:** Steuern, Finanzen, Versicherungen
**Sprache:** Deutsch (einsprachig)
**Status:** Phase 1 abgeschlossen, Phase 2 (Design & Frontend) startet

---

## 🏗️ Architektur

```
Headless WordPress + Next.js

Besucher → Netlify CDN → Next.js Frontend → WordPress GraphQL API → WordPress + MySQL (IONOS)
```

### WordPress (Backend/CMS)
- Läuft lokal: `http://finanzleser.local`
- GraphQL Endpoint: `http://finanzleser.local/graphql`
- Live: `https://www.finanzleser.de` (IONOS Hosting)
- Zweck: Nur CMS für Redakteure – kein Frontend

### Next.js (Frontend)
- Lokale Entwicklung: `http://localhost:3000`
- Hosting: Netlify (Free Tier)
- Deployment: Automatisch via GitHub Push

---

## 🛠️ Tech Stack

### Frontend
| Technologie | Zweck |
|---|---|
| Next.js 15 (App Router, TypeScript) | Framework, SSR/SSG/ISR, Routing |
| Tailwind CSS | Styling, Responsive Design |
| GSAP + ScrollTrigger | Animationen, Scroll-Effekte, Slider |
| Framer Motion | Page Transitions |
| Netlify | Hosting, CDN, Preview Deployments |

### Backend
| Technologie | Zweck |
|---|---|
| WordPress | CMS für Redakteure |
| ACF Pro | Custom Fields für alle Content-Typen |
| WPGraphQL | GraphQL API |
| WPGraphQL for ACF | ACF-Felder über GraphQL |
| Yoast SEO | Meta-Daten über API |

### Design & Development Tools
| Tool | Zweck |
|---|---|
| Figma | UI-Design, Design System, Komponenten |
| Figma MCP Server | Figma-Designs direkt in Claude Code lesen |
| Claude Code | Code-Generierung, Komponenten-Entwicklung |
| Claude Chat | Planung, Strategie, Architektur-Entscheidungen |
| Git + GitHub | Versionskontrolle, Netlify-Integration |

---

## 🎨 Design-Prinzipien

### Visueller Stil
- **Glassmorphism / Apple-Style Glass Effects**
- Wenige Grundfarben + viele Transparenz-Abstufungen (~50 Farbvariablen total)
- Lottie-Animationen für UI-Elemente
- GSAP für komplexe mehrstufige Animationen
- Framer Motion für Page Transitions

### Design System (Figma)
Das Design System wird in Figma aufgebaut und via Figma MCP Server direkt in Claude Code gelesen.

**Farb-Struktur:**
```
Keine Primitives – direkte Semantic Colors
~50 Variablen total inkl. Glassmorphism-Zustände

Kategorien:
→ brand/         (Primärfarbe + Transparenzstufen)
→ text/          (primary, secondary, inverse, link)
→ bg/            (page, surface, subtle, inverse)
→ border/        (default, strong, inverse)
→ glass/white/   (5, 10, 20, 40, 60)
→ glass/dark/    (5, 10, 20, 40, 60)
→ glass/brand/   (5, 10, 20, 40, 60)
→ glass/blur/    (sm: 4px, md: 12px, lg: 24px, xl: 40px)
→ status/        (success, error, warning)
→ overlay/       (light, dark, blur)
```

**Typografie:**
- Headings: Outfit (Google Fonts)
- Body: Inter (Google Fonts)
- Basis-Schriftgröße: 16px

**Spacing:** 4px Basis-Einheit (spacing/1 = 4px, spacing/2 = 8px etc.)

### Figma → Code Workflow
1. Design-Komponente in Figma fertigstellen
2. Figma MCP Server verbunden mit Claude Code
3. Prompt: "Lies Figma Frame [LINK] und erstelle React-Komponente mit Tailwind CSS"
4. Claude Code generiert Komponente basierend auf Figma-Design
5. Animationen werden schriftlich als GSAP-Annotation spezifiziert

### Animations-Annotation Format
```
🎬 ANIMATION: [Name]
─────────────────────
Trigger:    Beim Scrollen / Beim Laden / On Hover
Start:      Y +40px, Opacity 0
Ende:       Y 0px, Opacity 1
Duration:   0.6s
Ease:       power2.out
Stagger:    0.1s (falls mehrere Elemente)
GSAP:       gsap.from(".card", { y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" })
```

---

## 📁 Projektstruktur (Next.js)

```
/app
  page.tsx                              → Landing Page
  /suche/page.tsx                       → Suchseite
  /finanztools/page.tsx                 → Tools-Übersicht
  /finanztools/rechner/page.tsx         → Alle Rechner
  /finanztools/rechner/[slug]/page.tsx  → Einzelner Rechner
  /finanztools/vergleiche/[slug]/page.tsx
  /finanztools/checklisten/[slug]/page.tsx
  /[kategorie]/page.tsx                 → Hauptkategorie
  /[kategorie]/[sub]/page.tsx           → Subkategorie
  /[kategorie]/[sub]/[slug]/page.tsx    → Einzelner Beitrag

/components
  /ui          → Buttons, Cards, Inputs, Badge, Icons
  /layout      → Header, Footer, Navigation, Sidebar
  /sections    → Hero, Slider, Vergleich, Rechner, Checkliste
  /animations  → GSAP-Wrapper, ScrollTrigger, Transitions
  /toc         → Dynamisches Inhaltsverzeichnis

/lib
  wordpress.ts → GraphQL API-Funktionen
  types.ts     → TypeScript Interfaces
  gsapConfig.ts → Zentrale GSAP-Initialisierung
```

---

## 🗺️ URL-Struktur

### KRITISCH: URL-Erhalt bestehender Beiträge
**Alle ~100 bestehenden Beitrags-URLs müssen exakt erhalten bleiben!**
Diese sind bei Google indexiert und haben SEO-Autorität aufgebaut.

```
Beispiel:
Alt: finanzleser.de/festgeld/
Neu: finanzleser.de/festgeld/ ← GLEICH BLEIBEN!
```

Neue Beiträge folgen der hierarchischen Struktur:
```
/[hauptkategorie]/[subkategorie]/[slug]/
```

### Seitentypen
| URL | Typ | Beschreibung |
|---|---|---|
| `/` | Landing Page | Hero, Kategorie-Slider, Featured |
| `/finanzen/` | Hauptkategorie | Alle Beiträge der Kategorie |
| `/finanzen/geldanlage/` | Subkategorie | Gefilterte Beiträge |
| `/finanzen/geldanlage/festgeld/` | Beitrag | Artikel mit Tools |
| `/finanztools/` | Tool-Übersicht | Alle Tools |
| `/finanztools/rechner/` | Kategorie | Alle Rechner |
| `/finanztools/rechner/[slug]/` | Tool | Einzelner Rechner |
| `/suche/` | Suche | Volltextsuche mit Filtern |

### Technische Umsetzung URL-Erhalt
- Next.js Catch-All Routes für dynamische URL-Auflösung
- Jede URL wird gegen WordPress-Datenbank geprüft
- 301-Redirects nur für Kategorie-Seiten die sich ändern

---

## 📊 Content-Typen & ACF-Felder

### Custom Post Types (WordPress)
```
post        → Standard Beiträge (Ratgeber-Artikel)
rechner     → Interaktive Finanzrechner
vergleich   → Vergleichstabellen
checkliste  → Interaktive Checklisten
```

### ACF Feldgruppen

**Beitrag:**
```
beitrag_untertitel        Text
beitrag_zusammenfassung   Textarea
beitrag_pdf               File (PDF)
beitrag_featured_tool     True/False
beitrag_rechner           Relationship → Rechner CPT
beitrag_vergleich         Relationship → Vergleich CPT
beitrag_checkliste        Relationship → Checkliste CPT
```

**Rechner:**
```
rechner_typ               Select (steuer, brutto_netto, festgeld, tagesgeld)
rechner_beschreibung      Textarea
rechner_icon              Image (URL)
```

**Vergleich:**
```
vergleich_typ             Select (festgeld, tagesgeld, kfz, strom, gas)
vergleich_beschreibung    Textarea
vergleich_anbieter        Repeater
  └ anbieter_name         Text
  └ anbieter_bewertung    Number
  └ anbieter_link         URL
```

**Checkliste:**
```
checkliste_beschreibung   Textarea
checkliste_punkte         Repeater
  └ punkt_text            Text
  └ punkt_details         Textarea
  └ punkt_pflicht         True/False
checkliste_pdf_generierung True/False
```

---

## 🔌 GraphQL API

### Basis-Abfragen

**Alle Beiträge:**
```graphql
query GetPosts {
  posts {
    nodes {
      id
      title
      slug
      date
      excerpt
      featuredImage {
        node { sourceUrl }
      }
      categories {
        nodes { name slug }
      }
    }
  }
}
```

**Einzelner Beitrag mit ACF:**
```graphql
query GetPost($slug: String!) {
  postBy(slug: $slug) {
    title
    content
    beitragFelder {
      beitragUntertitel
      beitragZusammenfassung
      beitragPdf { mediaItemUrl }
      beitragFeaturedTool
      beitragRechner {
        ... on Rechner {
          title
          rechnerFelder {
            rechnerTyp
            rechnerBeschreibung
          }
        }
      }
    }
  }
}
```

---

## 🧩 Komponenten-Prinzip

### Modularer Aufbau
Jede Komponente ist eigenständig entwickel- und testbar:

```
Atoms      → Button, Icon, Badge, Input, Tag
Molecules  → Card, NavItem, ToolCard
Organisms  → Navigation, Hero, Slider, ArticleHeader
Templates  → PostLayout, CategoryLayout, ToolLayout
Pages      → Fertige Next.js Seiten
```

### Glassmorphism Komponente (Basis)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.20);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.20);
}
```

### Dynamisches Inhaltsverzeichnis
Jede Beitragsseite hat ein automatisches TOC:
- Parst H2/H3 Überschriften automatisch
- Sticky positioniert
- Intersection Observer für aktiven Abschnitt
- Smooth Scroll
- Mobile: Dropdown

---

## 📋 Entwicklungs-Phasen

### ✅ Phase 1: Aufräumen & Fundament (ABGESCHLOSSEN)
- WordPress lokal aufgesetzt (Local by Flywheel)
- Plugins aufgeräumt
- WPGraphQL + ACF Pro installiert
- Custom Post Types angelegt (rechner, vergleich, checkliste)
- ACF Feldgruppen angelegt

### 🔄 Phase 2: Design & Frontend (AKTUELL)
Reihenfolge:
1. Design Tokens in Figma fertigstellen
2. Navigation/Menü
3. Hero Section
4. Kategorie-Slider (Apple-Style, GSAP)
5. Beitrags-Cards
6. Beitragsseite mit TOC
7. Eingebettete Tools
8. Kategorie-Seiten
9. Finanztools-Seiten
10. Suchseite
11. Footer
12. Page Transitions

### 📅 Phase 3: Rechner, Checklisten & Inhalte
- React-Rechner-Komponenten
- Interaktive Checklisten
- Vergleichstabellen
- Content-Migration (~100 Beiträge)

### 📅 Phase 4: KI-Agent
- Eigenes Chat-Widget (React-Komponente)
- Zendesk Conversations API
- Wissensdatenbank: Tausende Versicherungs-PDFs

---

## 👨‍💻 Über den Entwickler

- **Erfahrener Grafiker** mit starken HTML/CSS-Kenntnissen
- **Erfahrung mit:** Figma, Webflow, Adobe Creative Cloud, GSAP, Barba.js
- **Neu bei:** React, Next.js, TypeScript
- **Arbeitsweise:** Visuell → Design in Figma → Code via Claude Code
- **Wichtig:** Erklärungen sollten praktisch und direkt sein, keine unnötige Komplexität

---

## 🔄 Workflow

### Claude Chat (Planung)
- Strategie und Architektur-Entscheidungen
- ACF-Felder und Content-Struktur planen
- Animations-Konzepte besprechen
- Fehleranalyse
- Nächste Schritte priorisieren

### Claude Code (Entwicklung)
- Next.js-Projekt und Struktur
- React-Komponenten aus Figma-Designs
- GSAP-Animationen implementieren
- GraphQL API-Anbindung
- ACF Felder via JSON verwalten
- Git Commits und Deployments

### Figma (Design)
- Design System und Variables
- Komponenten-Bibliothek
- Seitenlayouts
- Animations-Annotationen

---

## 🚨 Wichtige Regeln

1. **URL-Erhalt ist absolut kritisch** – bestehende Beitrags-URLs NIE ändern
2. **WordPress-Dateien gehören nicht auf GitHub** – nur Next.js
3. **ACF JSON Sync nutzen** – Felder als JSON versionieren
4. **Mobile-first** – alle Komponenten zuerst für Mobile
5. **Deutsche Sprache** – `lang="de"`, alle UI-Texte auf Deutsch
6. **Performance** – SSG bevorzugen, ISR für dynamische Inhalte
7. **Glassmorphism sparsam auf Mobile** – max 3-4 blur-Elemente gleichzeitig

---

## 📝 Beispiel-Prompts

```
"Erstelle eine React-Komponente für einen 
horizontalen Slider mit GSAP ScrollTrigger.
Karten sollen von rechts reinfaden mit 0.15s Stagger."

"Lies Figma Frame [LINK] und erstelle daraus
eine responsive React-Komponente mit Tailwind CSS.
Nutze die Glassmorphism-Basis-Klassen."

"Erstelle eine GraphQL-Funktion die alle Beiträge
einer Kategorie abruft. ISR mit 60s Revalidierung."

"Füge ein neues ACF Feld 'Lesezeit' zur
Feldgruppe 'Beitrag' hinzu. Schreibe die
JSON-Datei direkt in acf-json/."
```

---

*Zuletzt aktualisiert: März 2026 – Phase 1 abgeschlossen*
