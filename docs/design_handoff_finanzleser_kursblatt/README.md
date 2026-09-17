# Handoff: Finanzleser „Kursblatt“ – Vergleiche & Rechner im Zeitungsstil

## Overview
Neues Design für die **Vergleichsrechner** (financeads-API, z. B. Autokredit, Festgeld) und die **56 Rechner** von finanzleser.de. Ziel: Eingaben, die Spaß machen und sofort verständlich sind; eine Statistik, die den Markt auf einen Blick erklärt; Gewinner und CTA, die man nicht übersehen kann. Alles in der Zeitungs-DNA des Fadens (Merriweather + Open Sans, Haarlinien, Doppellinien, Punktführung, dunkle Tinte direkt auf Papier, Herzschlag-Reveals) und auf **728 px Fadenbreite** gesetzt, mobil bis 360 px.

Repo-Kontext: `brownsugarwhite/finanzleser` (Next.js/React, Branch `/faden`). Betroffene Produktseiten: `app/finanztools/vergleiche/[slug]/page.tsx` (+ `components/vergleich/VergleichEmbed.tsx`, `app/api/vergleich-data/[slug]/route.ts`) und `components/rechner/*` (+ `RechnerEmbed.tsx`, `components/rechner/ui/*`).

## About the Design Files
Die Dateien in diesem Paket sind **Design-Referenzen in HTML** (Design Components: Template mit Inline-Styles + Logikklasse). Sie zeigen Look, Maße und Verhalten – sie sind **kein Produktionscode**. Aufgabe: die Designs in der bestehenden Next.js/React-Codebase nachbauen, mit den vorhandenen Tokens (`app/tokens.css`), Fonts, Hooks (`useRechnerState`, `useRates`) und Datenpfaden (financeads-API-Daten statt Beispieldaten). `support.js` ist die Laufzeit des Prototyp-Werkzeugs und **nicht** zu portieren.

## Fidelity
**High-fidelity.** Farben, Typografie, Abstände, Zustände und Animationen sind final gemeint. Angebote, Zinsen und Banken sind **Beispieldaten** (12 Autokredit-, 10 Festgeldangebote) und kommen im Produkt aus der financeads-API. **Listen haben keine Nummerierung** (wie bei financeads); statt Rang steht links das **Bank-Logo** in einem Rahmen 96×34 px (`1px rgba(51,74,39,.18)`, weiß, Innenabstand 3 px, `object-fit:contain`; Gewinner 120×42, Platz 2/3 96×34, mobil 64×34). Im Prototyp sind das Drop-Zonen (`<image-slot>`) – echte Logos kommen aus der API.

---

## Design Tokens

### Farben (nur diese)
| Token | Hex | Verwendung |
|---|---|---|
| Papier | `#faf9f6` | Seitenhintergrund, Register-Verzeichnis, Stempel-Grund |
| Weiß | `#fff` | Monogramm-Kästchen, Ergebnis-Kachel 1, Merkzettel, Setzzeile im Fokus (`rgba(255,255,255,.7)`) |
| Tinte | `#334A27` | Text, Linien, Nadel-/Griffrand, aktive Segmente, Tooltips |
| Tinte 35/30/25/22 % | `rgba(51,74,39,.35/.3/.25/.22)` | Grundlinie Setzzeile/Register, Rahmen Monogramm, Chip-Rand |
| Tinte 16/12/10/8 % | `rgba(51,74,39,.16/.12/.1/.08)` | Zeilentrenner, Gitterlinien |
| Tinte 5/3,5 % | `rgba(51,74,39,.05/.035)` | Hover-Grund Zeilen/Register-Einträge |
| Grau | `#686C6A` | Kicker, Meta, Hinweise, Rang, inaktive Reiter |
| Primary Green | `#45A117` | Live-Punkt, Haken, Ersparnis, Knoten, Reiter-Unterlinie, aktiver Filter-Punkt |
| Green dark | `#2E7A0B` | Werkzeug-Kicker, Merkmale mit Haken, „Gemerkt“ |
| Türkis (Vergleich) | `#0B7F66` | Bestwert-Zins, Lineal-Nadel, Zinsband/Zinskurve, CTA-Knopf/Füllung, Rahmen Gewinner |
| Türkis hell | `#06D496` | Stempel „Bestwert“/„Höchster Ertrag“, Bestwert-Zeile `rgba(6,212,150,.07)` |
| Magenta (Rechner) | `#D3005E` | Kicker „Anzeige“, Rechner-Punkt, Drehring-Bogen, Ausrechnen-Knopf, Monatsrate, Zinsanteil, Mehrkosten, Fehler, Scrubber |
| Grau-Rahmen | `#999` | Outline der Ergebnis-Kachel 1 (`outline:2px solid #999; outline-offset:3px`) |

