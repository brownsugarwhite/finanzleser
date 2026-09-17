# Handoff: Finanzleser „Heute“ – Fadeneinstieg, Teaser, Kassensturz, Wochenbrief, Plus

## Overview
Redesign der Elemente auf der Startseite (Landing + Kapitel „Heute“ des Fadens) von finanzleser.de. Ziel: ein eleganter, gut lesbarer Zeitungseinstieg, der zum Vergleichen, Lesen und Chatten mit Leo einlädt – mit kleinen, belohnenden Mikroanimationen.

Fünf Bausteine (Reihenfolge wie auf der Seite):
1. **Landing · Finanztool-Zeile** unter der zentrierten Leo-Eingabe (ersetzt die drei linksbündigen Karten)
2. **Vergleichs-Teaser** (4 Stück, 2 nebeneinander bei 728 px) mit **Säulen-Marktband** statt Illustration
3. **Marktüberblick im Kursblatt** (Vergleichsseiten): Säulen statt Punkte-Zinsband – gleiche Grafik, groß
4. **Finanz-Kassensturz**: neues Deckblatt mit Fahrplan, Antwortkarten mit Icons, **Beleg** in der rechten Spalte, Schätzfrage mit **Lineal**, Punkte-Flug, Stempel
5. **Leos Wochenbrief**: Teaser liegt direkt auf der Papierflieger-Animation (zentriert, Glasplatte)
6. **Finanzleser Plus**: Abo-Coupon mit Schnittlinie, Schere, Preis-Stempel und Leistungsverzeichnis

Neuer Baustein: **FL Adresszeile** – kompaktes, animiertes Feld für E-Mail/Name/Telefon (44 px), überall wo Kontaktdaten abgefragt werden.

Repo-Kontext: `brownsugarwhite/finanzleser` (Next.js/React). Betroffen: Landing (`app/page.tsx` + Hero/Tools-Komponenten), `components/faden/*` (Heute-Kapitel: Vergleichs-Teaser, Kassensturz, Newsletter-Block, Plus-Block), `components/vergleich/VergleichEmbed.tsx` (Marktüberblick), `app/faden.css`, `app/tokens.css`.

## About the Design Files
Die Dateien sind **Design-Referenzen in HTML** (Design Components: Template mit Inline-Styles + Logikklasse). Sie zeigen Look, Maße, Zustände und Animationen – sie sind **kein Produktionscode**. Aufgabe: die Designs in der bestehenden Next.js/React-Codebase nachbauen, mit den vorhandenen Tokens, Fonts und Hooks. `support.js` ist die Laufzeit des Prototyp-Werkzeugs und **nicht** zu portieren. Die Seite ist in **728 px** Fadenbreite gesetzt; unter **560 px Containerbreite** gilt der Zustand `eng` (mobil).

Öffnen zum Ansehen: `Finanzleser Heute - Teaser.dc.html` im Browser (lokaler Server nötig, damit `support.js`, Icons und Kind-DCs laden). Magenta Zeilen „Baustein n · …“ sind Notizen des Designs, nicht Teil des Produkts.

## Fidelity
**High-fidelity.** Farben, Typografie, Abstände, Zustände und Animationen sind final gemeint. Zahlen (Tarife, Preise, Zinsen, Punkte) sind **Beispieldaten**; im Produkt kommen sie aus der financeads-API bzw. den Rechnern. Das Himmelbild ist ein **Standbild der Kundenanimation** – im Produkt läuft die echte Animation darunter.

---

## Design Tokens

### Farben
| Token | Hex | Verwendung |
|---|---|---|
| Papier | `#faf9f6` | Seitengrund, Chips, Knoten-Rand |
| Weiß | `#fff` | Beleg, Eingabe-Mock, Karten-Grund `rgba(255,255,255,.45)` |
| Tinte | `#334A27` | Text, Linien, Rahmen, aktive Tasten |
| Tinte 55/50/32/30 % | `rgba(51,74,39,.55/.5/.32/.3)` | Säulen (Hover .5, normal .3–.32), Grundlinien |
| Tinte 20/16/14/12 % | `rgba(51,74,39,.2/.16/.14/.12)` | Spalten- und Zeilentrenner |
| Grau | `#686C6A` | Kicker, Meta, Kursivhinweise |
| Grau hell | `#9a9e9b` | Platzhalter, ungebuchte Belegzeilen |
| Grün | `#45A117` | Live-Punkt, Haken, Stempel „Geprüft“, Ampel grün, Tape gebucht |
| Grün dunkel | `#2E7A0B` | Werkzeug-Kicker, Links, Punkte-Flug, Wochenbrief-Farbe |
| Türkis | `#0B7F66` | Vergleich: Bestwert-Säule, Preis „ab“, Punkt |
| Magenta | `#D3005E` | Rechner-Punkt, Ampel rot, Fehler, 0 Punkte |
| Amber | `#D99A00` (Text `#B07D00`) | Ampel gelb, „nah dran“ |
| Grün hell | `#a9e07c` | Punktzahl auf gedrückter Taste |

