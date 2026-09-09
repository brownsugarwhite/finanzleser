# Handoff: Finanzleser Faden – „Die Zeitung“ (Design A v2)

## Overview
Der **Faden** ist das thread-gesteuerte Chat-System von finanzleser.de: Ein digitales Finanzmagazin, in dem der KI-Agent **Leo** Fragen beantwortet und Ratgeber, Rechner, Vergleiche, Checklisten, Spiele und Servicefunktionen als **Kapitel** in eine nie endende Zeitung hängt. Das Design folgt der Richtung „Die Zeitung“: Merriweather + Open Sans, Versal-Kicker, Haarlinien, Randspalten, dunkle Tinte direkt auf Papier (kaum weiße Boxen), Herzschlag-Reveals.

Repo-Kontext: `brownsugarwhite/finanzleser` (`main`, Faden-Branch `/faden`). Der Prototyp übernimmt bewusst Live-Bausteine (RechnerInput mit FieldOutline, Slider-Bubble, RechnerButton, ResultSpacer/Punktlinie, Checkliste mit SliderNav, TopNav-Pill mit useNavPill, ListHoverBox-Rahmen, VergleichEmbed-Zustände, AnbieterLayout). Siehe `github.md` im Paket für die Zuordnung Screen → Repo-Datei.

## About the Design Files
Die Dateien in diesem Paket sind **Design-Referenzen in HTML** (Design Components mit inline styles + einer Logik-Klasse). Sie zeigen Look und Verhalten, sind aber **kein Produktionscode zum Kopieren**. Aufgabe: die Designs in der bestehenden Next.js/React-Codebase von finanzleser nachbauen – mit den vorhandenen Komponenten (`components/rechner/*`, `components/checkliste/*`, `components/layout/TopNav.tsx`, `components/ui/*`), Tokens (`app/tokens.css`) und Patterns. Wo der Prototyp bestehende Komponenten nachbildet, sind die **Originalkomponenten** zu verwenden, nicht der Nachbau.

## Fidelity
**High-fidelity.** Farben, Typografie, Abstände, Zustände und Animationen sind final gemeint. Texte sind redaktionelle Platzhalter mit realistischem Inhalt; Zahlen (Beiträge, Statistiken) sind Beispieldaten und kommen später aus dem CMS/Partnerdaten.

Hauptdatei: `Finanzleser Faden A v2 - Zeitung.dc.html` (Template + Logik in einer Datei, ~360 KB). `support.js` ist die Laufzeit des Prototyp-Werkzeugs und **nicht** zu portieren.

---

## Design Tokens

### Farben (nur diese verwenden)
| Token | Hex | Verwendung |
|---|---|---|
| Papier | `#faf9f6` | body / Seitenhintergrund |
| Papier hell | `#fff` / `rgba(255,255,255,.55)` | Eingabefelder, Glossar-Zettel |
| Tinte | `#334A27` | Fließtext, Überschriften, Linien, dunkle Flächen (Level-Balken, Pille) |
| Tinte 22 % | `rgba(51,74,39,.22)` | Spaltenlinien, Rahmen |
| Tinte 16/12/10/8 % | `rgba(51,74,39,.16/.12/.10/.08)` | Zeilentrenner, Haarlinien |
| Grau | `#686C6A` | Kicker, Meta, Sekundärtext |
| Primary Green | `#45A117` | Aktiv, Fortschritt, Haken, Sparks, Punkte |
| Green dark | `#2E7A0B` | Leo-Kicker, Links, aktive Menüpunkte |
| Green light | `#a9e07c` | Text auf Tinte (Level-Balken) |
| Türkis | `#0B7F66` | Vergleich-Werkzeug, Wordle „enthalten“ |
| Türkis hell | `#06D496` | Bestwert-Stempel, Avatar-Verlauf |
| Brand Secondary (Magenta) | `#D3005E` | Rechner-Werkzeug, Fokusring, Lesezeichenband, Kicker Thema, Falschmarkierung |
| Anzeigen (fremd) | `#1E3A5F`, `#F5C451`, `#D9641A→#F08A2E` | nur Werbeplätze |

### Typografie
- **Merriweather** (Google, variable, 300/400/500/700/900, italic) – Überschriften, Zwischentitel, Zitate, Leo-Sprechtext, Zahlen in Ergebnissen.
- **Open Sans** (400/500/600/700) – Fließtext, UI, Kicker, Tabellen.
- Kicker (überall identisch): `700 10.5px/1.3 'Open Sans'; letter-spacing:.14em; text-transform:uppercase; color:#686C6A` (grün `#2E7A0B` für Leo/Werkzeuge; 9.5px für „Anzeige“).
- Kapitel-H2: `900 clamp(26px,3vw,40px)/1.15 Merriweather; text-wrap:balance; letter-spacing:-.01em`.
- Ratgeber-H2: `900 clamp(28px,3.4vw,44px)/1.1`.
- Zwischentitel H3: `700 clamp(20px,1.9vw,26px)/1.25 Merriweather`.
- Vorspann: `italic 300 clamp(16px,1.35vw,19px)/1.5 Merriweather`.
- Fließtext: `400 16px/1.75 'Open Sans'`, Initial (Drop Cap) `900 60px/.78 Merriweather; float:left; padding:6px 8px 0 0`.
- Leo-Sprechtext: `italic 400 clamp(17px,1.4vw,20px)/1.55 Merriweather`.
- Zahlen: `font-variant-numeric: tabular-nums`.

