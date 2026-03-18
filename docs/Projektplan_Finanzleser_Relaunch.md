# Projektplan – finanzleser.de
## Kompletter Relaunch als Headless WordPress + Next.js

**Erstellt:** 08. März 2026  
**Projekt:** Finanzleser.de – Digitales Finanzmagazin  
**Betreiber:** Finconext GmbH, Frankfurt am Main  
**Hosting:** IONOS (WordPress Backend) + Netlify (Frontend)  
**Status:** Phase 1 abgeschlossen – Phase 2 läuft

---

## Inhaltsverzeichnis

1. Projektzusammenfassung
2. Technologie-Stack & Architektur
3. Seitenstruktur & Navigation
4. Content-Typen & ACF-Feldstruktur
5. Sichere Arbeitsumgebung
6. Plugin-Analyse
7. Phase 1: Aufräumen & Fundament
8. Phase 2: Design & Frontend
9. Phase 3: Rechner, Checklisten & Inhalte
10. Phase 4: KI-Agent Integration
11. Go-Live Strategie
12. Kostenübersicht
13. Workflow: Chat vs. Claude Code

---

## 1. Projektzusammenfassung

finanzleser.de ist ein bestehendes digitales Finanzmagazin der Finconext GmbH mit Ratgebern, Rechnern, Vergleichen und Checklisten zu den Themen Steuern, Finanzen und Versicherungen. Die Seite wird aktuell mit WordPress und WPBakery Page Builder betrieben und soll komplett neu gestaltet werden.

### Entscheidung: Headless WordPress + Next.js

Nach Analyse aller Optionen fällt die Entscheidung auf Headless WordPress mit Next.js als Frontend. WordPress bleibt als CMS für die Redaktion bestehen, das gesamte Frontend wird in Next.js neu gebaut.

**Begründung:**
- Volle Kontrolle über Design, Animationen und Seitenübergänge (GSAP + ScrollTrigger)
- Perfekte Performance durch statische Seitengenerierung und CDN-Delivery
- Figma-to-Code Workflow mit Figma MCP und Claude Code
- Modularer Aufbau mit React-Komponenten: einzeln entwickel- und testbar
- Zukunftssicher für Phase 4 (KI-Agent) und weitere Erweiterungen
- Server-Side Rendering für exzellentes SEO
- Saubere Trennung: Redaktion arbeitet in WordPress, Frontend ist unabhängig

### Projektumfang
- Ca. 100 bestehende Beiträge in verschiedenen Kategorien
- Eigene Rechner, Vergleiche und Checklisten (bisher extern eingebunden)
- Sprache: Deutsch (einsprachig)
- Keine Werbung geplant
- Dynamisches Inhaltsverzeichnis auf Beitragsseiten
- Bestehendes Brandhandbuch in Figma (in Arbeit)
- KI-Agent aus Zendesk-Wissensdatenbank (Phase 4)
- URL-Erhalt: Alle bestehenden URLs bleiben erhalten (SEO-Schutz)
- Inhaltliche Komplettüberarbeitung aller ~100 Beiträge

---

## 2. Technologie-Stack & Architektur

### Frontend

| Technologie | Zweck |
|---|---|
| Next.js 15 (App Router, TypeScript) | Framework, SSR/SSG/ISR, Routing |
| Tailwind CSS | Styling, Responsive Design |
| GSAP + ScrollTrigger | Animationen, Scroll-basierte Effekte, Apple-Style Slider |
| Framer Motion | Page Transitions zwischen Seiten |
| Netlify (Free-Tier) | Hosting, CDN, Preview Deployments für Kundenpräsentation |

### Backend (CMS)

| Technologie | Zweck |
|---|---|
| WordPress (bestehend) | Content Management System für Redakteure |
| ACF Pro | Custom Fields für Rechner, Checklisten, Vergleiche |
| WPGraphQL | GraphQL API – liefert Daten ans Frontend |
| WPGraphQL for ACF | ACF-Felder über GraphQL verfügbar machen |
| Yoast SEO | Meta-Daten, Sitemap-Daten über API |
| IONOS Hosting | WordPress-Backend Hosting (bestehend) |

### Entwicklungswerkzeuge