### Typografie
- **Merriweather** (variable, 300–900, italic): Überschriften, Zahlen, Kursivhinweise, Belegkopf.
- **Open Sans** (400/500/600/700): UI, Kicker, Tabellen, Buttons.
- Kicker: `700 10.5px/1.3 Open Sans; letter-spacing .14em; uppercase; #686C6A` (grün `#2E7A0B` bei Werkzeug-Kickern, davor 8-px-Punkt).
- Kursivhinweis: `italic 300 12–13px Merriweather #686C6A`.
- H2 Landing: `900 clamp(26px,5vw,38px)/1.12; letter-spacing -.02em`.
- H3 Kassensturz Deckblatt: `900 clamp(26px,4.6vw,34px)/1.12`; Frage: `900 clamp(22px,3.6vw,27px)/1.2`; Ergebnis: `900 clamp(21px,3.2vw,26px)/1.2`.
- Teaser-Titel: `700 clamp(18px,2.9vw,21px)/1.2; hyphens auto; min-height 2.4em; text-wrap balance`.
- Zahlen: `font-variant-numeric: tabular-nums`.

### Linien & Rahmen
- Doppellinie (Zeitungskopf, Kennzahlen): 2 px + 2 px Abstand + 1 px Tinte; bzw. `border-top:2px solid; box-shadow:0 3px 0 -2px #334A27`.
- Punktführung: `border-bottom:1px dotted rgba(51,74,39,.35); transform:translateY(-3px)`.
- Werkzeug-Einhänger: `border-top:2px solid <Werkzeugfarbe>` (Kassensturz grün, Marktüberblick türkis).
- **Hover-Rahmen** (Teaser): vier 1-px-Linien Tinte, `inset:8px 0`; oben (origin left) → rechts (origin top, delay .16 s) → unten/links (delay .32 s), je `.18s cubic-bezier(.2,.8,.2,1)`, `scale 0→1`.

### Buttons
- **Pille**: `height 48px; padding 3px 3px 3px 19px; border 2px solid #334A27; outline 1px solid #334A27; outline-offset 2px; radius 21px; font 500 16px Open Sans`; rechts Kreis 38 px in Werkzeugfarbe (grün) mit weißem Pfeil `M3 8h10M9 4l4 4-4 4`. Hover Text `#2E7A0B`. Plus-Pille: Kreis wächst auf Hover auf volle Breite (`width .5s`), Text weiß.
- **Strich-Link**: Text `500 13.5px` + `<i>` 18 px × 1 px, Hover 34 px (`.45s`).
- **Antwortkarte (Registerkassen-Taste)**: siehe Kassensturz.

### Bewegung
Standardkurve `cubic-bezier(.2,.8,.2,1)`, Überschwung `cubic-bezier(.34,1.56,.64,1)`. Tweak `tempo` (ruhig 1.35× / normal / lebhaft .65×) skaliert Delays.
- `fl-herz` .8 s: opacity 0→1, translateY 14→-2→1→0, scale .985→1.008→.999→1 — Sektions-Reveal per IntersectionObserver (rootMargin `0 0 -8%`, threshold .06), einmalig.
- `fl-linie` scaleX 0→1; `fl-knoten` .5 s scale 0→1.6→1; `fl-druck` .5 s (opacity, translateY 6→0, letter-spacing .05em→0, blur .6→0).
- `fl-puls` (grün) / `fl-pulsT` (türkis) 2.2–2.4 s ∞: Doppelschlag scale 1→1.2→1→1.12→1 + Ring-Schatten bis 9–10 px.
- `fl-stempel` .7 s: scale 1.7→.94→1, rotate -22→-8→-11°.
- `fl-funke` .9 s: scale 0→1.4→.6, rotate -30→10→30°, opacity 0→1→0 (Spark-Icon).
- `fl-icon` .6 s Überschwung: scale .6→1.1→1, rotate -12→3→0.
- `fl-bon` .35 s: translateY 0→3→0 (Beleg „druckt“). `fl-tick` .4 s: scale 1→1.12→1.
- `fl-ring` ∞: scale 1→2.6, opacity .7→0 (Wächter). `fl-spin` 6 s ∞ (Spark). `fl-atmen` 3.2 s ∞ (Leo).
- Zählwerke: rAF, ease-out-cubic `1-(1-p)^3`, 950–1400 ms × tempo.
- Neustart-Trick: Keyframes doppelt (`fl-druck`/`fl-druck2`, `fl-bon`/`fl-bon2`, `fl-icon`/`fl-icon2`, `fl-tick`/`fl-tick2`); ein Zähler wechselt den Namen.

---

## Baustein 1 · Landing: Finanztool-Zeile
**Kontext:** zentrierter Hero (Ornament: 60-px-Linie · Spark 12 px · 60-px-Linie; Kicker `500 11px Merriweather, .22em uppercase`; H2), darunter die Leo-Eingabe (Pille 58 px, weiß, Schatten `0 14px 34px -18px rgba(51,74,39,.4)`, grüner Kreis 42 px mit Pfeil ↑).