### Linien & Flächen
- Doppellinie (Zeitungskopf, Tabellenkopf, Randspalten-Kopf): `2px #334A27` + `2px Abstand` + `1px #334A27`.
- Punktführung (Inhalt, Kennzahlen): `border-bottom:1px dotted rgba(51,74,39,.4); transform:translateY(-4px)`.
- Werkzeug-Einhänger: `border-top:2px <Werkzeugfarbe>` + Kicker mit 8-px-Punkt in Werkzeugfarbe (Rechner Magenta, Vergleich Türkis, Checkliste Grün).
- Keine Kartenboxen mit Schatten im Faden; einzige „Karten“: Anzeigen, Glossar-Zettel (`1px solid rgba(51,74,39,.22); box-shadow:1px 2px 0 rgba(51,74,39,.08)`), Level-Balken (Tinte).

### Buttons
- **Pille (Standard-CTA)**: `height:44/48px; padding:3px 3px 3px 17/19px; border:2px solid #334A27; outline:1px solid #334A27; outline-offset:2px; border-radius:19/21px; background:transparent; font:500 15/17px Open Sans`; rechts ein runder Knopf `34/38px` in Werkzeugfarbe mit weißem „=“-Glyph. Hover: Textfarbe → `#2E7A0B` (Rechner: `#D3005E`).
- **Textlink mit Strich**: Text + `<i>` 18–22 px × 1 px in currentColor, Hover verlängert Strich (`transition width .45s`).
- **Chip**: `border:1px solid rgba(51,74,39,.25); border-radius:999px; padding:0 16px; min-height:40px`; Hover `border-color:#334A27; translateY(-1px)`.
- **Toggle**: 42×24, Knopf 20 px weiß, an `#45A117`, aus `rgba(51,74,39,.2)`, Knopf-Transition `cubic-bezier(.34,1.56,.64,1)`.

### Bewegung (Herzschlag-Prinzip)
Alle Keyframes liegen im `<helmet><style>` der Hauptdatei. Standardkurve `cubic-bezier(.2,.8,.2,1)`, Überschwung `cubic-bezier(.34,1.56,.64,1)`.
- `fl-herz` (Standard-Reveal, .9 s): opacity 0→1, translateY 14→-2→1→0, scale .985→1.008→.999→1.
- `fl-gleiten` (Fremdinhalt gleitet vom Faden ein, .9 s): translateX -24→3→-1→0.
- `fl-linie` (Kopfzeilen-Linien, 1.1 s): scaleX 0→1 von außen.
- `fl-spark` (1 s): scale 0→1.3→1, rotate -40→8→0.
- `fl-puls` (1.8 s ∞, aktiver Knoten/Punkt): Doppelschlag scale 1→1.2→1→1.12→1 + Ring-Schatten.
- `fl-kippen` (.55 s): rotateX -78→6→-2→0 (Zeilen kippen hoch).
- `fl-druck` (.55 s): opacity, translateY 7→0, letter-spacing .06em→0, blur .6→0 („Zeile druckt sich“).
- `fl-mitte`/`fl-spalte`: Linien zeichnen (scaleX von Mitte / scaleY von oben).
- `fl-zettel` (.7 s), `fl-knoten` (.5 s), `fl-flip` (Wordle-Kachel .6 s), `fl-stempel` (.7 s, rotate -22→-8→-11), `fl-zeichnen` (SVG stroke-dashoffset), `fl-blink`, `fl-drift` (±4 px, 2.6–4 s ∞), `fl-atmen` (scale 1→1.04, 3.2 s ∞), `fl-letter`, `fl-ohr`, `fl-toast`, `fl-shimmer`, `fl-tipp`.
- Reveal-Trigger: IntersectionObserver (`rootMargin 0 0 -8% 0`, threshold .05); `data-reveal="herz|gleiten|stufen|kopf"`. `stufen` staffelt Kinder mit `i*.09s`. Tweak-Props: `tempo` (ruhig 1.35× / normal / lebhaft .65×), `herzschlag` (boolean → lineare Kurve).
- **Scrollverhalten**: `scrollTo` mit `behavior:'smooth'`, Offset 84–90 px unter dem Kopf. Neue Kapitel: Scroll folgt nur, wenn Nutzer am Ende (<260 px) ist; sonst Pille „Leo schreibt weiter · nach unten“. Leo tippt Titel (2 Zeichen/Tick) und Antwort (3 Zeichen/Tick) mit 26–28 ms × tempo.