### Typografie
- **Merriweather** (variable, 300/400/500/600/700/900, italic) – Überschriften, Zahlen, Labels der Eingaben, Kursiv-Vorspann/Hinweise.
- **Open Sans** (400/500/600/700) – UI, Kicker, Tabellen, Buttons.
- Kicker: `700 10.5px/1.3 'Open Sans'; letter-spacing:.14em; uppercase; #686C6A` (grün `#2E7A0B` für Werkzeug-Kicker mit 8-px-Punkt in Werkzeugfarbe).
- „Anzeige · Vergleich mit Partnerlinks“: `italic 400 clamp(16px,2.4vw,19px) Merriweather; #D3005E`.
- H1 Vergleich: `900 clamp(38px,8vw,60px)/1.02 Merriweather; letter-spacing:-.02em`.
- H2 Rechner: `900 clamp(32px,6.5vw,50px)/1.05`. H2 Bausteine: `900 clamp(30px,6vw,46px)/1.05`.
- H3 Marktüberblick: `700 clamp(19px,2.8vw,23px)/1.25 Merriweather; text-wrap:balance`.
- Vorspann: `italic 300 clamp(16px,2.4vw,19px)/1.5 Merriweather`; Erklärsätze `italic 300 13.5px/1.5`; Hinweise `italic 300 12–12.5px`.
- Eingabe-Labels: `600 15px Merriweather` + rechts Bereich `400 12px Open Sans #686C6A`.
- Zahlen: `font-variant-numeric: tabular-nums` überall.

### Linien
- Doppellinie (Kopf, Tabellenkopf, Kennzahlen-Kopf): `border-top:2px solid #334A27` + `box-shadow:0 3px 0 -2px #334A27` (bzw. zwei Divs 2 px + 2 px Abstand + 1 px). Kopf-Linien zeichnen sich von der Mitte (`fl-mitte .9s`, zweite .12 s später).
- Punktführung: `border-bottom:1px dotted rgba(51,74,39,.4); transform:translateY(-4px)`.
- Werkzeug-Einhänger: `border-top:2px solid <Werkzeugfarbe>` + Kicker mit Punkt.
- Zeilentrenner Listen: `1px solid rgba(51,74,39,.12)`.

### Buttons
- **Pille (Haupt-CTA)**: `height:48px; padding:3px 3px 3px 19px; border:2px solid #334A27; outline:1px solid #334A27; outline-offset:2px; border-radius:21px; font:500 16–17px Open Sans`; rechts Knopf 38 px rund in Werkzeugfarbe mit weißem Glyph (Vergleich: Pfeil ↗ `M4 12L12 4M6 4h6v6`; Rechner: „=“ zwei Striche; Brücke: Pfeil ↑). **Hover-Füllung** (Vergleich): der Knopf ist ein absolut positioniertes `<i>` (`top/bottom/right:3px; width:38px; border-radius:19px`), das auf Hover auf `width:100%` wächst (`.5s cubic-bezier(.2,.8,.2,1)`) und die Pille türkis füllt; Text wird weiß. Listen-Pille: 42 px hoch, Knopf 32 px, ohne Outline; mobil nur Knopf (Text `display:none`, `padding-left:3px`).
- **Ausrechnen-Pille**: Hover Text `#D3005E`; während Rechnen schrumpft der Knopf `scale(.8)` (`.35s cubic-bezier(.34,1.56,.64,1)`), Label „Neu ausrechnen“ wenn Eingaben nach Ergebnis geändert (Ergebnis dann `opacity:.45`).
- **Chip (Filter)**: `min-height:40px; padding:0 16px; border:1px solid rgba(51,74,39,.25); radius:999px; font:500 13.5px`, links 7-px-Punkt (aktiv `#45A117`, sonst 30 % Tinte); aktiv: Grund Tinte, Text weiß; Hover `translateY(-1px)`, Rand Tinte.
- **Strich-Link**: Text + `<i>` 18 px × 1 px currentColor; Hover 34 px (`width .45s`).
- **Segment (Verwendung)**: `inline-grid repeat(3,auto); height:44px; border:1px solid rgba(51,74,39,.3)`; gleitender Tinte-Block hinter dem aktiven Segment (`left/width .45s cubic-bezier(.34,1.4,.64,1)`, Breite per Messung der Buttons); mobil (< 560) `grid; width:100%; repeat(3,1fr); padding 0 6px; font 12px`.
- **Stempel-Preset**: `padding:8px 14px 7px; min-height:44px; border:1.5px solid; radius:4px; rotate(-3/2/-1.5deg)`, Label `700 11px uppercase .12em` + Sub `italic 300 11px`; aktiv magenta + `rotate(0)`, inaktiv grau; Hover `rotate(0) scale(1.04)`; Klick `fl-stempelflach .6s`.
- Tap-Ziele mindestens 40–46 px.