**Zeile:** `max-width 600px; margin 20px auto 0; display:flex` (mobil `column`). Drei gleich breite `<a>` (`flex:1; text-align:center; padding 8px 14px 12px`), zwischen ihnen `border-left:1px solid rgba(51,74,39,.2)` (mobil `border-top … .16`).
Inhalt je Spalte, zentriert, `gap 4px`:
1. Kicker mit 8-px-Punkt in Werkzeugfarbe (Rechner `#D3005E`, Vergleiche `#0B7F66`, Checklisten `#45A117`); Hover: Kicker in Werkzeugfarbe, Punkt `fl-puls`.
2. Zahl `900 26px Merriweather, -.02em, tabular` + „im Faden“ `italic 300 12.5px #686C6A`. Zahl **zählt beim Einblenden von 0 hoch** (1100 ms, Start 250 ms nach Reveal); Hover `scale(1.08)` mit Überschwung.
3. Untertitel `italic 300 12px/1.35 Merriweather #686C6A` („Unterhalt, Rente, Steuer, Kredit“ / „Tarife nebeneinander“ / „Schritt für Schritt, als PDF“).
4. Hover-Unterstrich: 2 px in Werkzeugfarbe, `left/right 14px; bottom 2px`, `scaleX 0→1 .35s` von der Mitte.

Kein Link-Text mehr („Zu den Rechnern“) – die ganze Spalte ist der Link.

## Baustein 2 · Vergleichs-Teaser (Kapitel Heute)
**Kopf:** Leo 44 px (`fl-atmen`) + Kicker „Leo · Ihr Finanzagent“ + Kursivzitat `italic 400 clamp(17px,2.6vw,20px)/1.5`. Darunter 1-px-Linie Tinte.

**Raster:** `grid-template-columns: repeat(2, minmax(0,1fr))` (mobil `1fr`); rechte Spalte `border-left 1px rgba(51,74,39,.16)`, ab zweiter Reihe `border-top` gleiche Farbe. Unten 1-px-Linie 30 %. Teaser `padding 20px 22px 22px`, Hover-Rahmen (s. Tokens), Hover-Handler auf `mouseenter`, Reset auf `mouseleave` des Rasters.

**Inhalt (von oben):**
1. Zeile: Kicker „● Vergleich“ (Punkt türkis) links, rechts `italic 300 11.5px` „14 Tarife · Stand 17. Sept.“.
2. Titel (s. Typografie), `margin-top 10px`.
3. Preiszeile (`margin-top 12px; flex; space-between; wrap`): „ab“ `italic 300 13px #686C6A` · **Preis** `900 26px Merriweather #0B7F66 tabular` (Hover `scale(1.06)`) · „im Monat“ kursiv; rechts `600 12px #2E7A0B` „bis 83 € im Jahr sparen“ (= (max−min)·12, gerundet).
4. **Säulen-Marktband** (78 px hoch, `margin-top 10px`) – siehe unten.
5. Link „Tarife nebeneinander“ + Strich (18→34 px) + kleines Chevron; `margin-top 16px; padding-top 12px; border-top 1px dotted rgba(51,74,39,.35)`.

**Fußnote unter dem Raster:** `italic 300 12px #686C6A`: „Anzeige · Vergleiche mit Partnerlinks. Jede Säule ist ein Tarif, sortiert von günstig nach teuer; die Höhe zeigt die Ersparnis gegenüber dem teuersten Tarif – der Bestwert ragt heraus; die gestrichelte Linie ist der Marktdurchschnitt.“

### Säulen-Marktband (klein, im Teaser)
- Bereich `position:relative; height:78px`. Säulenzeile `top 10px; height 48px; display:flex; align-items:flex-end; justify-content:space-between`.
- Tarife **aufsteigend nach Preis sortiert**, günstigster links. `frac = (preis−min)/(max−min)`. **Höhe = Ersparnis:** `h = round((.16 + .84·(1−frac)) · 48)` px → der Bestwert ist die **höchste** Säule.
- Säule: `width 9px` (bei > 14 Tarifen 7 px), `border-radius 2px 2px 0 0`. Bestwert `#0B7F66`, übrige `rgba(51,74,39,.3)` (Hover des Teasers `.5`).
- Einblenden: `scaleY 0→1`, `.55s cubic-bezier(.34,1.3,.64,1)`, Delay `.2 + i·.04 s` (von links).
- **Ø-Linie**: `border-top 1px dashed rgba(51,74,39,.55)` bei `top = 58 − h(Ø)`; Label rechts oben darüber (`top: Ø − 15px; right 0; padding-left 3px; background #faf9f6; 600 10px #686C6A`): „Ø 5,40 €“. Erscheint nach den Säulen (opacity, delay 1.1 s).
- Grundlinie `top 58px; 1px rgba(51,74,39,.4)`, zeichnet sich `scaleX 0→1 .9s`.
- Pulsierender Punkt 7 px türkis über der Bestwert-Säule (`top 0; left 4.5px`), `fl-pulsT` ∞ ab 1.2 s.
- Beschriftung `top 63px`: links `700 10px #0B7F66` „Bestwert · 83 €/Jahr gespart“, rechts `500 10px #686C6A` „teuerster 9,80 €“.