### Breakpoints
- `breit` ≥ 1060 px: Randspalte links + Faden (Linie links vom Strom), Rechner/Tabellen mehrspaltig.
- Nav sichtbar ≥ 1120 px; zentriert und „Sie lesen“ ≥ 1440 px, sonst links neben Logo (`left:270px`).
- `sehrBreit` ≥ 1280 px: dritte Spalte rechts (Glossar/Koffer/Anzeige). Grid: `176px minmax(0,720px) 216px`, gap `clamp(28px,4vw,64px)`, max 1320 px.
- Mobil (< 1060): einspaltig, Pillen „Verlauf ##“ / „Glossar (n)“ unter dem Kopf (top 64, z 54), Schubladen 340 px von links/rechts, Kiosk 2 Spalten ≥ 560 px sonst 1, Vergleich ohne Schlüssel/Forderung-Spalten, Tap-Ziele ≥ 40–44 px.

---

## Screens / Views

### 1 · Kopf (fixed, 64 px)
- Blur-Hintergrund (`backdrop-filter blur(12px)`, maskiert nach unten). Logo `fl_logo.svg` links (26 px hoch), Lesefortschritt als 1-px-Grünlinie an `top:63px` (Breite = Scroll-%).
- **Supernav** (4 Register: Ratgeber · Finanztools · Service · **Finanzleser Plus** in `#45A117`): Merriweather 600 16px, Padding 12/18. Zwischen den Punkten 12-px **Sparks** (`nav-spark-green` als Pfad, Tinte), die versetzt atmen (`fl-atmen 3.4s`, delay i×.5s); der Spark neben dem offenen Register dreht 135° und wird magenta.
- **Pille** (aus `useNavPill`): blüht aus der Mitte (10×10) auf, gleitet mit `cubic-bezier(.34,1.5,.64,1)` .4 s; darüber zwei Linien (2 px/4 px, `top:calc(50% - 26/22px)`) folgen träger (.48/.44 s); weiße Spiegel-Kopie der Labels („Lens“) läuft im Pill mit. Hover-Verlassen: Pille schrumpft zur Mitte und blendet aus (.18 s), außer Menü offen.
- **Lesezeichen rechts** (z 63, 50 px): `lesezeichen-spikes.svg` + grünes Band `linear-gradient(to left, rgba(22,142,3,.8), #45a117)`; Inhalt: „Sie lesen: <aktives Kapitel>“ (≥1440), Newsletter (Text, ≥1120), Aktenkoffer-Icon mit magenta Badge (Zahl, Pop `scale 1.25`), Lupe, Burger (wird zu X: Balken 1/3 rotieren ±45°, Mitte blendet aus).

### 2 · Megamenü „Die aufgeschlagene Ausgabe“ (Desktop)
- Overlay `rgba(51,74,39,.10)` + blur 2 px; Klick/Esc schließt.
- Blatt `min(1200px,96vw)`, zentriert, `perspective:1600px`, `transform-origin:top`; **Öffnen**: `rotateX(-88deg)→0` in .75 s `cubic-bezier(.22,1.1,.36,1)`, Falzschatten (Verlauf oben) blendet in .7 s aus. Rahmen `1px rgba(51,74,39,.22)`, Schatten `0 40px 60px -30px rgba(51,74,39,.5)`, `max-height:calc(100vh - 64px); overflow:auto`.
- **Zeitungskopf**: Kicker links Datum „Dienstag, 9. September 2026 · Ausgabe 1“, rechts Pfad (Segmente drucken sich ein, Trenner „›“ grün, letztes Segment 600 Tinte). Registername `900 clamp(30px,3.4vw,46px) Merriweather` (`fl-druck`). Doppellinie zeichnet sich von der Mitte (`fl-mitte` .8 s, .15/.25 s Delay). Rechts „Esc · zuklappen ✕“.
- **Spalten** (Ratgeber: `1fr 1fr 1.3fr 250px`, ≥1240 px mit Anzeigenspalte; sonst 3 Spalten). Spaltenlinie rechts jeder Spalte zeichnet sich von oben (`fl-spalte` .9 s, .3 s).
  - **Rubriken**: 4 Zeilen à 64 px, Initial `900 34px Merriweather` (aktiv grün, `translateX(2px) scale(1.08)`), Titel 700 16px, „84 Ratgeber“ kursiv 12px mit wachsender Grünlinie (aktiv 100 %), Pfeil rückt 4 px. Links davon **Lesezeichenband** 4×52 px magenta mit Kerbe (`clip-path`), `top` springt mit `.5s cubic-bezier(.34,1.4,.64,1)`. Hover wechselt Rubrik (Nachbarspalten drucken neu), Klick öffnet Rubrikübersicht als Kapitel.
  - **Aus dem Inhalt**: nummerierte Liste `01…`, Punktführung, Zahl rechts; aktiv 700 grün; Klick öffnet den Ratgeber als Kapitel.
  - **Schlagzeilen**: Kicker kursiv magenta + Tool-Punkte (7 px), erster Eintrag Aufmacher `900 19px` + kursiver Lead, weitere `700 15.5px`.
  - **Finanztools zum Thema**: Punkt in Werkzeugfarbe pulsiert (`fl-puls 2.4s`, Delay i×.4 s), Art als Kicker rechts.
  - **Anzeige** (baufix, `#1E3A5F`).
