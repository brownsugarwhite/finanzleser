# URL-Inventar – finanzleser.de
> Erstellt aus Sitemap am 17.03.2026 | Quelle: finanzleser.de/sitemap.xml

## ⚠️ Wichtige Erkenntnis für das Routing

Entgegen der Annahme "~100 Beiträge" gibt es **mehrere Hundert URLs** – alle **1-Level tief** (`/slug/`).
Das `[kategorie]`-Route in Next.js fängt sie alle auf. Der Page-Handler muss WordPress anfragen
und entscheiden ob es ein Beitrag, eine Checkliste, ein Rechner oder ein Vergleich ist.

---

## Statische Seiten (page-sitemap.xml) – 9 URLs

```
/
/datenschutz/
/impressum/
/agb/
/newsletter/
/sitemap/
/erstinformationen/
/widerrufsrecht/
/rechtliche-hinweise/
```

---

## Beiträge nach Themengruppen (post-sitemap.xml + post-sitemap2.xml)

### PDF-Downloads (~15 URLs)
```
/pdf-patientenverfuegung/
/pdf-freistellungsauftrag/
/pdf-vorsorgevollmacht/
/pdf-betreuungsverfuegung/
/pdf-pfaendungstabelle/
/sozialversicherungswerte-2023-pdf/
/steuerfreibetraege-2023-pdf/
/sozialversicherungswerte-pdf/
/sozialversicherungsbeitraege-2025-pdf/
/sozialversicherungswerte-2026-pdf/
/steuerfreibetraege-2026-pdf/
/steuerformulare-2024-pdf/
/steuerratgeber-2024-pdf/
/renteninformation-pdf/
/kindergeldauszahlungstermine-pdf/
/bussgeldgeldkatalog-pdf/
/duesseldorfer-tabelle-pdf/
/zusatzbeitrag-krankenkassen-pdf/
/steuerformulare-2025-pdf/
```

### Steuer & Finanzen (~6 URLs)
```
/steuererklaerung-2025/
/steuerformulare/
/steuerformulare-2024/
/steuerformulare-2025/
/aenderungen-fuer-steuer-und-sozialversicherungen-2025/
/neue-gesetze-und-regelungen-ab-januar-2026-das-aendert-sich/
/duesseldorfer-tabelle/
```

### Checklisten (~15 URLs)
```
/checkliste-girokonto-eroeffnen/
/checkliste-laufende-kosten-eines-e-bikes/
/checkliste-reise-und-pannenschutz-fuer-den-wohnmobilurlaub/
/checkliste-tierkrankenversicherung-worauf-sie-achten-sollten/
/checkliste-wohnmobil-richtig-versichern/
/checkliste-kostenplanung-bei-der-neuanschaffung-einer-katze/
/checkliste-kostenplanung-bei-der-neuanschaffung-eines-hundes/
/checkliste-kostenplanung-bei-der-neuanschaffung-eines-pferdes/
/checkliste-e-bike-versicherung-schadenmeldung-schritt-fuer-schritt/
/checkliste-e-bike-versicherung-anbieter-vergleichen/
/checkliste-haushaltsbuch/
/checkliste-strom-und-gasanbieter-wechseln/
/checkliste-erwerbsminderungsrente-beantragen/
/checkliste-versicherungsschutz-bei-auslandsreisen/
/checkliste-antrag-auf-schwerbehinderung/
/checkliste-altersrente-fuer-schwerbehinderte-menschen/
/checkliste-altersrente-beantragen/
/checkliste-checkliste-rentenluecke-berechnen/
/checkliste-pkv-wechsel/
/checkliste-steuererklaerung-jahres-checkliste-fuer-angestellte/
/checkliste-steuererklaerung-fuer-selbststaendige-und-freelancer/
/checkliste-nebenjob-minijob-was-muss-ich-melden/
/checkliste-pkv-beitragsoptimierung-ohne-tarifwechsel/
```

### Rechner (~8 URLs)
```
/unterhaltsrechner/
/kindesunterhaltrechner/
/berufsunfaehigkeitsversicherung-rechner/
/private-krankenversicherung-rechner/
/gesetzliche-krankenversicherung-rechner/
/gehaltsrechner/
/rentenversicherung-rechner/
```

### Vergleiche (~2 URLs)
```
/berufsunfaehigkeitsversicherung-vergleich/
/private-krankenversicherung-vergleich/
```