### Bewegung (Herzschlag-Prinzip)
Standardkurve `cubic-bezier(.2,.8,.2,1)`, Überschwung `cubic-bezier(.34,1.56,.64,1)`. Tweak `tempo` (ruhig 1.35× / normal / lebhaft .65×) skaliert Delays. **Neustart-Trick**: jede Keyframe-Animation existiert doppelt (`fl-herz`/`fl-herz2`, `fl-mitte`/`fl-mitte2`, `fl-spalte/2`, `fl-stempel/2`, `fl-zeichnen/2`, `fl-druck/2`); ein Zähler `lauf` (erhöht bei jeder Änderung der Eingaben/Filter/Sortierung) wechselt den Namen und startet die Animation neu.
- `fl-herz` (.7–.9 s): opacity 0→1, translateY 14→-2→1→0, scale .985→1.008→.999→1. Seitenblöcke gestaffelt .2/.3/.4/.5/.6 s, Listenzeilen `i×.05 s`.
- `fl-mitte`/`fl-linie` (.9–1 s): scaleX 0→1 (Origin center/left/right). `fl-spalte` (.7–.9 s): scaleY 0→1.
- `fl-puls` (2.2 s ∞, Bestwert-Punkt): Doppelschlag scale 1→1.2→1→1.12→1 + Ring-Schatten `rgba(11,127,102,.45)` bis 12 px. `fl-punkt` (1.8 s ∞, Live-Punkt grün).
- `fl-stempel` (.7 s): scale 1.7→.94→1, rotate -22→-8→-11°, Delay .5 s. `fl-stempelflach` (.6 s): scale 1.5→.96→1, rotate -8→1→0.
- `fl-druck` (.6–.7 s): opacity, translateY 7→0, letter-spacing .06em→0, blur .6→0 (Kicker, H1, Bestwert-Label, Register-Einträge gestaffelt `.05+i×.04 s`).
- `fl-zeichnen` (1.4–1.6 s): SVG `pathLength="1" stroke-dasharray="1" stroke-dashoffset:1→0`.
- `fl-zettel` (.7 s): translateX 26→-2→0, rotate 3→-1.4→-1°. `fl-knoten` (.5 s): scale 0→1.6→1.
- Zählwerke: 950 ms × tempo, ease-out-cubic (`1-(1-p)^3`), requestAnimationFrame; Werte laufen vom alten zum neuen Wert (beim Laden von 0).
- Transitions: Positionen im Zinsband/Zinskurve `.7s/.5s`, Balken `.7s`, Hover-Rahmen `.4s`, Details `grid-template-rows .5s`, Ergebnis `grid-template-rows .75s`, Register aufklappen `transform .5s cubic-bezier(.22,1.1,.36,1)`, Segment-Block `.45s`, Odometer-Ziffern `.5s`, Drehring `.45s` (beim Ziehen `none`).
- Scroll: `window.scrollTo({behavior:'smooth'})`, Offset 24 px (Seiten) / 90 px (Ergebnis).

### Breakpoints
Containerbreite (ResizeObserver auf dem Wurzel-Element, nicht Viewport): `eng = Breite < 560 px`. Maximalbreite 728 px, Padding `clamp(14px,3vw,24px)`.

---

## Neue Eingabe-Bausteine (5)

### 1 · Lineal (`FL Lineal.dc.html`) – Beträge & Laufzeiten
Ziehbarer Zollstock unter fester Nadel. Höhe 118 px.
- **Spur**: `width = Schritte × px` (Vergleich Summe: 1.000–100.000 € Schritt 500, 9 px/Schritt; Laufzeit 12–120 Monate Schritt 6, 30 px; Rechner Summe 500–200.000 € Schritt 500, 7 px). Links/rechts mit `mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)` ausgeblendet. Grundlinie 1 px Tinte bei `top:36px`; Ticks 1 px: groß 18 px Tinte an Vielfachen von `major×step` (10.000 / 12 Monate), mittel 12 px an `mittel×step` (5.000 / 6 Monate), klein 7 px `rgba(51,74,39,.45)`. Beschriftung unter großen Ticks `500 11px Open Sans #686C6A` bei `top:58px`; die Beschriftung unter der Nadel (Abstand < 22 px) blendet aus.
- **Nadel**: 2 px × 30 px in Werkzeugfarbe ab `top:26px`, `box-shadow:0 0 0 3px rgba(250,249,246,.9)`, Dreieck 10×6 darüber.
- **Marken (Pins)**: Buttons oben auf der Spur (`5.000 · 10.000 · 20.000 · 50.000` / `3 Jahre · 5 Jahre · 7 Jahre`) `500 11.5px Open Sans` + Dreieck 8×5; aktive Marke `700` in Werkzeugfarbe; Klick springt (Transition `.55s`).
- **Wert**: `<input>` mittig unter der Nadel `700 17px Merriweather` in Werkzeugfarbe, gestrichelte Unterlinie `1px dashed rgba(51,74,39,.35)`, Breite `(Zeichen+2)ch`; Fokus: durchgezogen, Grund `rgba(255,255,255,.7)`; tippen + Enter/Blur übernimmt (de-DE-Format, Komma). Bei jeder Änderung Tick-Animation `scale 1→1.1→1 .3s`.
- **Mechanik**: Pointer-Drag (setPointerCapture; `wert = startWert − dx/px×step`, während Drag keine Transition), Mausrad ±Schritt, Pfeiltasten ±Schritt (Shift ×major), `role="slider"`, `touch-action:none`.
- Hinweis rechts unten `italic 300 11.5px` „ziehen · Marke antippen · Zahl eintippen“ mit pendelndem 14-px-Strich (`fl-hand 1.8s`), verschwindet nach erster Interaktion und unter 520 px Breite.

### 2 · Drehring – kleine Skalen mit festen Schritten (Laufzeit im Rechner)
SVG 180×180 (gerendert 190 px), zentriert.
- Spur: Bogen r 64 von −135° bis +135° `rgba(51,74,39,.18)` 1.5 px. Ticks alle 6 Monate von r 72 bis 76 (1 px), alle 12 Monate bis 80 (1.5 px); Ticks ≤ Wert Tinte, danach 30 %. Beschriftungen 12/36/60/84/108 bei r 89 als **HTML-Overlay** (`500 10px`, in % positioniert – SVG-`<text>` mit Platzhaltern rendert im Prototyp nicht, im Produkt egal).
- Wertbogen: r 64, `#D3005E` 3 px, `stroke-linecap:round`, von −135° bis Wertwinkel. Griff: Kreis weiß, Rand 3 px Tinte, r 9 (beim Ziehen 12).
- Mitte (HTML-Overlay): Wert `900 36px Merriweather`, „Monate“ `italic 300 12px #686C6A`, „= 5 Jahre“ `500 11px #D3005E`.
- Mechanik: Pointer-Down/Move → Winkel `atan2(dx, −dy)`, auf ±135° begrenzt, `wert = 6 + (a+135)/270 × 114`, auf 6er-Schritte gerundet (6–120). Cursor grab/grabbing.