- Register **Finanztools**: Werkzeugarten (runder Ring, Punkt skaliert 1.5 bei aktiv) · Meistgenutzt (nummeriert, Nutzung/Monat) · „Direkt im Faden“ Chips (starten ein Frage-Kapitel) + Illustration (`vids/rechner|vergleiche|checklisten.webp`).
- Register **Service**: Anbieter (A–Z Pillen 34 px, „Alle“ + aktiv magenta; Suchfeld mit Live-Outline; 2-spaltige Liste mit Punkt: Partner grün / sonst türkis) · Dokumente (Vorlagen mit Punktführung, Klick → Koffer) · Glossar (8 Begriffe, Klick legt Begriff in die Sitzung) · Finconext (Logo, Text, Pille, `kontaktAnbieter.png`).
- Register **Plus**: Claim + Pille „4,90 € im Monat“.
- **Fußzeile**: Anbieter · Dokumente · Glossar · Finconext, rechts „Seite n · Zum Zuklappen die Ecke umblättern“. **Eselsohr** unten rechts (zwei 30-px-Dreiecke, `drop-shadow`, wippt `fl-ohr 3s`), Klick schließt.
- Jede Zeile trägt `fl-druck` mit gestaffeltem Delay (Basis .15–.5 s + i×.045 s); ein Wechsel (Rubrik/Thema/Werkzeug/Service/Buchstabe) erhöht einen Zähler `druck`, der die Animationen neu startet.

### 3 · Mobil-Menü (< 1120 px, Burger)
- Vollfläche Papier, `rotateX(-10deg)→0` + Fade .55 s. Datumszeile + Doppellinie, Register-Reiter (40 px, aktiv grüne Unterlinie).
- Ratgeber: Rubriken mit Initial `900 30px`, Titel `700 clamp(20px,5.5vw,24px)`, Akkordeon (`grid-template-rows 0fr↔1fr`), Themen mit Punktführung → öffnen Ratgeber-Kapitel; „Ausgabe aufschlagen“ → Rubrikübersicht.
- Finanztools: drei Blöcke mit Punkt + je 4 Werkzeuge. Service: 4 Zeilen mit Meta + A–Z + Liste. Plus: Claim + Pille.
- Schließen: Burger-X, Esc.

### 4 · Randspalte links (sticky, top 84, ≥1060)
- **Verlauf · heute**: Doppellinie; Zeilen `Nr (700 10px, aktiv grün) + Titel (Merriweather 13.5px, aktiv 700)` + Grünlinie darunter (100 % gelesen / 46 % aktiv / 0 %). Unter dem aktiven Kapitel klappt das **Unter-Inhaltsverzeichnis** auf (Kapitel 3: Einleitung · Deckungssumme · Kosten · Checkliste · Häufige Fragen · Fazit; Ratgeber-Kapitel: Einleitung + Abschnitte + FAQ + Fazit): Strich 10→22 px, aktiv grün + 600. Aktiver Abschnitt = letztes `[data-abschnitt]` oberhalb 42 % Viewport + 60 px. „Alle Kapitel zusammenfalten/aufschlagen“.
- **Leos Wochenbrief**: vertikaler Schalter (14×36, Knopf 10 px) + grüne Pille „Eintragen/Eingetragen“ + Datenschutztext 11.5px.
- **Anzeige** (Nordlicht, `#1E3A5F`, gelbe CTA).
- **Leseserie**: 7 Tageskreise (22 px), 4 gefüllt grün, heutiger pulsiert.

### 5 · Der Strom (Mitte)
- **Faden**: 2 px gestrichelt links (-30 px), gefüllte Tinte bis 42 % Viewport-Höhe, Knoten 12 px je Kapitel (gefüllt bis aktiv, aktiver pulsiert).
- **Zeitungskopf**: „Ihr Faden · Ausgabe 1 | Dienstag, 9. September 2026“ + Doppellinie.
- **Kapitelkopf** (jedes Kapitel, klappbar): Grid `1fr auto 1fr`, Linien zeichnen von der Mitte nach außen, Kicker „Kapitel n · Pfad · Uhrzeit“, Spark springt ein (`fl-spark` .45 s), darunter kursiv 12px „Antippen zum Zusammenfalten“. Inhalt klappt über `grid-template-rows 1fr↔0fr` (.65 s). Kapitelabstand `padding:50px 0 56px; border-bottom 1px 16 %`.