Beispieldaten (min/Ø/max €/Monat, Anzahl): Privathaftpflicht 2,90/5,40/9,80 (14) · Kfz 21,40/34,60/58,10 (18) · Hausrat 3,10/6,20/11,40 (12) · Rechtsschutz 14,90/22,80/31,60 (9). Im Produkt: echte Tarifliste aus der API; Positionen = tatsächliche Monatsbeiträge.

## Baustein 2b · Marktüberblick im Kursblatt (Vergleichsseite)
Ersetzt das Punkte-Zinsband in `Finanzleser Vergleich & Rechner - Kursblatt` (Marktüberblick). Alles Übrige (Kennzahlen-Tripel, Doppellinien) bleibt.
- Einhänger `border-top 2px #0B7F66`; Kicker „● Marktüberblick · 20.000 € über 60 Monate“, rechts `italic 12px` „Säule antippen öffnet das Angebot“.
- H3 `700 clamp(19px,3vw,23px)/1.25` „Wie weit liegen die 12 Angebote auseinander?“; Lead `italic 300 13.5px/1.5`.
- Legendezeile (`margin-top 16px`): links `700 14px #0B7F66` mit 10-px-Punkt (`fl-pulsT`) „Bestwert 0,68 % · Verivox“; rechts `500 13px #686C6A` mit 18-px-Strich gestrichelt „Durchschnitt 2,83 %“.
- **Säulenfeld** `height 176px` (mobil 160): Säulenzeile `height 130px; gap 6px` (mobil 3). Je Slot (`flex:1`, Spalte, `gap 5px`): Wert `500 10px #686C6A` über der Säule (Bestwert `700 11px #0B7F66`; mobil nur Bestwert/Hover), Säule `width 16px` (mobil 10), `h = round((.14 + .86·(1−fz)) · 130)` mit `fz = (zins−0,5)/(5,2−0,5)`; Farben Bestwert `#0B7F66`, Hover `#334A27`, sonst `rgba(51,74,39,.32)`; Einblenden `scaleY .6s`, Delay `.25 + i·.05 s`.
- Ø-Linie gestrichelt `rgba(51,74,39,.6)` bei `130 − h(Ø)`, erscheint nach 1.2 s. Grundlinie `top 130px` 1 px Tinte.
- Banknamen unter der Grundlinie (`top 136px; 500 9.5px`, Bestwert `700 #0B7F66`, ellipsis; mobil ausgeblendet). Fußzeile `top 154px` (mobil 138): „günstig“ · „ERSPARNIS GEGENÜBER DEM TEUERSTEN“ (Kicker) · „teuer“.
- Hover auf Slot hebt Säule, Wert und Bankname in Tinte hervor. Klick springt zur Angebotszeile (wie bisher).
- Kennzahlen darunter (Beste Rate `#0B7F66`, Ø Rate `#686C6A`, Ihre Ersparnis `#45A117`): `900 clamp(26px,4.4vw,34px)`, Kicker + Kursivzeile, Doppellinie oben/unten, Spaltentrenner 20 %.

## Baustein 3 · Finanz-Kassensturz
**Rahmen:** Einhänger `border-top 2px #45A117`; Kicker grün mit pulsierendem Punkt „Finanz-Kassensturz · 3 Minuten · keine Anmeldung“; rechts Status `italic 300 13px` („Noch nicht begonnen“ / „Frage 3 von 8“ / „Ausgewertet“, `fl-druck` bei Wechsel).
**Tape:** 8 Segmente `height 3px; gap 4px` – gebucht `#45A117`, aktuell `#334A27` (zeichnet `fl-linie .6s`), offen `rgba(51,74,39,.14)`; beim Buchen `fl-tick`.
**Layout:** `grid-template-columns: minmax(0,1fr) 252px; gap 30px` – links Bühne, rechts **Beleg** (`position:sticky; top 20px`). Mobil (`eng`): eine Spalte, Beleg unter der Bühne, `width min(100%,300px)`, zentriert.