| Tool | Einsatz |
|---|---|
| Figma | UI-Design, Brandhandbuch, Komponenten-Bibliothek |
| Figma MCP Server | Verbindet Figma-Designs direkt mit Claude Code |
| Webflow (optional) | Prototyping komplexer Scroll-Animationen |
| Claude Code | Code-Generierung, Komponenten-Entwicklung |
| Claude Chat | Planung, Strategie, Fehleranalyse, Recherche |
| Git + GitHub | Versionskontrolle, Netlify-Integration |

### Architektur

```
Besucher → Netlify CDN → Next.js (statische + dynamische Seiten)
        → WordPress GraphQL API → WordPress + MySQL auf IONOS
```

---

## 3. Seitenstruktur & Navigation

### URL-Struktur

| URL-Pfad | Seitentyp | Beschreibung |
|---|---|---|
| `/` | Landing Page | Hero, Kategorie-Slider, Featured Beiträge |
| `/finanzen/` | Hauptkategorie | Alle Beiträge der Kategorie Finanzen |
| `/finanzen/geldanlage/` | Subkategorie | Gefilterte Beiträge zur Geldanlage |
| `/finanzen/geldanlage/festgeld-ratgeber/` | Beitrag | Einzelner Beitrag mit Rechner, Vergleich, Checkliste |
| `/finanztools/` | Übersicht | Alle Tools: Rechner, Vergleiche, Checklisten |
| `/finanztools/rechner/` | Tool-Kategorie | Alle Rechner als Übersicht |
| `/finanztools/rechner/steuerrechner/` | Einzelnes Tool | Eigenständige Rechner-Seite |
| `/finanztools/vergleiche/` | Tool-Kategorie | Alle Vergleiche als Übersicht |
| `/finanztools/checklisten/` | Tool-Kategorie | Alle Checklisten als Übersicht |
| `/suche/` | Suchseite | Volltextsuche mit Filtern |

### ⚠️ URL-Erhalt: Bestehende Beiträge

**WICHTIG: Alle bestehenden ~100 Beitrags-URLs bleiben exakt erhalten.**

Die bestehenden Beiträge sind bereits bei Google indexiert und haben über die Zeit SEO-Autorität aufgebaut. Die URLs dürfen sich nicht verändern. Die neue hierarchische Struktur gilt nur für neue Beiträge nach dem Relaunch.

**Technische Umsetzung:**
- Next.js Catch-All Routes: Jede URL wird dynamisch gegen die WordPress-Datenbank geprüft
- WordPress speichert den Original-Permalink jedes Beitrags – dieser wird 1:1 im Frontend abgebildet
- Neue Beiträge erhalten die hierarchische Struktur automatisch
- Für Kategorie-Seiten mit neuer Struktur werden 301-Redirects eingerichtet

### Seitentypen im Detail

**Landing Page (/):**
- Hero-Section mit Hauptanimation
- Horizontale Slider pro Kategorie (Apple-Style, GSAP ScrollTrigger)
- Featured Finanztools
- Aktuelle Beiträge

**Beitragsseite:**
- Dynamisches Inhaltsverzeichnis (sticky, scrollt mit, hebt aktiven Abschnitt hervor)
- Beitragsinhalt mit formatierten Abschnitten
- Eingebetteter Rechner (falls vorhanden, per ACF Relationship-Feld zugeordnet)
- Eingebetteter Vergleich (falls vorhanden)
- Eingebettete Checkliste (falls vorhanden)
- PDF-Download Button
- Verwandte Beiträge

---

## 4. Content-Typen & ACF-Feldstruktur

### Custom Post Types

| Post Type | Slug | Beschreibung |
|---|---|---|
| Beitrag | `post` (Standard) | Ratgeber-Artikel mit optionalen Tools |
| Rechner | `rechner` | Interaktive Finanzrechner |
| Vergleich | `vergleich` | Vergleichstabellen (Festgeld, KFZ, etc.) |
| Checkliste | `checkliste` | Interaktive Checklisten mit Checkboxen |

### ACF-Felder: Beitrag

| Feldname | Feldtyp | Beschreibung |
|---|---|---|
| `beitrag_untertitel` | Text | Optionaler Untertitel |
| `beitrag_zusammenfassung` | Textarea | Kurzzusammenfassung für Slider-Cards |
| `beitrag_rechner` | Relationship (Rechner) | Zugeordneter Rechner (optional) |
| `beitrag_vergleich` | Relationship (Vergleich) | Zugeordneter Vergleich (optional) |
| `beitrag_checkliste` | Relationship (Checkliste) | Zugeordnete Checkliste (optional) |
| `beitrag_pdf` | File (PDF) | PDF zum Download |
| `beitrag_featured_tool` | True/False | Tool prominent anzeigen |