#### Kapitel 1 · Heute
Anzeigenbanner (Steuerfuchs, orange Verlauf, gleitet ein) · Leo-Begrüßung (44-px-Avatar atmet) · **Kiosk**: 4 Ausgaben-Karten (Grid 4 / 2 / 1). Karte: Kicker „Ausgabe n / 84 Ratgeber“, Icon 34 px (Hover `rotate(-8deg) scale(1.12)`), Titel `900 clamp(20px,1.7vw,23px)`, Lead kursiv, „Aus dem Inhalt“ 3 Themen mit Punktführung + Seitenzahl (Klick → Ratgeber-Kapitel), „Ausgabe aufschlagen“ mit wachsendem Strich. **Rahmen-Hover** (ListHoverBox transponiert): Linien wachsen von den Sparks aus nach oben/unten (`scaleY`, .18 s, gestaffelt), Sparks rotieren. **Klick**: Karte hebt sich `translateY(-46px) scale(1.04)` + Schatten, blendet aus (.45 s), nach 520 ms entsteht ein **Rubrik-Kapitel** am Fadenende (Leo tippt Titel/Text, dann Liste: Seitenzahl `900 22px grün`, Thema, Titel `700 17px`, Tool-Tags, „Aufschlagen“).

#### Kapitel 2 · BU-Frage & Rechner
„Ihre Frage“ (3-px-Tintenbalken links, gleitet ein) · Leo-Antwort mit H2, Vorspann, 2-spaltigem Text (`columns:2; column-rule 1px`), Initial, Fußnoten ¹²³ · **Rechner** (Live-Bausteine 1:1): Label Merriweather 600 .85rem hebt sich 4 px bei Hover, Pill-Input `border-radius:19px; padding 8px 64px 8px 16px`, €-Knopf rechts, Fokus `box-shadow 0 0 0 2px #D3005E`, **Doppel-Outline**: SVG-Rect 4 px außen, `pathLength=100`, `stroke-dasharray 0 100 → 100 0` in 1 s (zeichnet sich im Uhrzeigersinn) · Select mit Pfeil · Slider 8 px, Griff 18 px weiß mit 3-px-Tintenrand (Hover 1.7×, aktiv 2× magenta), Wert-Bubble unter dem Griff (`left:%`, `cubic-bezier(.22,1,.36,1)`), Skalen-Ticks blenden aus, wenn Griff nah · Checkbox 23 px `radius 9px` mit gezeichnetem Haken (`stroke-dashoffset 1→0`) · Pille „Berechnen“ (Knopf magenta, schrumpft .85 während Rechnung). **Ergebnis** (klappt auf, scrollt hin): Punktlinie skaliert auf + „ERGEBNIS“ (`300 14px letter-spacing 2px`), V-Spacer-SVG, Ring (r50, Stroke 5 magenta, `stroke-dashoffset` 1 s) mit Quote „x,x % Beitrag vom Netto“, Deutschlandvergleich (2 Balken 28 px, Ihr Beitrag magenta, Ø Tinte), 3 Ergebnisboxen (erste Doppelrahmen `1px + outline 2px #999`, Zahl `700 36px magenta`; andere `rgba(0,0,0,.03)`), Zählwerk 950 ms, Tabelle mit Grau-Doppelkopf `#686C6A` und letzter Zeile `2px magenta`, Magenta-Hinweisblock, Pille „In den Aktenkoffer“. Quellenblock. „Das könnte Sie auch interessieren“: Slider 3 Karten mit Rahmen-Hover und Keil-Navigation (SliderNav).

#### Kapitel 3 · Ratgeber Privathaftpflicht (zusammenhängend)
Breadcrumb · Kicker kursiv magenta · H2 · Vorspann · Meta-Zeile (Avatar mit Grün→Türkis-Ring, „Erstellt von der Redaktion · aktualisiert…“, Lesezeit) · **Inhalt** (6 Abschnitte, Punktführung, Minuten) · **Abschnitt 1** Text mit Initial + grünen **Glossar-Begriffen** (Klick: siehe Glossar) + **Anteilsleiste** (Segmente 18 px in Tinte/Grün/Türkis/Magenta, Hover dimmt andere auf .3, Verbindungslinien 1 px zu Labels, alternierend 22/58 px) + **Weiterlesen mit Leo** (3 Fragen, Akkordeon) · Anzeige (baufix Streifen) · **Abschnitt 2** Vergleichstabelle Zeitung (Doppellinie, Komfort-Spalte magenta-hinterlegt `rgba(211,0,94,.035)`, Marke 2 px über Kopf, ✓/–) + **Linienchart** (SVG 640×220, Linie Tinte 1.5 px zeichnet sich `fl-zeichnen` 1.6 s, Inflationslinie grün gestrichelt, Punkte weiß mit Rand, Labels als HTML-Overlay in %) · **Abschnitt 3 Checkliste** (Live-Baustein: Titel, Fortschritt 4 px, Punkte `Nr 700 15px + Punktführung + 23-px-Box mit überzeichnendem grünem Haken 34 px`, Seiten-Slider, Abschluss-Slide mit `checkliste_Visual_slide.png` + Pille „Herunterladen“, Keil-Navigation) · **Häufige Fragen** (4, Nr `900 18px`, aktiv grün, Pfeil dreht 225°) · **Fazit** (Starburst-Icon driftet, 3-px-Balken) · Aktionsleiste: Pille „In den Aktenkoffer“, „Als Ausriss teilen“, „Gelesen · +15 Punkte“.