### Deckblatt (Phase `start`)
- H3 „Wie gut sind Sie eigentlich aufgestellt?“; Lead `italic 300 clamp(15px,2.3vw,16.5px)/1.55; max-width 40ch`: „Acht Fragen, eine Schätzung, keine Tastatur. Rechts druckt sich Ihr Beleg mit – am Ende stehen darauf Profil, Ampel und die drei größten Lücken.“
- **Fahrplan:** 3 Spalten, verbunden durch 1-px-Linie (`left/right 16.6%`, `top 14px`, 30 % Tinte). Je Station: Kreis 22 px (Papier, `1.5px` Tinte-Rand, Ziffer `900 10.5px Merriweather`) auf der Linie, darunter Titel `700 13px Merriweather` und Text `italic 300 11.5px #686C6A`: „8 Fragen antippen / ohne Tastatur, eine Schätzung“ · „Beleg druckt mit / jede Antwort eine Zeile, Punkte laufen“ · „Ergebnis sofort / Profil, Ampel, drei Lücken“. Einblenden gestaffelt `fl-herz`, Delay `.15 + i·.12 s`.
- Pille „Kassensturz starten“.

### Frage (Phase `frage`)
- Kicker „Frage n von 8 · Thema“, H3 Frage, Kursivhinweis. Bühne wechselt mit `opacity 0 / translateX(-16px)` (.28 s / .35 s).
- **Antwortkarten** (untereinander, `gap 8px`): `grid 36px 1fr auto; gap 14px; padding 11px 16px 11px 14px; min-height 56px; border 1px rgba(51,74,39,.28); background rgba(255,255,255,.45)`. Links **Icon 34 px** (Themen-Icon der Frage, Einblenden `fl-icon` Delay `.1 + i·.07 s`), Mitte Label `700 15.5px Merriweather` + Sub `400 12.5px .8`, rechts Punkte `700 12px #45A117; opacity .55`.
  Hover: Rand Tinte, `translateY(-1px)`. **Gedrückt** (gewählt, 640 ms bis Weiter): Grund Tinte, Text Papier, Icon `brightness(0) invert(1)`, `translateY(2px)`, `box-shadow inset 0 3px 0 rgba(0,0,0,.25)`, Punkte `#a9e07c`, `scale(1.25)`.
- **Punkte-Flug:** Chip `700 13px` weiß auf `#2E7A0B`, Radius 999, startet an der Punktzahl der gedrückten Karte, fliegt in `.65s cubic-bezier(.3,.7,.3,1)` zur Zwischensumme des Belegs (`scale .7`, Opacity ab .5 s aus). Koordinaten relativ zur Seite (absolut positioniert im Wurzelelement).
- „Zurück“ Strich-Link (ab Frage 2, nicht während Auflösung).

### Schätzfrage (Frage 5 „Rentenwissen“)
- Frage „Wie hoch ist die gesetzliche Altersrente im Schnitt – netto im Monat?“, Hinweis „Ziehen Sie das Lineal unter der Nadel hindurch. Danach zeige ich den echten Wert.“
- Eingabe: **FL Lineal** (`FL Lineal.dc.html`, Spezifikation im Kursblatt-Handoff): Label „Ihre Schätzung“, Bereich 600–2.400 €, Schritt 50, 7 px/Schritt, große Ticks alle 500 €, mittlere alle 250 €, Einheit „€ netto“, Farbe `#45A117`, Startwert 1.400. Nach dem Tipp gesperrt (transparente Sperre über dem Lineal).
- Pille „Tipp abgeben“ → **Auflösung** (2,3 s sichtbar, dann Weiter):
  - Zeile 44 px: Grundlinie 1 px 30 %; **Spanne** zwischen Tipp und Wahrheit 3 px in Urteilsfarbe (`fl-linie .6s`, Delay .2 s); Tipp-Marke 11 px weiß mit 2-px-Tinte-Rand + Label oben „Ihr Tipp 1.400 €“ `600 10.5px`; Wahrheits-Knoten 13 px `#45A117` mit Papierrand (`fl-knoten` .5 s), Label unten „tatsächlich 1.100 €“ `700 10.5px #2E7A0B` (`fl-druck`).
  - Urteil `italic 400 16px Merriweather`: |Δ| ≤ 150 → „Volltreffer – Sie kennen Ihre Zahlen. +12“ (`#2E7A0B`); ≤ 350 → „Nah dran. +6“ (`#B07D00`); sonst „Weit weg – gut, dass Sie es jetzt wissen. +2“ (`#D3005E`).
  - Wahrheit 1.100 € (Beispielwert – redaktionell pflegen).

### Fragenkatalog (Punkte 12/6/0, Abweichungen genannt) und Beleg-Kurzform
1. Haftpflicht (`icon_versicherungen.svg`) – Ja, ≥ 10 Mio. (12, „ja · 10 Mio.“) / Ja, Summe unbekannt (6, „ja · Summe?“) / Nein (0)
2. Notgroschen (`icon_rubbleCoin.svg`) – > 3 Monate / 1–3 Monate / < 1 Monat
3. Arbeitskraft (`icon_anbieter.svg`) – BU ja (12) / nur Unfall (4) / nein (0)
4. Vorsorge (`time_icon.svg`) – monatlich / gelegentlich / nein
5. Rentenwissen (`icon_quiz.svg`) – Schätzfrage, Beleg zeigt den Tipp „1.400 €“
6. Hausrat (`iconCheckliste.svg`) – ja (12) / ja · alt (7) / nein (3)
7. Verträge (`iconDokumente.svg`) – < 1 Jahr / 2–3 Jahre / nie
8. Steuer (`icon_steuer.svg`) – jährlich / manchmal / nie