### 3 · Zählwerk – Prozentwerte mit Nachkomma (Zins im Rechner)
- Anzeige: Ziffernsäulen (Odometer). Jede Säule `display:inline-block; height:1em; overflow:hidden; line-height:1`, innen eine Spalte mit den Zeichen `0…9 . , % ␣ € ≈` untereinander (`<br>`), `transform:translateY(-index·1em)`, Transition `.5s cubic-bezier(.2,.8,.2,1)`. Breiten: Ziffer `.62em`, `.`/`,` `.3em`, Leerzeichen `.26em`, `%` `1.05em`, sonst `.82em`. Schrift `900 clamp(34px,5vw,44px) Merriweather`.
- Knöpfe −/+: 46 px rund, `1.5px solid #334A27`, Hover Grund Tinte/weiß, Active `scale(.9)`; **gedrückt halten**: nach 380 ms alle 70 ms ein Schritt (0,1). Bereich 0–19,9.
- Darunter Schnellwahl-Chips `3,9 % · 5,5 % · 7,9 % · 9,9 %` (34 px, aktiv Tinte gefüllt) und Hinweis „gedrückt halten für schnelles Zählen“.
- Dasselbe Odometer zeigt **„Leo rechnet mit: ≈ 387 €“** (live rollende Rate, `900 clamp(28px,4.4vw,36px)`).

### 4 · Setzzeile (`FL Setzzeile.dc.html`) – exakt bekannte Werte (Gehalt, Miete, km …)
Ersetzt das klassische Eingabefeld.
- Kicker-Label oben (`700 10.5px uppercase`, grau; im Fokus Werkzeugfarbe; bei Fehler Magenta).
- Zeile 54 px: links Knopf ‹ (34×44, Chevron 8 px 1.5 px), `<input>` `700 clamp(24px,3.2vw,30px) Merriweather` ohne Rahmen, Einheit `italic 300 16px #686C6A`, rechts Knopf ›. Knöpfe `opacity:.45`, im Fokus 1 (Prop `stepper` → immer 1).
- Grundlinie `1px rgba(51,74,39,.35)`; im Fokus zeichnet sich die **Doppellinie** (2 px bei −1 px, 1 px bei +3 px) in Werkzeugfarbe von der Mitte (`scaleX 0→1 .45s`, zweite Linie .08 s später). Fehler: Linien Magenta.
- Rechts am Zeilenende **grüner Knoten** 9 px (`#45A117`, 2 px Papier-Rand) poppt nach jedem gesetzten Wert (`fl-knoten .5s` Überschwung).
- Hinweiszeile darunter (min 18 px): links Hinweis `italic 300 12px` (bei Fehler magenta + `fl-druck`: „Höchstens 50.000 €“ / „Mindestens 500 €“ – live beim Tippen), rechts **Vorschläge** als gepunktet unterstrichene Zahlen (`500 12px`), sichtbar im Fokus (oder immer per Prop), `onMouseDown preventDefault` damit der Fokus bleibt.
- Mechanik: im Fokus roher Text (nur `0-9.,`), Blur/Enter parst de-DE, klemmt auf min/max, formatiert (`toLocaleString('de-DE')`), Pfeiltasten ±step (Shift ×10), ‹ › ±step, `inputmode="decimal"`.

### 5 · Register (`FL Register.dc.html`) – Auswahl aus 3–20 Einträgen
Ersetzt das Dropdown.
- Kicker-Label; Trigger 54 px: gewählter Eintrag `700 clamp(22px,3vw,28px) Merriweather` (ellipsis), rechts Meta `italic 300 13px #686C6A` + **Spark** 14 px (Tinte; offen: `rotate(135deg) scale(1.15)` in Werkzeugfarbe, `.55s` Überschwung). Grundlinie + Doppellinie wie Setzzeile (offen).
- Verzeichnis: absolut unter der Zeile (`top:calc(100%+4px)`, `min-width:100%; width:max-content; max-width:min(92vw,400px)`), Papier-Grund, `1px rgba(51,74,39,.22)`, Schatten `0 30px 40px -24px rgba(51,74,39,.45)`, `max-height:340px; overflow:auto`. Öffnen: `perspective:900px; transform-origin:top; rotateX(-72deg)→0 .5s cubic-bezier(.22,1.1,.36,1)`, Opacity .25 s. Wurzel `z-index:40` wenn offen.
- Eintrag: Grid `24px minmax(0,1fr) auto`, `min-height:44px; padding:9px 16px 9px 14px`, Trenner `1px 8 %`. Nummer `900 12px Merriweather #45A117` (aktiv Werkzeugfarbe), Label `500 15px Merriweather` (aktiv 700), Punktführung, Meta `500 12.5px #686C6A` (aktiv Werkzeugfarbe). Hover/Tastatur-Highlight: Grund 5 % Tinte, `padding-left 20px`. Einträge drucken sich gestaffelt ein (`fl-druck .45s`, `.05+i×.04 s`).
- **Meta ist live**: „36 Monate ······ bis 3,45 %“ (Bestzins je Laufzeit), „Nur Deutschland ······ 4 Angebote“, Steuerklasse „ledig, geschieden“, Bundesland „KiSt 8 %“.
- Tastatur: ↑↓ öffnen/bewegen, Enter/Space wählen, Esc schließt; Klick außerhalb schließt (document pointerdown); `role=listbox/option`, `aria-expanded`.