#### Kapitel 4 · Vergleich
Leo wirft ein · Werkzeug-Einhänger türkis „Anzeige · Vergleich mit Partnerlinks“ · H3 · Filterzeile: Toggle „nur mit Schlüsselverlust“, Sortieren Beitrag/Deckung/Leistung (aktiv 2-px-Unterlinie) · Grid `1.6fr .8fr .7fr .7fr .9fr` (mobil 3 Spalten): Tarif `700 16px` + Tarifname 12.5px + **Bestwert**-Stempel türkis (`fl-stempel`), Deckung, ✓/– grün/grau, Beitrag `900 19px` + Balken 72×3 (Bestwert türkis). Zeilen `fl-herz` gestaffelt, Bestwert-Zeile `rgba(6,212,150,.07)`. Meta kursiv · Pille „Angebot bei Finconext berechnen“ mit Ladelinie (2 px türkis, 30 ms-Ticks bis 100 %) → Text „Angebot liegt bei Finconext“, Koffer +1. Darunter 2 Spalten: **Leistungsquote-Ring** (Zählwerk 0→96, Ring zeichnet auf 96 %) und **Anbieterkarte LVM** (40-px-Monogramm auf Tinte, Telefon/Web mit Icons, Chips Kontakt/Kündigung/Schaden mit Farbpunkt, `kontaktAnbieter.png`).

#### Kapitel 5 · Kassensturz
Einhänger grün · „Frage n von 5“ · 5 Fortschrittssegmente (3 px; erledigt grün, aktiv Tinte zeichnet `fl-linie`) · Frage `900 clamp(24px,2.4vw,34px)` + Hinweis kursiv · Antwortkarten (3 Spalten / 1): `1px Rahmen`, Icon 28 px, Titel 700 16px, Sub 13px; gewählt: Tinte-Fläche, weißer Text, Icon `brightness(10)`; Hover `translateY(-3px)`; Wahl → Bühne gleitet -16 px aus (.3 s) und nächste Frage kommt · Schätzfrage mit Slider + Bubble + Pille „Weiter“ · Mehrfachauswahl + Pille „Auswerten“. **Ergebnis**: Halbkreis-Tacho (r90, Stroke 14, Farbe grün ≥70 / türkis ≥40 / magenta, Nadel `rotate(-90→x)` 1.4 s Überschwung), Zahl `900 34px`, Titel, Vorspann, 3 Ampelpunkte, 3 Lückenkarten (3-px-Oberkante in Werkzeugfarbe), E-Mail-Zeile + Pille „Ergebnis schicken“, „Noch einmal“. Danach klappt **Level-Balken** (Tinte, Ring 64 px grün, Punkte, „Kenner“-Stempel `3px #a9e07c rotate(-10deg)` `fl-stempel`) auf; +60 Punkte.

#### Kapitel 6 · Setzkasten (Listen & Statistik)
Kennzahlen „Auf einen Blick“ (4 Spalten, Zählwerk 1.3 s, Doppellinie oben/1 px unten) · Schrittfolge (Nr `900 26px grün` + vertikale Linie) · Pro/Contra (+ grün / – magenta) · Begriffe (dl 38 %/62 %) · Kennzahlen-Liste mit Punktführung · Zeitstrahl (Punkte 9 px, Labels oben/unten alternierend) · Kreisdiagramm (Segmente `stroke-dasharray` zeichnen 1.1 s gestaffelt, Hover dimmt, Leader-Linien zeichnen, Labels HTML) · Säulen/Spannen · Vergleich-Embed in 3 Zuständen (Zwei-Klick-Freigabe → Ladebox schimmert → geladener Rahmen) · Anbieter-Kontaktkarte · Anbieter A–Z · Ratgeber-Übersichtsliste (150 px Bild + Text + Meta; Rahmen-Hover mit Sparks oben/unten).