### Sonstige Ratgeber (~2 URLs)
```
/wohnmobilkauf-worauf-sie-vor-dem-kauf-achten-sollten/
/hausratversicherung/
```

---

## Massenartikel: Versicherung kündigen (Muster: /[anbieter]-[typ]-kuendigen/)

> ~400 URLs – alle nach gleichem Schema. Für Routing: einheitlicher Template-Typ.

### Reiseversicherung kündigen (~25 URLs)
`/[anbieter]-reiseversicherung-kuendigen/`
Anbieter: allianz, arag, axa, barmenia, bgv, concordia, da-direkt (fehlt), debeka, devk, die-bayerische, dkv, generali, hansemerkur, huk24, inter, lvm, mannheimer, provinzial, rv, sparkassen, ukv-union, universa, versicherungskammer-bayern, wuerzburger, zurich

### Pflegezusatzversicherung kündigen (~30 URLs)
`/[anbieter]-pflegezusatzversicherung-kuendigen/`

### Risikolebensversicherung kündigen (~40 URLs)
`/[anbieter]-risikolebensversicherung-kuendigen/`

### KFZ-Versicherung kündigen (~55 URLs)
`/[anbieter]-kfz-versicherung-kuendigen/`

### Rentenversicherung kündigen (~40 URLs)
`/[anbieter]-rentenversicherung-kuendigen/`

### Berufsunfähigkeitsversicherung kündigen (~40 URLs)
`/[anbieter]-berufsunfaehigkeitsversicherung-kuendigen/`

### Krankenversicherung kündigen (~20 URLs)
`/[anbieter]-krankenversicherung-kuendigen/`

### Tierversicherung kündigen (~30 URLs)
`/[anbieter]-tierversicherung-kuendigen/`

### Wohngebäudeversicherung kündigen (~55 URLs)
`/[anbieter]-wohngebaeudeversicherung-kuendigen/`

### Unfallversicherung kündigen (~50 URLs)
`/[anbieter]-unfallversicherung-kuendigen/`

### Riesterrente kündigen (~10 URLs)
`/[anbieter]-riesterrente-kuendigen/`

### Basisrente kündigen (~30 URLs)
`/[anbieter]-basisrente-kuendigen/`

---

## Massenartikel: Versicherung Kontakt (Muster: /[anbieter]-[typ]-kontakt/)

> ~80 URLs – alle nach gleichem Schema.

`/[anbieter]-versicherung-kontakt/`
`/[anbieter]-lebensversicherung-kontakt/`
`/[anbieter]-krankenversicherung-kontakt/`
`/[anbieter]-rechtsschutzversicherung-kontakt/`

---

## Routing-Strategie für Next.js

Da **alle** bestehenden URLs 1-Level tief sind, fängt `app/[kategorie]/page.tsx` sie alle auf.

```typescript
// app/[kategorie]/page.tsx
// 1. WordPress anfragen: postBy(slug: params.kategorie)
// 2. Je nach Post Type die richtige Komponente rendern:
//    - post        → ArticleLayout
//    - rechner     → RechnerLayout
//    - vergleich   → VergleichLayout
//    - checkliste  → ChecklisteLayout
//    - page        → StaticPageLayout
// 3. 404 wenn nicht gefunden
```

**Neue Beiträge** nach Relaunch erhalten die hierarchische Struktur:
`/[kategorie]/[sub]/[slug]/` → wird von `app/[kategorie]/[sub]/[slug]/page.tsx` bedient.

---

## Zusammenfassung

| Typ | Anzahl URLs | Routing |
|---|---|---|
| Statische Seiten | 9 | `app/[kategorie]/page.tsx` oder eigene Routes |
| Checklisten | ~23 | `app/[kategorie]/page.tsx` (Post Type: checkliste) |
| Rechner | ~7 | `app/[kategorie]/page.tsx` (Post Type: rechner) |
| Vergleiche | ~2 | `app/[kategorie]/page.tsx` (Post Type: vergleich) |
| PDFs / Steuer | ~26 | `app/[kategorie]/page.tsx` (Post Type: post) |
| Versicherung kündigen | ~400 | `app/[kategorie]/page.tsx` (Post Type: post) |
| Versicherung Kontakt | ~80 | `app/[kategorie]/page.tsx` (Post Type: post) |
| **Gesamt** | **~547** | |