**Zuordnung**: Lineal → Beträge/Laufzeiten mit Gefühl · Drehring → kleine Skalen (Laufzeit, Alter, Stunden) · Zählwerk → Prozente · Setzzeile → alles exakt Bekannte · Register → Auswahllisten. Farbe folgt dem Werkzeug: Türkis im Vergleich, Magenta im Rechner.

---

## Screens

### Seite 1 · Vergleich Autokredit (`Finanzleser Vergleich & Rechner - Kursblatt.dc.html`)
Reihenfolge von oben: Zeitungskopf → Kopfzeile → Kicker „Anzeige …“ → H1 → Vorspann mit Live-Zahlen → **Ihre Angaben** → **Marktüberblick** → **Die drei Besten** → **Alle Angebote** → Rechtliche Hinweise. Fester **Merkzettel** unten rechts.

1. **Zeitungskopf**: Kicker links „Finanztools · Vergleiche · Kredit“, rechts „15. September 2026 · Kursblatt“; Doppellinie zeichnet sich von der Mitte. Darunter Seitenreiter „Seite 1 · Vergleich“ / „Seite 2 · Rechner“ (`600 14px Merriweather`, aktiv Tinte + 2-px-Grünlinie `scaleX`, folgt dem Scroll: aktiv = Sektion oberhalb 45 % Viewport) + Link „Seite 3–4 · Festgeld & Eingaben“.
2. **Vorspann**: „**12 Angebote** im Vergleich, Bestwert ab **0,68 %** effektiv, Stand 15.09.2026. …“ – fette Zahlen türkis, live.
3. **Ihre Angaben** (Einhänger türkis): Kicker mit Punkt + rechts „● Ergebnis folgt sofort – kein Knopf nötig“ (pulsierender grüner Punkt). Lineal Kreditsumme (voll breit), Lineal Laufzeit, Segment „Verwendung“ Neuwagen / Gebrauchtwagen / Umschuldung (Gebraucht +0,2 %, Umschuldung +0,1 % auf alle Zinsen). **Keine Filter-anwenden-Taste** – alles rechnet sofort.
4. **Marktüberblick**: Kicker „Marktüberblick“, H3 „Wie weit liegen die Zinsen auseinander? Alle 12 Angebote für 20.000 € über 60 Monate.“, Erklärsatz kursiv („Jeder Punkt ist ein Angebot – links günstig, rechts teuer. Der türkise Punkt ist der Bestwert, die gestrichelte Linie der Durchschnitt. Punkt antippen, um das Angebot unten zu öffnen.“).
   - **Zinsband** (Höhe 172 px): Kicker „Effektiver Jahreszins“ oben links; Grundlinie 1 px Tinte bei 112 px, „günstig“/„teuer“ darunter (`500 11px`). Jedes Angebot ein Punkt (10 px, hohl `1.5px solid #334A27` auf Papier) an `left = 5 % + (eff−min)/(max−min) × 90 %`; gleiche Zinsen stapeln sich 13 px nach oben. **Bestwert**: 14 px gefüllt türkis, `fl-puls`, 1-px-Faden nach oben (68 px, `fl-spalte`) zum Label „Bestwert 0,68 % · Verivox“ (`700 13px #0B7F66`, `fl-druck`). **Ø**: gestrichelte 24-px-Linie + „Ø 2,74 %“ darüber. Alle Positionen `transition left .7s`. Hover Punkt → 16 px, Tinte gefüllt, Tooltip unten (Tinte, weiß, `500 12px`: „Santander · 1,99 % · 351 €/Monat“), **und die zugehörige Zeile in der Liste hebt sich hervor** (umgekehrt hebt Zeilen-Hover den Punkt). Klick öffnet die Details der Zeile.
   - **Ihre Zahlen** (Doppellinie, Grid `1fr 1fr 1.6fr`, mobil `1fr 1fr` + Ersparnis über volle Breite): „Beste Rate im Monat“ `900 clamp(24px,4vw,30px)` türkis · „Durchschnittliche Rate“ `700 clamp(20px,3.2vw,24px)` grau · „Ersparnis mit dem Bestwert über 60 Monate“ `900 clamp(28px,5vw,40px)` **grün** + „gegenüber dem Durchschnitt“. Alle mit Zählwerk (= (Ø-Rate − Best-Rate) × Monate).
5. **Die drei Besten für Ihre Angaben**: Titelzeile mit Linien nach außen (`fl-linie`). **Gewinner**: Block mit 4 Rahmenlinien (oben 2 px, sonst 1 px, türkis), die sich von der Mitte zeichnen (`fl-mitte`/`fl-spalte`, .9 s, Seiten .2 s später); Stempel „BESTWERT“ (`700 11px .14em uppercase; 2px solid #06D496; rotate(-11deg)`, `fl-stempel` .5 s Delay) oben rechts über dem Rahmen. Grid `1.1fr 1fr` (mobil 1 Spalte): links Monogramm 46 px + Name `700 21px Merriweather` + Produkt kursiv 13.5 px, Zins `900 clamp(44px,8vw,60px)` türkis + „effektiver Jahreszins“, Merkmale mit grünem Haken (Sondertilgung kostenlos / Sofortzusage / Ratenpause möglich); rechts Punktführungs-Zeilen Monatsrate (`700 19px Merriweather`), Sollzins, Gesamtbetrag, dann CTA-Pille + „Merken“ (Lesezeichen-Icon, gefüllt grün wenn gemerkt). Hover auf den Block füllt die Pille.
   **Platz 2 & 3**: zwei Spalten (mobil 1) mit Oberlinie 25 % Tinte, große Rangziffer `900 40px rgba(51,74,39,.16)` rechts, Monogramm 38 px, Name `700 17px`, Zins `900 30px`, Punktführung Monatsrate + **„Mehrkosten zum Bestwert“ `+ 1.098 €` in Magenta**, unten Strich-Link „Zum Anbieter“ (Strich wächst bei Hover) + „Merken“.