Score = Σ Punkte / 96 · 100, gerundet. Lücken-Texte je Frage im Prototyp (Objekt `KS[].luecke`: Titel, Satz, Linktext).

### Beleg (rechte Spalte)
- `width 252px` (Spalte), weißer Zettel `padding 16px 16px 26px`, **Zickzack-Unterkante** (clip-path-Polygon mit 8-px-Zähnen alle 3 %), Schatten `drop-shadow(0 14px 16px rgba(51,74,39,.18))`, `tabular-nums`. Einblenden `fl-herz` .25 s nach der Sektion.
- Kopf zentriert: „KASSENSTURZ“ `700 11px Merriweather .22em`, „finanzleser.de · Beleg № 0917“ `400 10.5px #686C6A`; gestrichelte Trennlinie `rgba(51,74,39,.35)`.
- 8 Zeilen `grid 18px minmax(0,1fr) auto; gap 6px; padding 5px 0; font 400 11.5px Open Sans`: Nr `700 10px #9a9e9b` · Thema + Punktführung · Wert (`600`) · Punkte `700 11px` (`#2E7A0B` bei 12, `#D3005E` bei 0, sonst `#686C6A`, `min-width 22px`, rechts) · **Haken** 10×9 px grün (gezeichnet `fl-haken .45s`) bei voller Punktzahl. Ungebucht: Text `#9a9e9b`, Wert „—“. Beim Buchen druckt sich die Zeile `fl-druck .5s`, der ganze Zettel wackelt `fl-bon .35s`.
- Summe: gestrichelte Linie, Zeile „ZWISCHENSUMME“ / „SUMME“ (`700 11px .1em uppercase`) rechts Zahl `900 17px Merriweather` + „/ 100“ `400 10.5px #686C6A` (einzeilig, `nowrap`); Zahl **rollt** (700 ms) und `scale(1.18)` beim Buchen. Doppellinie. Fuß `italic 300 10.5px #686C6A`: „Noch nichts gebucht · Fragen antippen“ → „n von 8 gebucht“ → „Vielen Dank. Beleg als PDF unten anfordern.“
- **Fertig:** Stempel „GEPRÜFT“ (`900 13px Merriweather .14em; 2.5px #45A117; rotate(-11deg); background rgba(255,255,255,.7)`) oben rechts im Belegkopf (`right 12px; top 6px`), `fl-stempel .7s` ab .6 s; dazu vier **Funken** (Spark-Pfad, 9–14 px, grün) um den Stempel, `fl-funke .9s`, Delays .95/1.07/1.15/1.23 s.

### Ergebnis (Phase `fertig`)
- Grid `170px minmax(0,1fr); gap 18px` (mobil 1 Spalte): **Tacho** (SVG 220×120, Bogen r 90, Strichstärke 14, Hintergrund `rgba(51,74,39,.1)`, Wertbogen in Ampelfarbe, `stroke-dasharray "x 566"` mit x = score/100·283 – Lücke ≥ Umfang, sonst zweiter Bogen unten; Nadel 2×60 px `rotate(-90° + score·1,8°)`, `1.4s cubic-bezier(.34,1.3,.64,1)`), Zahl `900 28px` rollt hoch, „VON 100“.
- Rechts: Kicker „Ihr Ergebnis“, H3 (≥ 75 „Solide aufgestellt.“ / ≥ 45 „Gute Basis – mit Lücken.“ / sonst „Da fehlt Grundlegendes.“), Vorspann `400 14px/1.6`, **Ampel**: drei 13-px-Punkte rot/gelb/grün, aktive volle Deckkraft mit Ring `0 0 0 3px Papier, 0 0 0 4px Farbe`, inaktive `opacity .18`; Text „Grün · gut aufgestellt“ etc.
- **Ihre drei größten Lücken:** Kicker mit 1-px-Unterlinie; drei Zeilen `grid 26px 1fr auto; padding 12px 0; border-bottom 12 %`: Nr `900 13px Merriweather` in Farbe (0 Punkte magenta, sonst amber, 12 grün), Titel `700 15px`, Satz `400 12.5px/1.5 #686C6A`, rechts Linktext `600 12.5px #2E7A0B` + 16-px-Strich (mobil nur Strich). Sortierung: niedrigste Punkte zuerst. Einblenden `fl-herz`, Delay `.25 + n·.12 s`; Hover `padding-left 6px`.
- Unten: **FL Adresszeile** (Label „Ergebnis als PDF an“, Knopf „Schicken“, Farbe `#45A117`, Hinweis „Nur der Beleg als PDF, kein Newsletter.“) + „Noch einmal“ (setzt alles zurück).