### ACF-Felder: Rechner

| Feldname | Feldtyp | Beschreibung |
|---|---|---|
| `rechner_typ` | Select | Art: Steuer, Brutto-Netto, Festgeld, etc. |
| `rechner_beschreibung` | Textarea | Kurzbeschreibung für Übersichtsseite |
| `rechner_konfiguration` | JSON/Textarea | Parameter und Berechnungslogik |
| `rechner_icon` | Image (URL) | Icon für die Darstellung |
| `rechner_kategorie` | Taxonomy | Zuordnung zur Hauptkategorie |

### ACF-Felder: Vergleich

| Feldname | Feldtyp | Beschreibung |
|---|---|---|
| `vergleich_typ` | Select | Art: Festgeld, Tagesgeld, KFZ, Strom, Gas |
| `vergleich_beschreibung` | Textarea | Kurzbeschreibung |
| `vergleich_anbieter` | Repeater | Liste der Anbieter |
| └ `anbieter_name` | Text | Name des Anbieters |
| └ `anbieter_bewertung` | Number | Bewertung 1–5 |
| └ `anbieter_link` | URL | Link zum Anbieter |

### ACF-Felder: Checkliste

| Feldname | Feldtyp | Beschreibung |
|---|---|---|
| `checkliste_beschreibung` | Textarea | Kurzbeschreibung |
| `checkliste_punkte` | Repeater | Einzelne Checklistenpunkte |
| └ `punkt_text` | Text | Beschreibung des Punkts |
| └ `punkt_details` | Textarea | Optionale Erläuterung |
| └ `punkt_pflicht` | True/False | Pflichtpunkt oder optional |
| `checkliste_pdf_generierung` | True/False | PDF-Download anbieten |

### Dynamisches Inhaltsverzeichnis

- Parst automatisch alle H2/H3-Überschriften aus dem Beitragsinhalt
- Ergänzt Anker-Links zu Rechner, Vergleich und Checkliste
- Sticky-Positionierung: scrollt mit dem Content mit
- Hebt den aktuell sichtbaren Abschnitt hervor (Intersection Observer API)
- Smooth-Scroll zu jedem Abschnitt per Klick
- Auf Mobile: eingeklapptes Dropdown-Menü am oberen Rand

---

## 5. Sichere Arbeitsumgebung

| Umgebung | Ort | Zweck |
|---|---|---|
| Live-Seite | finanzleser.de (IONOS) | Bleibt unangetastet bis zum Go-Live |
| Lokales WordPress | Local by Flywheel | Plugins aufräumen, ACF einrichten, API testen |
| Next.js Entwicklung | Lokal + Netlify Preview | Frontend-Entwicklung, Kundenpräsentation |

**Netlify Preview Deployments:** Für jeden Git-Push wird automatisch eine Preview-URL erstellt (z.B. `deploy-preview-12--finanzleser.netlify.app`) – diese kann direkt an den Kunden geschickt werden.

---

## 6. Plugin-Analyse

### Behalten
| Plugin | Begründung |
|---|---|
| Yoast SEO + Premium | SEO-Metadaten über API abrufbar |
| UpdraftPlus | Backup-Lösung |
| Sucuri Security | Sicherheit für WP-Backend |
| BBQ Firewall | Sicherheit für WP-Backend |
| WP Crontrol | Cron-Management |
| Native PHP Sessions | Server-Kompatibilität |
| Catch IDs | Content-Management |
| Yoast Duplicate Post | Nützlich für Redaktion |
| WP Sheet Editor | Massenbearbeitung |
| Last Modified Timestamp | SEO-relevant |
| Zendesk Support | Phase 4 relevant |
| ChatGPT Texterstellung | KI-Text im Editor |

### Entfernen
| Plugin | Begründung |
|---|---|
| WPBakery Page Builder | Wird durch Next.js ersetzt |
| Templatera | WPBakery Templates |
| Advanced Editor Tools | Nicht nötig |
| Classic Widgets | Nicht nötig |
| Custom Sidebars | Next.js übernimmt |
| Advanced Ads + Pro | Keine Werbung geplant |
| UberMenu 3 | Next.js Navigation |
| Shortcodes Ultimate | React-Komponenten |
| Simple Sitemap | Next.js Sitemap |
| Site Kit by Google | Direkte GA4 Integration |
| Imagify | Next.js Image Optimization |
| WP Rocket | Nicht nötig bei SSG |
| WP Table Builder + Pro | Next.js Komponente |
| WP Subtitle | ACF übernimmt |