6. **Alle 12 Angebote**: Titel `700 clamp(22px,3.4vw,26px)`, Filter-Chips „Nur mit: Sondertilgung kostenlos · Sofortzusage · Ratenpause“ (toggle), Zeile „12 von 12 Angeboten · Zeile antippen für Details“ + „Sortieren: **Zins** · Anbieter A–Z“ (aktiv 700 + 2-px-Unterlinie `scaleX`). Tabellenkopf (Doppellinie) Anbieter · Produkt | Effektivzins | Rate/Monat | (CTA); **Spalten fest**: `96px minmax(0,1fr) 88px 100px auto`, `column-gap 20px`, Zahlenspalten **rechtsbündig** (auch die Balken, `margin-left:auto`); mobil `64px minmax(0,1fr) auto auto`, gap 12 (Rate rückt als `600 13px` unter den Zins, CTA nur Knopf). **Zeile**: Logo-Rahmen, Name `700 15.5px Merriweather` + Mini-Stempel „Bestwert“ (`700 9px; 1.5px #06D496; rotate(-6deg)`, nur Desktop), Produkt `12.5px grau`; Zins `900 21px` + Balken 3 px (Breite = eff/maxEff, max 80 px; Bestwert türkis, sonst 50 % Tinte); Rate `700 17px Merriweather`; Pille. Details/Merken-Zeile mit Einzug 116 px (mobil 0). Bestwert-Zeile Grund `rgba(6,212,150,.07)`. **Hover**: 1-px-Rahmenlinien oben (Origin links) und unten (Origin rechts) wachsen `scaleX 0→1 .4s`, Grund 3,5 % Tinte, Pille füllt sich. Unter dem Grid: „Details ▾“ (Chevron dreht 225° mit Überschwung) und „Merken“. **Details** klappen per `grid-template-rows 0fr→1fr .5s`: 2-spaltige Punktführung (mobil 1) – Sollzins, Gesamtbetrag, Sondertilgung (grün wenn kostenlos), Sofortzusage, Ratenpause, ⅔ der Kunden erhalten, Auszahlung, Mindestalter. Zeilen erscheinen `fl-herz` gestaffelt `i×.05 s` bei jeder Neusortierung/Filterung.
7. **Merkzettel** (fixed `right:16px; bottom:16px`, `min(360px, 100vw−32px)`, weiß, `1px rgba(51,74,39,.22)`, Schatten `2px 4px 0 rgba(51,74,39,.08), 0 24px 40px -22px rgba(51,74,39,.45)`, `rotate(-1deg)`, grüner Knoten links, `fl-zettel`): Kicker „Merkzettel · 2 von 3“ + „Leeren“; bis 3 Spalten je gemerktem Angebot (2-px-Oberlinie türkis für Bestwert, sonst Tinte; Name `700 13px`, Zins `900 22px`, Rate, Gesamt, ×). Fußnote „Noch 1 Platz – „Merken“ bei weiteren Angeboten“.
8. **Rechtliche Hinweise** `400 12.5px/1.6 #686C6A`.

### Seite 2 · Kreditrechner (gleiche Datei)
Doppellinie, Kicker „Seite 2 · Finanztools · Rechner“ / „56 Rechner in dieser Ausgabe“, Werkzeug-Kicker magenta „Rechner · Kredit“, H2 „Kreditrechner“, Vorspann „Ziehen, drehen, tippen – die Rate rechnet sofort mit. Der Knopf öffnet das vollständige Ergebnis …“.
1. **Schnell einstellen**: 3 Stempel-Presets (Autokredit 20.000 € · 60 Monate · 5,5 % / Ratenkredit 10.000 · 48 · 6,5 / Modernisierung 50.000 · 120 · 4,5).
2. **Eingaben**: Lineal Kreditsumme (magenta, 500–200.000 €, Marken 10.000/20.000/50.000/100.000) voll breit; darunter Grid `1fr 1fr` (mobil 1): Drehring Laufzeit („am Ring drehen“) | Zählwerk Zinssatz p.a. („Sollzins“).
3. **Leo rechnet mit** (Zeile zwischen zwei Punktlinien): „Leo rechnet mit: ≈ 387 € im Monat · unverbindlich“ (Odometer) + rechts Pille „Ausrechnen“ (Knopf magenta „=“).
4. **Ergebnis** (`grid-template-rows 0fr→1fr .75s`, danach Scroll mit 90 px Offset): Punktlinie von außen (`fl-mitte`) + „ERGEBNIS“ `300 14px letter-spacing 2px`; 3 Kacheln Grid `1.2fr 1fr 1fr` (mobil 1): **Monatsrate** (weiß, `1px 30 % Tinte` + `outline 2px #999 offset 3px`, Wert `700 clamp(28px,4.6vw,36px)` magenta), Gesamtzinsen, Gesamtbetrag (`rgba(0,0,0,.03)`, `700 clamp(22px,3.4vw,28px)`), Zählwerke, `fl-herz` gestaffelt .2/.32/.44 s. **So verteilt sich Ihre Zahlung**: Band 18 px Tilgung (Tinte) | Zinsen (Magenta), 2 px Lücke, Legende mit Prozent. **Restschuld über die Laufzeit**: SVG 640×220 – Grundlinie, 2 Gitterlinien, Fläche `rgba(51,74,39,.06)`, Linie Tinte 1.5 px zeichnet sich (`fl-zeichnen 1.6s .4s`), Jahres-Ticks; Achsen-/Jahreslabels als HTML-Overlay (`500 10px`); **Scrubber**: Pointer über dem Chart → gestrichelte Magenta-Linie + weißer Punkt mit Magenta-Rand + Tinte-Label „Monat 24 · Restschuld 12.340 €“ (Label klappt links, wenn x > Mitte). **Jahresübersicht**: Grau-Doppelkopf `#686C6A` (Jahr | Zinsen | Tilgung | Restschuld), Zeilen `400 14px tabular`, Zinsen magenta, Restschuld 600, letzte Zeile `2px solid #D3005E` oben, `fl-herz` gestaffelt. Hinweisblock (2-px-Magenta-Oberlinie). **Brücke „Passende Angebote“** (2-px-Türkis-Oberlinie): „Für 20.000 € über 60 Monate gibt es im Autokredit-Vergleich aktuell Angebote ab **0,68 %** – das wären **340 €** im Monat.“ + Pille „Angebote ansehen“ (übernimmt Summe/Laufzeit in den Vergleich und scrollt zu Seite 1) + Strich-Link „In den Aktenkoffer“ → „Im Aktenkoffer ✓“.
5. Formeln: Annuität `rate = s·r/(1−(1+r)^−m)`, `r = z/100/12`; Tilgungsplan monatlich, Jahresaggregation; Ergebnis „veraltet“ wenn nach Ausrechnen Eingaben ändern.