## Baustein 4 · Leos Wochenbrief (auf der Animation)
- Fenster: `aspect-ratio 1456/880` (mobil `3/4.6`), `min-height 380px`, `border-top/bottom 1px Tinte`, Hintergrund = **laufende Papierflieger-Animation** (`background-size cover`). Hier Standbild `public/assets/wochenbrief-himmel.png`.
- **Titel** zentriert oben (`top clamp(18px,4vw,30px); width min(70%,24ch)` mobil `min(86%,16ch)`): `900 clamp(20px,4.2vw,30px)/1.15 Merriweather; #334A27; text-align center; text-shadow 0 0 14px rgba(255,255,255,.7), 0 1px 0 rgba(255,255,255,.5)`: „Mit Leos Wochenbrief bleiben Sie immer auf dem neuesten Stand.“
- **Glasplatte** zentriert unten (`bottom clamp(16px,4vw,26px); width min(100%,430px); padding 12px 16px 8px; background rgba(250,249,246,.86); backdrop-filter blur(10px); border 1px rgba(255,255,255,.75); box-shadow 0 18px 40px -22px rgba(51,74,39,.55)`): darin **FL Adresszeile** (Label „Ihre E-Mail · donnerstags“, Knopf „Eintragen“, Farbe `#2E7A0B`) und Datenschutzzeile `400 11px/1.45 #334A27`, zentriert, Link unterstrichen.
- Nach Eintragen: Stempel „EINGETRAGEN“ oben rechts (`2.5px #2E7A0B`, `fl-stempel`), Kicker-Status wechselt zu „Erste Ausgabe: Donnerstag“ (im Prototyp nur der Stempel).
- Kein Verlauf, keine Papierfläche, keine Inhaltsliste („Diese Woche im Brief“ bleibt im eigenen Abschnitt). Den Flieger in der Animation zwischen Titel und Glasplatte durch die Mitte fliegen lassen; die Fläche darf höher sein.

## Baustein 5 · Finanzleser Plus (Abo-Coupon)
- Block `border 1px dashed rgba(51,74,39,.5); padding 26px clamp(18px,4vw,30px)`. **Schere** (SVG 18 px, Tinte, um 90° gedreht) auf der oberen Schnittlinie (`top -10px`, 20×20 Papiergrund); auf Hover des Coupons wandert sie von `left 22px` nach `calc(100% − 44px)` (`1.6s cubic-bezier(.2,.8,.2,1)`), zurück beim Verlassen.
- Kopf: Kicker grün „Finanzleser Plus“ / rechts kursiv „Werbefrei lesen“. Grid `minmax(0,1fr) 168px`: H3 `900 clamp(26px,4.6vw,34px)/1.12` „Leo merkt sich Ihre Zahlen. Der Faden reißt nie ab.“ + Lead kursiv; rechts **Preis-Stempel** (`1.5px #2E7A0B; rotate(-4deg); padding 12px 16px 11px; background rgba(255,255,255,.5)`): „30 Tage“ `900 24px`, „KOSTENLOS“ `700 10px .16em`, Trennlinie 35 %, „dann 4,90 € im Monat“ `italic 300 11px #334A27`; `fl-stempel` .5 s nach Reveal.
- **Leistungsverzeichnis** (`border-top 1px Tinte`): drei Zeilen `grid 52px minmax(0,1fr) auto; gap 14px; padding 14px 0; border-bottom 14 %`, Hover `padding-left 6px`. Glyphen (CSS, 40×30):
  - Aktenkoffer: drei Kärtchen 12×17 weiß mit 1-px-Tinte-Rand + Boden 2 px; Ruhe `rotate(∓6deg) translateX(∓3px)`, Hover fächern `∓18deg / ∓8px`, Mitte `translateY(-3px)` (`.45s` Überschwung, Delays 0/.04/.08 s).
  - Wächter: Punkt 10 px grün + zwei Ringe `fl-ring` (2.6 s ∞, Hover 1.3 s, zweiter Ring .9 s versetzt).
  - PDF: Seite 16×22 weiß `1px #9a9e9b` + vier Zeilen 1 px, `scaleX .4/.6/.3` → Hover 1 (gestaffelt .05–.35 s). Ganze Zeile grau (`in Vorbereitung` kursiv, kein Strich).
  - Text: Titel `700 16px Merriweather`, Satz `400 13px/1.5 #686C6A`; rechts „ansehen“ `600 13px #2E7A0B` + Strich 18→34 px.
- Fuß: Pille „Kostenlos anmelden“ mit **Füll-Hover** (grüner Kreis 38 px wächst auf volle Breite, Text weiß) + kursiv „Jederzeit kündbar · Ihr Faden bleibt, auch ohne Plus.“