### Neu installieren
| Plugin | Zweck |
|---|---|
| **WPGraphQL** | GraphQL API (Pflicht) |
| **ACF Pro** | Custom Fields (Pflicht) |
| **WPGraphQL for ACF** | ACF über GraphQL (Pflicht) |

---

## 7. ✅ Phase 1: Aufräumen & Fundament (ABGESCHLOSSEN)

- ✅ Vollbackup der Live-Seite (UpdraftPlus)
- ✅ Lokale WordPress-Umgebung (Local by Flywheel)
- ✅ Plugins deinstalliert/deaktiviert
- ✅ WPGraphQL installiert und aktiviert
- ✅ ACF Pro installiert und aktiviert
- ✅ WPGraphQL for ACF installiert
- ✅ Custom Post Types angelegt (rechner, vergleich, checkliste)
- ✅ ACF Feldgruppen angelegt (Beitrag, Rechner, Vergleich, Checkliste)
- ✅ GitHub Repository eingerichtet
- ✅ CLAUDE.md erstellt
- ⬜ URL-Inventar aus Google Search Console (noch offen)

---

## 8. 🔄 Phase 2: Design & Frontend (AKTUELL)

**Ziel:** Komplett neues Frontend nach Figma-Designs.

### Design-Workflow: Figma → Code
1. Design in Figma erstellen (Layout, Farben, Typo, Spacing, Komponenten)
2. Figma MCP Server in Claude Code verbunden
3. Claude Code liest Figma-Design und generiert React-Komponenten
4. Im Browser prüfen, Feedback geben, iterieren

### Modulare Entwicklungsreihenfolge
1. Design Tokens: Farben, Typografie, Spacing als Tailwind Config
2. Navigation/Menü: Hamburger, Mega-Menü, Glassmorphism
3. Hero Section: Landing Page Header mit Animation
4. Kategorie-Slider: Horizontale Slider (Apple-Style) mit GSAP ScrollTrigger
5. Beitrags-Cards: Karten für Slider und Übersichten
6. Beitragsseite: Layout mit Inhalt, dynamischem Inhaltsverzeichnis, Sidebar
7. Eingebettete Tools: Rechner, Vergleich, Checkliste als Komponenten
8. Kategorie-Seite: Filterbare Beitragsübersicht
9. Finanztools-Seiten: Übersicht und Einzelseiten
10. Suchseite: Volltextsuche mit Filtern
11. Footer
12. Page Transitions: GSAP/Framer-Motion

### Design-Prinzipien
- **Glassmorphism / Apple-Style Glass Effects**
- Wenige Grundfarben + Transparenz-Abstufungen (~50 Farbvariablen)
- Lottie-Animationen für UI-Elemente
- GSAP für komplexe mehrstufige Animationen
- Framer Motion für Page Transitions

### Animations-Annotation Format
```
🎬 ANIMATION: [Name]
─────────────────────
Trigger:    Beim Scrollen / Beim Laden / On Hover
Start:      Y +40px, Opacity 0
Ende:       Y 0px, Opacity 1
Duration:   0.6s
Ease:       power2.out
Stagger:    0.1s
GSAP:       gsap.from(".card", { y: 40, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" })
```

---

## 9. Phase 3: Rechner, Checklisten & Inhalte

**Ziel:** Alle interaktiven Elemente funktionieren, Inhalte migriert.

### Eigene Rechner
- React-Komponenten mit eigenem State-Management
- Typen: Steuerrechner, Brutto-Netto, Festgeld, Tagesgeld, Steuerklasse
- Responsive, animiert, einbettbar UND als Einzelseite nutzbar

### Content-Migration
1. Bestehende ~100 Beiträge bleiben mit Original-Permalinks
2. Inhalte komplett überarbeiten (Content Refresh)
3. WPBakery-Shortcodes bereinigen
4. ACF-Felder befüllen (Rechner, Vergleiche, Checklisten zuordnen)
5. Bilder optimieren
6. URL-Mapping abgleichen
7. 301-Redirects nur für geänderte Kategorie-Seiten

---

## 10. Phase 4: KI-Agent Integration