### Seite 3 · Festgeldvergleich (`Finanzleser Festgeld & Eingaben - Kursblatt.dc.html`)
Gleicher Aufbau wie Seite 1, aber:
1. **Ihre Angaben**: Grid `minmax(0,1fr) minmax(0,1fr)` (mobil 1): **Setzzeile** „Anlagebetrag“ (500–500.000 €, Schritt 500, Vorschläge 5.000/10.000/20.000/50.000, Hinweis „Pfeiltasten oder ‹ › ändern in 500-€-Schritten“) | **Register** „Anlagedauer“ (3/6 Monate, 1–5 Jahre; Meta „bis 3,45 %“ = Bestzins je Laufzeit) | **Register** „Einlagensicherung“ (Alle EU-Länder / Nur Top-Bonität (DE, SE) / Nur Deutschland; Meta „n Angebote“).
2. **Marktüberblick – Zinskurve**: H3 „Lohnt sich länger binden? Der beste Zins je Laufzeit.“ + Erklärsatz. SVG 640×210: x von 70 bis 610 (7 Laufzeiten), y-Skala in 0,5-%-Schritten (Gitter 12 % Tinte, Labels links als Overlay), **türkise Linie** = bester Zins je Laufzeit (2 px, `fl-zeichnen 1.4s`), **graue gestrichelte Linie** (`4 4`) = Durchschnitt. Punkte als HTML-Buttons (10 px hohl türkis; Hover 14 px Tinte; **gewählte Laufzeit 16 px gefüllt, `fl-puls`, gepunkteter Stiel zur Grundlinie**), Zinslabel über jedem Punkt (`500 11px grau`, aktiv `700 13px türkis`), Laufzeit unter der Achse (aktiv 700 türkis). **Klick auf einen Punkt setzt die Laufzeit** (synchron mit dem Register).
   **Kennzahlen** (Doppellinie, Grid `1fr 1fr 1.5fr`): „Zinsertrag mit dem Bestwert + 2.142 € · nach 3 Jahren“ (türkis) · „Ø aller Angebote + 1.980 € · Bestwert bringt 162 € mehr“ · „Nach Inflation (2,1 % p.a.) bleibt real **+ 856 €** echter Kaufkraftgewinn“ (`900 clamp(28px,5vw,40px)` grün; **magenta mit „−“ und „Kaufkraft sinkt trotz Zinsen“**, wenn negativ). Zählwerke.
3. **Das beste Angebot**: wie Gewinner Seite 1, Stempel „HÖCHSTER ERTRAG“, Zins groß + Punktführung Zinsertrag (türkis), Endbetrag, Zinszahlung („jährlich aufs Konto“ / „am Ende der Laufzeit“), Merkmale (Einlagensicherung Land, Zinseszins, kostenlose Kontoführung), CTA. Nur ein Gewinner (kein Platz 2/3).
4. **Alle Angebote**: **sortiert nach Ertrag in €** (nicht nach Zins – jährliche Zinszahlung mit Zinseszins schlägt höheren Nominalzins mit Auszahlung am Ende). Kopf Bank · Produkt | Ertrag | Zins p.a. | Land | (CTA), Spalten `96px minmax(0,1fr) 96px 66px 44px auto`, gap 18; Ertrag `900 20px` rechtsbündig (+ Balken), Zins `700 16px` rechtsbündig, Land als Farbpunkt + Kürzel „FR“ (grün = Top-Bonität DE/SE, türkis = sonstige EU; voller Name als `title`); Banknamen dürfen umbrechen. Mobil: Ertrag groß, „3,45 % · FR“ darunter.
5. Ertragsformel: jährliche Zahlung und ≥ 1 Jahr → `b·((1+r)^y − 1)`, sonst `b·r·y`. Inflationsverlust `b·(1,021^y − 1)`.

