repo: brownsugarwhite/finanzleser
branch: main
path: components/faden, app/faden.css, public/icons, public/assets

## Last sync
date: 2026-09-09T14:05:33Z

### Updated in this project
- Megamenü neu als „aufgeschlagene Ausgabe“: Seite klappt aus dem Kopf (rotateX), Zeitungskopf mit Doppellinie, Spaltenlinien zeichnen sich, Zeilen drucken sich ein, Lesezeichenband, Eselsohr zum Zuklappen
- Mobil-Menü funktionsfähig mit Registern Ratgeber/Finanztools/Service/Plus; Supernav-Sparks atmen und drehen; wandernder Platzhalter; Toast-Zeitlinie

## Sync history
### 2026-09-09T13:41:22Z
- Kapitel aus Faden A zurückgeholt und in v2-Optik gesetzt: Vergleich (10 Tarife, Filter, Sortierung, Übergabe), Kassensturz (5 Fragen, Tacho, Lücken, Level-Stempel), Mein Bereich (Wächter, Aktenkoffer, Leo weiß nicht)
- Ratgeber als zusammenhängender Aufbau (Einleitung, Abschnitte, FAQ, Fazit, Aktionsleiste), Verlauf mit Unter-Inhalt, Aktenkoffer-Karte rechts, Service-Register mit Dokumenten/Glossar/Finconext, Mobil-Schubladen
### 2026-09-09T13:02:41Z
- Setzkasten-Megamenü (Schublade aus dem Kopf, Setzzeile, Register Ratgeber/Finanztools/Service/Plus) nach Staging-Struktur Rubrik › Themen › Ratgeber + Finanztools zum Thema, Anbieter A–Z mit Suche
- Glossar als Sitzungs-Zettelstapel mit Faden vom Wort zur Randspalte; Anzeigenplätze (Banner K1, Streifen, Ratgeber, beide Randspalten, Menü); Kiosk → Rubrik-/Ratgeber-Kapitel
### 2026-09-09T12:25:16Z
- TopNav (Sparks, Pill mit zwei Linien, Lens) aus TopNav.tsx + useNavPill.tsx und Megamenü-Booklet aus MegaMenu.tsx in Faden A v2 nachgebaut
- Glossar als rechte Randspalte (Akkordeon, A–Z), Vergleich-Zustände aus VergleichEmbed.tsx, Anbieter-Karte aus AnbieterLayout.tsx, Listen-Rahmen aus ListHoverBox.tsx
### 2026-09-09T11:55:52Z
- Rahmen-Hover aus SliderHoverBox.tsx + useSliderHoverBox.tsx (Trennlinie, Spark, drei Zeichenschritte 0,18 s) auf Rubrik-Karten und Ratgeber-Slider in Faden A v2 übertragen
- Glossar-Randglosse und A–Z-Liste, Statistik-Setzkasten (Kreis, Säulen, Spannen), Snake, Bausteine-Kapitel ergänzt
### 2026-09-09T11:26:09Z
- Rechner-Bausteine (RechnerInput mit FieldOutline, Slider-Bubble, Select, Checkbox, RechnerButton, Ergebnis-Header mit Punktlinie und ResultSpacer, Gauge, Benchmark, ResultBox, MultiColumnTable, Hinweis) aus components/rechner + app/rechner.css in Faden A v2 übernommen
- Checkliste (Titel, Fortschritt, Punkt mit Nummer/Punktführung/gezeichnetem Haken, Slider-Seiten, Abschluss-Slide mit Download) aus components/checkliste übernommen
- checkliste_Visual_slide.png kopiert
### 2026-09-08T11:05:04Z
- Brand-Assets kopiert (Logo, Lesezeichen-Spikes, Spark, Leo, Tool-Icons, Rubrik-Icons)
- Tokens aus app/tokens.css und faden.css übernommen (Papier, Tinte, Grün, Pink, Tool-Farben)
- Faden-Struktur (Kopf/Register/Lesezeichen, Kapitel, Spalten, Kette, Werkzeugkarte, Eingabe, Randspalten) aus PR #8 gelesen
- Illustrationen (toolbox, rechner, checklisten, kontaktAnbieter, lupeVisual, newsletter) und weitere Icons kopiert
- Alle 107 Fadenelemente aus docs/konzept-visuals/Fadenelemente.md als Kapitel 3–8 in Entwurf A umgesetzt

## Screen map
| Screen | Repo files |
|---|---|
| Finanzleser Faden A – Zeitung.dc.html | components/faden/*, app/faden.css, components/layout/LogoBar.tsx, components/layout/BookmarkNav.tsx, components/ui/SliderNav.tsx, components/ui/SlideArticleCard.tsx, app/tokens.css |
| Finanzleser Faden A v2 – Zeitung.dc.html | components/rechner/ui/*, components/rechner/BruttoNettoRechner.tsx, components/rechner/RechnerEmbed.tsx, app/rechner.css, components/ui/FieldOutline.tsx, components/ui/ResultSpacer.tsx, components/checkliste/*, components/ui/SlideArticleCard.tsx, components/ui/SliderHoverBox.tsx, lib/hooks/useSliderHoverBox.tsx, components/ui/SliderNav.tsx, components/layout/TopNav.tsx, lib/hooks/useNavPill.tsx, components/layout/MegaMenu.tsx, components/ui/MegaArrow.tsx, components/ui/ListHoverBox.tsx, components/vergleich/VergleichEmbed.tsx, components/layout/AnbieterLayout.tsx, components/layout/ArticleSidebar.tsx |
| Finanzleser Faden B – Blatt.dc.html | same as A (typografische Variante) |
| Finanzleser Faden – Designvorschlag.dc.html | docs/konzept-visuals/Fadenelemente.md |