**Ziel:** KI-basierter Finanzberater im eigenen Design.

**Ausgangslage:**
- Zendesk als Wissensdatenbank eingerichtet
- Tausende spezifische Versicherungs-PDFs als Grundlage

| Ansatz | Beschreibung | Aufwand |
|---|---|---|
| A) Eigenes Chat-Widget | React-Komponente, Zendesk Conversations API | Hoch, volle Kontrolle |
| B) Zendesk Widget restyled | Standard-Widget mit Custom CSS | Mittel |
| C) Eigenes LLM-Frontend | Eigene Chat-UI, eigene RAG-Pipeline | Sehr hoch |

**Empfehlung:** Option A – eigenes Chat-Widget mit Zendesk API.

---

## 11. Go-Live Strategie

1. Finale Tests auf Netlify Preview Deployment
2. Performance-Audit: Lighthouse, Core Web Vitals, Mobile-Test
3. SEO-Audit: Meta-Tags, strukturierte Daten, Sitemap, robots.txt
4. DNS vorbereiten: TTL auf 5 Minuten senken (48 Stunden vorher)
5. WordPress-API URL auf Live-Domain umstellen
6. Netlify Custom Domain einrichten (finanzleser.de)
7. DNS bei IONOS umstellen (A-Record / CNAME auf Netlify)
8. 301-Redirects aktivieren (nur Kategorie-Seiten)
9. SSL-Zertifikat prüfen (Netlify stellt automatisch bereit)
10. URL-Inventar komplett durchprüfen
11. Google Search Console: Neue Sitemap einreichen
12. Google Search Console: URL-Prüftool für Top 20 Seiten
13. Monitoring einrichten: Uptime, 404-Fehler, Core Web Vitals
14. 404-Monitoring intensiv erste 2 Wochen

---

## 12. Kostenübersicht

### Laufende Kosten

| Posten | Kosten | Anmerkung |
|---|---|---|
| WordPress Hosting (IONOS) | Wie bisher | Bestehendes Paket |
| Frontend Hosting (Netlify Free) | 0 €/Monat | Kommerziell erlaubt |
| ACF Pro Lizenz | ~49 €/Jahr | Jährlich verlängerbar |
| WPGraphQL | Kostenlos | Open Source |
| GSAP (Basis) | Kostenlos | Kommerzielle Nutzung prüfen |
| **Gesamt zusätzlich** | **~49 €/Jahr** | |

### Optionale Upgrades

| Posten | Kosten | Wann sinnvoll |
|---|---|---|
| Netlify Pro | ~19 $/Monat | Bei >100 GB Bandwidth |
| GSAP Business Lizenz | ~99 $/Jahr | Bei kommerzieller Plugin-Nutzung |
| Cloudflare CDN | Kostenlos | Performance-Boost für WP-API |

---

## 13. Workflow: Chat vs. Claude Code

### Claude Chat (hier) – für Planung
- Strategische Entscheidungen und Design-Diskussionen
- Content-Struktur und ACF-Felder planen
- Animations-Konzepte beschreiben
- Fehleranalyse
- Nächste Schritte priorisieren

### Claude Code – für Entwicklung
- Next.js-Projekt und Struktur
- React-Komponenten aus Figma-Designs
- GSAP-Animationen implementieren
- WordPress GraphQL API-Anbindung
- ACF Felder via JSON verwalten
- Git Commits und Deployments

### Figma – für Design
- Design System und Variables (~50 Farbvariablen)
- Komponenten-Bibliothek
- Seitenlayouts (Desktop, Tablet, Mobile)
- Animations-Annotationen

### Beispiel-Prompts für Claude Code

```
"Lies CLAUDE.md und baue die Navigation als React-Komponente.
Figma Frame: [LINK]. Glassmorphism-Stil, GSAP für Burger-Animation."

"Erstelle einen Apple-Style horizontalen Slider mit GSAP ScrollTrigger.
Karten faden von rechts rein, 0.15s Stagger, ease: power2.out."

"Lies Figma Frame [LINK] und erstelle daraus
eine responsive React-Komponente mit Tailwind CSS."

"Füge ein Feld 'Lesezeit' zur ACF Feldgruppe 'Beitrag' hinzu.
Schreibe die JSON direkt in acf-json/."
```

---

*Projektplan erstellt: 08.03.2026 – Zuletzt aktualisiert: 17.03.2026*