#### Kapitel 7 · Rätselseite
**Finanzwort** (Wordle): 6×5 Kacheln 48 px `700 22px Merriweather`; richtig grün gefüllt/weiß, enthalten türkis 2-px-Rand, falsch `rgba(51,74,39,.08)`; Flip `fl-flip .6s` i×.12 s; aktuelle Kachel mit Buchstabe `scale 1.06`; Tastatur QWERTZ 30/46 px Tasten färben sich mit; Hardware-Tastatur aktiv (außer in Inputs); Lösung TARIF, Status kursiv, +30 Punkte. **Schätzfrage** (Slider, Tipp-Bubble Tinte, Auflösung: magenta Klammerlinie vom Tipp zum wahren Wert + magenta Bubble „68 €“, Bubble versetzt wenn nah). **Quiz** (A/B/C, richtig: grüne 2-px-Linie wächst unter Option; falsch gewählt: magenta Durchstrich wächst). **Stempelkarte** (Leser/Kenner/Experte, „Erreicht“-Stempel grün rotiert -11°, Fortschritt 3 px + pulsierender Punkt). **Snake** (Raster 22×13 auf Punktpapier mit Innenrand, Python-Bänder Tinte/Dunkelgrün mit diagonalem Pixelmuster, Kopf grün mit Augen, Schwanz verjüngt).

#### Kapitel 8 · Bausteine des Fadens
Katalog kleiner Faden-Elemente (Zitat, Zeitmarke, Anzeige klein, Wächter-Demo (3 alte Einträge), Koffer-Demo, Skelett, Offline, Teilen-Ausriss).

#### Kapitel 9 · Mein Bereich
**Wächter** (Einhänger grün, Glocke driftet; 4 Toggles 42×24 mit Text 15px; Kanal-Register E-Mail/WhatsApp/Nur im Faden als 1-px-gerahmte Segmente 44 px, aktiv Tinte) · **Aktenkoffer** (Zahl `900 30px` poppt, `lupeVisual.png` driftet; leer-Text oder Liste mit Punktführung + Art; „Sichern · Finanzleser Plus“ E-Mail-Zeile) · **Leo „Das weiß ich nicht – und rate nicht.“** (`900 clamp(22px,2.2vw,30px)`, 3 Wege in Spalten mit Icon 22 px, Titel 700 16px, Text 13.5px).

#### Dynamische Kapitel (ab Nr. 10)
Drei Arten: **Frage** (Balken „Ihre Frage“, Leo tippt Titel + Antwort, danach klappt Kennzahlenblock ein + Folge-Chips), **Rubrikübersicht** (Kicker „Ausgabe n · Rubrik · 84 Ratgeber“ + Doppellinie, Leo tippt, Liste), **Ratgeber** (Breadcrumb, Kicker magenta, Leo tippt Titel, kursiver Einstieg, Meta-Zeile, Hero-Illustration 190 px zwischen Haarlinien (driftet), Inhalt 6 Einträge, 3 Abschnitte mit Initial, Kennzahlen in Abschnitt 2, Werkzeug-Einhänger je nach Tools des Beitrags (Rechner magenta / Vergleich türkis / Checkliste grün mit Pille), FAQ 3, Fazit, Aktionsleiste). Verlauf und „Sie lesen“ aktualisieren sich.

### 6 · Randspalte rechts (sticky, ≥1280)
- **Glossar · Aktuelle Sitzung**: Doppellinie; leer: kursiver Hinweis „Tippen Sie im Text auf einen grünen Begriff…“. **Begriff-Klick im Text**: SVG-Overlay zeichnet einen **Faden** (1.2 px grün, kubische Kurve, `stroke-dashoffset 1→0` .8 s) vom Wort (Knoten weiß/grün, `fl-knoten`) zur Randspalte (Knoten grün, .7 s Delay); nach 2.6 s oder bei Scroll blendet der Faden aus. Der Begriff legt sich als **Zettel** oben auf den Stapel (`fl-zettel` .7 s, Rotation alternierend .7/-.5/.2°, weißer Grund, 1-px-Rahmen, Knoten links), offen: Definition 13px, Quelle kursiv, verwandte Begriffe als Strich-Links. Ältere Zettel kollabieren; „n Begriffe in dieser Sitzung · Leeren“. Unter 1280 px greift stattdessen die **Randglosse** unter dem Absatz (Kapitel 3).
- **Aktenkoffer-Karte** (Zahl `900 28px` poppt, Text, „Zum Koffer“ → scrollt zu Kapitel 9).
- **Anzeige** Half Page (baufix).

### 7 · Eingabezeile (fixed unten)
Verlauf-Hintergrund zu Papier; Pille „Leo schreibt weiter · nach unten“ (pulsierender Punkt) erscheint, wenn neuer Inhalt außerhalb liegt. Formular 720 px, 52 px, `rgba(255,255,255,.72)` + blur, Leo-Avatar 30 px, Platzhalter wechselt alle 4.2 s durch Beispielfragen, Fokus grüner 2-px-Ring + grün gezeichnete Außen-Outline, Sende-Knopf 40 px (Tinte → grün bei Eingabe, Hover 1.06). Enter/Klick → Frage-Kapitel.