## Baustein · FL Adresszeile (neu, `FL Adresszeile.dc.html`)
Kompaktes Kontaktfeld für E-Mail (Default), Text (Name) oder Telefon. Props: `label`, `placeholder`, `knopf` (leer = kein Knopf), `hinweis`, `hinweisFertig`, `type` (`email|text|tel`), `farbe` (Default `#2E7A0B`), `onSenden(wert)`.
- Kopfzeile: Label-Kicker links (grau; im Fokus/fertig Werkzeugfarbe; Fehler magenta), Status rechts `italic 300 12px` („Name“ → „jetzt die Domain“ → „noch die Endung“ → „sieht gut aus“ grün → „Unterwegs …“ → „Eingetragen“).
- Zeile 44 px, `display:flex; flex-wrap:wrap; gap 10px 12px`: Feld `flex 1 1 200px` (bricht unter ~340 px um, Knopf rutscht darunter, `margin-left:auto`), Input `400 16px Open Sans` ohne Rahmen, Platzhalter `italic 300 15px Merriweather #9a9e9b`.
- Linien: Grundlinie 1 px 30 %; **Gültigkeitslinie** in Werkzeugfarbe wächst in vier Stufen (Text / @ / Domain / Endung = 25/50/75/100 %, `.5s`); im Fokus **Doppellinie** (2 px bei −1 px, 1 px bei −5 px) zeichnet sich von der Mitte (`scaleX .45s`, zweite .08 s später); Fehler: Linien magenta, ganzes Feld schüttelt (`fl-az-schuettel .45s`, translateX ±5 px), Hinweis „Bitte eine vollständige Adresse, z. B. name@adresse.de“.
- **Knoten** 9 px grün mit 2-px-Papierrand am rechten Linienende poppt bei gültiger Adresse (`fl-az-knoten .5s` Überschwung).
- Knopf: Pille 44 px (`1.5px` Rand, gültig Tinte sonst 35 %), Kreis 34 px (gültig Werkzeugfarbe, sonst 30 % Tinte) mit **Papierflieger** (weiß). Senden → Flieger fliegt `translate(64px,-70px) rotate(-28deg) scale(.5)` in .8 s heraus, Text „Unterwegs“, Knopf `scale(.96)`; nach 850 ms „Eingetragen“: Pille Tinte gefüllt, Kreis grün mit gezeichnetem Haken; Eingabetext hebt sich weg (`opacity 0; translateY(-14px)`) und wird durch „✓ adresse“ `italic 400 15.5px #2E7A0B` ersetzt (`fl-az-druck`).
- Enter sendet. Validierung E-Mail `^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$`; Text/Telefon: Länge.

## Interactions & Behavior (Zusammenfassung)
- Alle Sektionen blenden einmalig per IntersectionObserver ein (`fl-herz`); Zahlen der Finanztool-Zeile zählen hoch; Säulen wachsen gestaffelt; Ø-Linie und Labels folgen.
- Hover-Rahmen zeichnet sich in drei Schritten; Strich-Links verlängern sich.
- Kassensturz: Zustände `start → frage (0…7) → fertig`; `wechsel` (640 ms) blendet die Bühne aus; Schätzfrage `enthuellt` (2,3 s Auflösung, 2,7 s bis Weiter). „Zurück“ setzt `schritt−1`. „Noch einmal“ resettet.
- Antworten bleiben im Browser (localStorage im Produkt; im Prototyp nur State).
- Responsiv: Container-Breite < 560 px → `eng` (eine Spalte, Beleg unten, Banknamen im Marktüberblick aus, Lücken-Links nur Strich, Wochenbrief Hochformat).

## State Management
- `sicht` (Reveal je Sektion), `zahlP` (Zähler 0→1), `hovTool/hovVgl/hovMu/hovPlus`, `plusHov`, `schere`.
- `ks`: `{phase, schritt, antworten[], wechsel, gewaehlt, schaetz, enthuellt}`; `bonAnzeige` (rollende Summe), `bonLauf` (Animations-Neustart), `tacho`, `flug` (Punkte-Flug-Koordinaten), `nlFertig`.
- Daten: Tarifliste je Vergleich (financeads), Angebotsliste (Zins, Bank, Rate) für den Marktüberblick, Fragenkatalog mit Punkten/Lücken.

## Assets
- `public/icons/*.svg` – Themen-Icons (Antwortkarten), Spark (`nav-spark.svg` / Pfad inline), Leo (`public/assets/leo.svg`).
- `public/assets/wochenbrief-himmel.png` – Standbild der Kundenanimation (nur Referenz; im Produkt die echte Animation).
- Fonts: Google Fonts Merriweather (variable) + Open Sans.

## Files
- `Finanzleser Heute - Teaser.dc.html` – alle fünf Bausteine + Marktüberblick, Logik und Beispieldaten.
- `FL Adresszeile.dc.html` – Kontaktfeld (Baustein, Props oben).
- `FL Lineal.dc.html` – Lineal-Eingabe (Schätzfrage); Spezifikation im Kursblatt-Handoff (`design_handoff_finanzleser_kursblatt/README.md`).
- `support.js` – Prototyp-Laufzeit, nicht portieren.