### Seite 4 · Setzkasten: Eingabe-Bausteine für Rechner (gleiche Datei)
Kicker magenta „Rechner · Beispiel Brutto-Netto“, H2 „Setzzeile & Register“, Erklärtext. Grid `minmax(0,1fr) minmax(0,1fr)`: Setzzeile „Bruttogehalt im Monat“ (500–50.000 €, Schritt 100, Vorschläge 2.500/3.800/5.200, Hinweis „Versuchen Sie 999.999 – die Zeile meldet sich“) | Register „Steuerklasse“ (I–VI mit Meta) | Register „Bundesland“ (16, `max-height 300px`, Meta KiSt 8/9 %) | Setzzeile „Kinderfreibeträge“ (0–10, Schritt 0,5, eine Dezimale, Stepper immer sichtbar, Vorschläge 0/1/2 immer sichtbar). Darunter Zeile „Leo liest mit: 3.800 € brutto, Klasse I in Nordrhein-Westfalen, ohne Kinderfreibetrag – sobald Sie „Ausrechnen“ drücken, öffnet sich das Ergebnis.“ (live). Dann Zuordnungstabelle „Wann welcher Baustein“ (Punktführung) und Text „Was jeder Baustein kann“.

---

## State (Prototyp → zu übertragen)
**Vergleich**: `summe, monate, verwendung, sort ('zins'|'anbieter'), f {sonder,sofort,pause}, offen (id), gemerkt[] (max 3), hover, hoverDot, hoverTop, cw (Containerbreite), seite, z {Zählwerk-Werte}`. Signatur aus Eingaben/Filter/Sortierung → bei Änderung `lauf++` (Animations-Neustart) + Zählwerk starten. Zins je Angebot = Basis ± Laufzeit-/Summen-/Verwendungsaufschlag (im Produkt: API-Werte je Parameter).
**Rechner**: `rs, rm, rz, erg {rate, gesamt, zinsen, plan[], jahre[]}, ergAuf, rechnen, veraltet, stempel, hoverM, koffer`.
**Festgeld**: `betrag, dauer, sicherung, hover, hoverTop, hoverPunkt, z`. **Bausteine**: `brutto, stkl, land, kinder`.
Datenquellen: financeads-API (Angebote, Zinsen, ⅔-Zins, Merkmale, Logos, Deeplinks), `useRates` (Marktzins), Aktenkoffer/Nutzerkonto.

## Umsetzungshinweise
- Bausteine als wiederverwendbare React-Komponenten unter `components/rechner/ui/` bzw. `components/ui/`: `Lineal`, `Drehring`, `Zaehlwerk`, `Setzzeile`, `Register` (+ `PilleCTA` mit Hover-Füllung, `Stempel`, `Zinsband`, `Zinskurve`, `Kennzahlen` mit Zählwerk). Bestehende `RechnerInput`/`RechnerButton`/`ResultSpacer`/`useRechnerState` können intern weiterverwendet oder ersetzt werden; das Ergebnis-Öffnen (Punktlinie, Kacheln, Scroll) folgt dem bisherigen Live-Verhalten.
- Vergleiche rendern **nativ aus API-Daten** (kein iframe); `VergleichEmbed` bleibt als Fallback für Nicht-financeads-Quellen. Consent-Gate wie bisher vor dem Laden der Partnerdaten.
- `prefers-reduced-motion`: Reveal-Animationen weglassen, Zählwerke springen, Transitions bleiben kurz.
- SVG-Beschriftungen bitte als echte `<text>` setzen (Overlays im Prototyp sind ein Werkzeug-Workaround).
- Containerbreite per ResizeObserver (Faden 728 px, nicht Viewport) für `eng < 560`.

## Files
- `Finanzleser Vergleich & Rechner - Kursblatt.dc.html` – Seite 1 (Autokredit-Vergleich) + Seite 2 (Kreditrechner). Maßgebliche Referenz.
- `Finanzleser Festgeld & Eingaben - Kursblatt.dc.html` – Seite 3 (Festgeld, Zinskurve, Setzzeile/Register im Einsatz) + Seite 4 (Bausteine im Rechner-Kontext).
- `FL Lineal.dc.html`, `FL Setzzeile.dc.html`, `FL Register.dc.html` – die drei ausgelagerten Bausteine (Props im `data-props`-JSON der Datei).
- `image-slot.js` – Logo-Drop-Zonen des Prototyps (nicht portieren).
- `screenshots/` – Kursblatt (01 Kopf/Angaben, 02 Marktüberblick, 03 Liste, 04 Rechner-Eingaben, 05–06 Ergebnis), `mobil-kursblatt` (390 px: Kopf, Liste, Rechner), Festgeld (01 Kopf/Setzzeile/Register, 02 Zinskurve, 03 Liste, 04 Bausteine mit offenem Register).
- `github.md` – Screen-Map Prototyp → Repo-Dateien.
- Vorheriges Paket `design_handoff_finanzleser_faden/` (Faden A v2) enthält Tokens, Kopf, Menü und Kapitel-Kontext, in den diese Seiten eingehängt werden.

## Assets
Keine neuen Bilder. Spark-Icon (12/14 px Pfad aus `nav-spark-green.svg`) im Register-Trigger; Lesezeichen-Icon (Pfad `M3 1.5h8v11L7 9.6 3 12.5z`) für „Merken“; Pfeil ↗ und „=“ als Inline-SVG. Bank-Logos aus der financeads-API ersetzen die Monogramme.