### 8 · Hinweis-Streifen (Toast)
Fixed unten (90 px über Rand), Tinte, `radius 4px`, pulsierender grüner Punkt, Kicker „EILMELDUNG“ `#a9e07c`, Text 14px, 2-px-Zeitlinie grün läuft in 3.2 s ab; Einflug `translateY 24→0` mit Überschwung.

---

## State Management (Prototyp-Logik, zu übertragen)
- `zu{}` (Kapitel zugeklappt), `aktiv` (Kapitelnr. aus Scroll), `abschnittAktiv` (id), `lese` (%), `knoten[]`, `fadenH`.
- Menü: `menu` (null|0–3), `menuKat`, `menuSub`, `menuTool`, `menuService`, `anbLetter`, `druck` (Animations-Neustart), `pill{x,w,h,op,vis}`, `mob`, `mobReg`, `mobKat`, `schublade` ('links'|'rechts'|null).
- Rechner: `netto`, `alter`, `beruf`, `nr`, `erg`, `ergAuf/ergOn`, `z` (Zählwerk). Formel im Prototyp: Rente = 75 % Netto; Beitrag = Basis(Beruf) × Rente/1000 × (1 + (Alter−25)×.022) × (Raucher 1.28), min 18 €.
- Checkliste `cl{}`, `clSlide`; Vergleich `vglFilter`, `vglSortiert`, `uebergabeLauf/Fertig`; Kassensturz `ks{schritt,antworten,schaetz,fertig,wechsel}`, `levelOffen`; Spiele `wg[]`, `wcur`, `tipp`, `quizWahl`, `sn`; Punkte `punkte`; Koffer `koffer`, `kofferInhalt[]`; Wächter `waechter[4]`, `kanal`; Glossar `gl`, `glStapel[]`, `glFaden{d,x1,y1,x2,y2,an}`; Newsletter `nl`; Toast `toast`, `toastAn`; dynamische `kapitel[]` (`art: frage|rubrik|ratgeber`, `tippt`, `tab`, `tocDef`).
- Datenquellen später: Rubriken/Themen/Ratgeber (CMS), Anbieter (147), Glossar (212), Tarife (Partner), Punkte/Koffer/Wächter (Nutzerkonto/Plus).

## Assets (alle in `public/` des Repos vorhanden)
Icons: `fl_logo.svg`, `lesezeichen-spikes.svg`, `nav-spark-green.svg`, `icon_versicherungen|finanzen|steuer|recht.svg`, `icon_anbieter.svg`, `iconPhone.svg`, `iconWeb.svg`, `lupe.svg`, `info_i.svg`, `time_icon.svg`, `fazit-starburst.svg`, `finconext_logo.svg`, `arrow down.svg`.
Bilder: `assets/leo.svg`, `assets/lupeVisual.png`, `assets/kontaktAnbieter.png`, `assets/general/rechner_visual.png`, `assets/general/checkliste_Visual_slide.png`, `assets/finanztoolSlider/vergleich_visual.png`, `assets/vids/rechner|vergleiche|checklisten|toolbox.webp`, `assets/redaktion/nicole-hahn.jpg`.
Anzeigen (Steuerfuchs, Nordlicht, baufix) sind Dummy-Mocks in Fremdfarben – durch echte Ad-Slots ersetzen.

## Files
- `Finanzleser Faden A v2 - Zeitung.dc.html` – **maßgebliche Referenz** (Desktop + Mobil, alle Kapitel, Menü, Randspalten, Logik).
- `Finanzleser Faden A - Zeitung.dc.html` – Vorgänger; enthält zusätzlich **Landing-Animation** (Zeitung faltet sich zum Papierflieger, Logo fliegt in den Kopf) und **Kiosk-Doppelseite** – beides ist in v2 nicht enthalten und soll nach Landing-Entscheidung ergänzt werden.
- `Finanzleser Faden - Designvorschlag.dc.html` – Optionen-Canvas (Richtung A/B), nur Kontext.
- `github.md` – Screen-Map Prototyp → Repo-Dateien.
- `public/` – verwendete Assets (Kopien aus dem Repo).

## Offene Punkte / bekannte Lücken
- Suche (Lupe) ohne Ergebnisansicht; Newsletter-Knopf im Kopf nur Toast.
- Landing/Papierflieger und Kiosk-Doppelseite nur in A (nicht v2).
- Inhalte der dynamischen Ratgeber sind generisch (RG_TEXT.default) – im Produkt aus dem CMS.
- Anzeigen-Umfluss im Text (FAQ mit umflossener Anzeige aus A) nicht in v2.
