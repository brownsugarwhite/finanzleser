# Änderungen Runde 2 – Kursblatt (Vergleiche & Rechner)

Ergänzung zur README.md. Diese Datei beschreibt, was sich gegenüber dem ersten Handoff geändert hat, und wie die Eingabe-Bausteine in den 56 Rechnern und den financeads-Vergleichen kombiniert werden. Referenz: die aktualisierten HTML-Dateien in diesem Ordner (Stand Runde 2), Screenshots im Ordner `screenshots/` sind teils noch aus Runde 1.

---

## 1 · Siegel statt Stempel (`FL Siegel.dc.html` → `<Siegel>`)

Ersetzt den gedrehten Rahmen „Bestwert“ überall.

- **Form**: Briefmarke – Rechteck mit gezahntem Rand. Umsetzung als SVG: `<mask>` = weißes Rechteck minus Kreise (r = 0,3 × Zahn) im Abstand `zahn` (7 px) entlang aller vier Kanten. Breite/Höhe müssen Vielfache des Zahns sein (98×35, 70×21, 126×35, 112×21).
- **Füllung**: Holo-Verlauf 135° `#06D496 → #CDF8EA (48 %) → #2FC39C`; Innenrahmen `rect` mit 0,55 × Zahn Einzug, `stroke rgba(51,74,39,.45) .8px`. Schatten `drop-shadow(0 1px 0 rgba(51,74,39,.28))`.
- **Text**: HTML-Overlay `700 11px (Gewinner) / 8.5px (Liste) Open Sans; letter-spacing .13em; uppercase; #334A27`.
- **Schimmer**: zweites `rect` (Breite 0,42 × w, Höhe h+8) mit Weiß-Verlauf (0 → .95 → 0), `transform-box: fill-box`, `skewX(-22deg)`, Keyframes `translateX(-160%) → translateX(300%)`, 1,5 s `cubic-bezier(.45,0,.2,1)`. **Auslöser**: `scroll`-Listener (passive) – wenn das Siegel im Viewport ist und der letzte Lauf > 1,8 s zurückliegt, Animation neu starten (Namen `fl-schimmer`/`fl-schimmer2` alternieren). Zusätzlich ein Lauf 700 ms nach Mount. Mit IntersectionObserver statt getBoundingClientRect umsetzen.
- **Platzierung**: Gewinnerblock oben rechts `right:16px; top:-18px`, im Wrapper mit der bestehenden `fl-stempel`-Animation (endet auf rotate(-11deg)); Siegel selbst `rot 0`. In der **Liste** `left:-6px; top:-19px` relativ zum Logo-Rahmen, `rotate(-8deg)` – es sitzt oberhalb des Logos und kostet keine Spaltenbreite. Festgeld: Text „Höchster Ertrag“ (126×35 / 112×21).

## 2 · Eingabe-Bausteine vereinheitlicht

Alle fünf Bausteine teilen jetzt eine Anatomie – das ist die wichtigste Änderung für die 56 Rechner:

```
[Kicker-Label 700 10.5px uppercase grau]           [rechts: Bereich/Hinweis italic 300 12px grau]
[Wertzeile 40 px hoch · Wert 700 26px Merriweather Tinte · Einheit italic 300 15px grau]
[Linie 1 px 35 % Tinte · im Fokus/Drag Doppellinie in Werkzeugfarbe (2 px + 1 px, von der Mitte)]
[Hinweiszeile 16 px · italic 12px]
```

- **Kein Wert größer als 26 px, kein Label als Serif-15px mehr.** Werkzeugfarbe (Türkis Vergleich / Magenta Rechner) nur für Nadel, Bogen, Linie und Kicker im aktiven Zustand – die Zahl bleibt Tinte `#334A27`.
- **Lineal**: Wert steht jetzt **über** der Skala (zentriert, Input mit gestrichelter Unterlinie), die Nadel (2×22 px + Dreieck) zeigt von der Skala nach oben auf den Wert. **Die Skalenzahlen sind die Marken** – Buttons, Klick springt; die Zahl direkt unter der Nadel blendet aus. Keine separaten Pins mehr. Major-Ticks liegen auf **runden Werten** (`v % (major·step) === 0`, nicht Index-basiert) – bei min 500 also 10.000, 20.000, nicht 10.500. Marken-Abstand ≥ 3–4 sichtbare Marken bei 320 px Breite: Vergleich Summe 1.000–100.000 € → Schritt 500, 8 px/Schritt, Marke alle 5.000 €; Laufzeit 12–120 → Schritt 6, 30 px, Marke alle 12; Rechner 500–200.000 € → 7 px, Marke alle 10.000. Hinweis „ziehen · Marke antippen · tippen“ steht rechts im Kopf und wird nach der ersten Interaktion durch den Bereich („1.000 – 100.000 €“) ersetzt. Höhe gesamt ≈ 126 px. Zwei Lineale stehen im Vergleich nebeneinander (Grid `minmax(0,1fr) ×2`, mobil untereinander).
- **Setzzeile**: `20.500 €` – Einheit direkt hinter der Zahl, Input-Breite `(Zeichen + .6)ch`; ‹ › als Paar rechts (32×32, Opacity .45, im Fokus 1). Grüner Knoten entfernt; **Bestätigung** = grüne 2-px-Linie zeichnet sich von der Mitte und verblasst (`fl-setz .9s`: scaleX 0→1 bis 45 %, dann Opacity → 0). Linie liegt direkt unter der 40-px-Wertzeile.
- **Register**: Trigger 40 px, Wert 26 px, Meta 12 px; Rest unverändert.
- **Drehring / Zählwerk**: Mittelwert bzw. Ziffernsäulen `700 26px`; Label als Kicker mit rechtsstehendem Hinweis („am Ring drehen“, „Sollzins · 0 – 19,9 %“). „Leo rechnet mit“ ebenfalls 26 px.
- **Segment (Verwendung)**: Kicker-Label darüber, Höhe 40 px.

### Kombination in den Rechnern (Empfehlung)

| Eingabe | Baustein | Beispiele |
|---|---|---|
| Geldbetrag mit „Gefühl“ (Spanne wichtig) | **Lineal** | Kreditsumme, Anlagebetrag, Kaufpreis, Eigenkapital |
| Geldbetrag exakt bekannt | **Setzzeile** | Bruttogehalt, Miete, Nebenkosten, Kilometer, km-Stand |
| Laufzeit / Dauer | **Lineal** (bis 120 Monate, mit Jahresmarken) oder **Drehring** (kurze Skalen 6–120 in festen Schritten, Alter 18–67, Stunden/Woche) |
| Prozentwert mit Nachkomma | **Zählwerk** (−/+ mit Halten, Schnellwahl-Chips für Marktwerte aus `useRates`) | Sollzins, Tilgung, Rendite, Inflation, Steuersatz |
| Auswahl 3–20 Einträge | **Register** (Meta je Eintrag live: „bis 3,45 %“, „4 Angebote“, „KiSt 8 %“) | Steuerklasse, Bundesland, Anlagedauer, Zahlweise, Kirchensteuer, Krankenkasse |
| 2–4 Optionen | **Segment** (gleitender Tinte-Block) | Verwendung, Neu/Gebraucht, monatlich/jährlich, Ja/Nein |
| Ganzzahl klein (0–10) | **Setzzeile mit `stepper` und `vorschlaegeImmer`** | Kinderfreibeträge, Personen im Haushalt |
| Datum | **Setzzeile** (Format TT.MM.JJJJ) oder **Register** Monat + Setzzeile Jahr | Vertragsbeginn, Geburtsjahr |

Regeln:
1. **Ein Rechner = maximal ein Lineal pro Zeile** (zwei nebeneinander ab 560 px Containerbreite). Drehring und Zählwerk teilen sich eine Zeile.
2. Reihenfolge wie bisher: Presets (Stempel) → Beträge → Zeit → Prozente → Auswahl → „Leo rechnet mit“ + Ausrechnen.
3. Presets setzen mehrere Bausteine gleichzeitig (Objekt `{rs, rm, rz}`) und stempeln sich flach (`fl-stempelflach`).
4. Jede Änderung nach „Ausrechnen“ setzt `veraltet` → Ergebnis auf Opacity .45, Knopf „Neu ausrechnen“.
5. Vergleich: **kein Ausrechnen-Knopf**, alles live (Lineale, Segment, Register). Rechner: Live-Vorschau nur in „Leo rechnet mit“, volles Ergebnis nach Knopf.
6. Validierung nur in der Setzzeile (min/max, Magenta-Hinweis). Lineal, Drehring, Zählwerk klemmen automatisch.
7. Alle Bausteine: `onChange(number|any)`, `wert` kontrolliert von außen; kein interner State außer Drag/Edit/Fokus.

## 3 · Marktüberblick (Zinsband) – Überschneidungen behoben

- Kicker trägt Kontext: „Marktüberblick · 20.000 € über 60 Monate“; H3 kurz: „Wie weit liegen die 12 Angebote auseinander?“; ein Erklärsatz.
- **Legendenzeile über dem Band** (feste Position, nicht wertabhängig): links „● Bestwert 0,68 % · Verivox“ (`700 13px #0B7F66`, `fl-druck`), rechts „– – Durchschnitt 2,74 %“ (`500 12px grau`).
- Band-Höhe fix `22 + 5·12 + 8 = 90 px`. Grundlinie bei `bottom:22px`; darunter links „günstig“, mittig Kicker „Effektiver Jahreszins“, rechts „teuer“.
- **Stapel-Logik**: Angebote nach Position in Klassen von 2,6 % Bandbreite binnen (`Math.round(pos/2.6)`), Punkte pro Klasse von der Grundlinie nach oben (`bottom = 22 + j·12`), **maximal 5 sichtbar**, darüber Label „+n“ (`600 10.5px grau`) über dem Stapel. Bestwert-Punkt immer sichtbar (er ist der erste seiner Klasse).
- Stiele: Bestwert 1 px türkis durchgezogen, Ø 1 px grau gestrichelt, beide von Grundlinie bis Oberkante Band (`fl-spalte`), Position `transition left .7s`.
- Tooltip hängt oben am Band (`top:-4px`), nicht mehr unter der Achse.

## 4 · Kennzahlen-Block („Ihre Zahlen“ / Ertrag)

Neu als **dreispaltige Zeitungstabelle**: Doppellinie oben (2 px + 1 px), Grid `repeat(3, minmax(0,1fr))`, Spalten durch `border-left 1px rgba(51,74,39,.2)` getrennt, Innenabstand `14px 18px`, Abschluss `1px solid #334A27`. Jede Zelle identisch: Kicker (`700 10.5px uppercase`) → Zahl `900 28px Merriweather` (alle gleich groß, Farbe unterscheidet: Türkis Bestwert, Grau Ø, Grün Ersparnis/Real, Magenta wenn Real negativ) → Unterzeile `italic 300 12px/1.4`. Mobil `1fr 1fr`, dritte Zelle über volle Breite mit `border-top`.
- Autokredit: „Beste Rate · 340 € · im Monat, Verivox“ | „Ø Rate · 372 € · im Monat, alle 12 Angebote“ | „Ihre Ersparnis · 1.920 € · Bestwert statt Ø über 60 Monate“.
- Festgeld: „Zinsertrag Bestwert · + 2.142 € · nach 3 Jahren, vor Steuern“ | „Ø aller Angebote · + 2.001 € · Bestwert bringt 142 € mehr“ | „Real nach Inflation · + 856 € · bei 2,1 % p.a. – echter Kaufkraftgewinn“.

## 5 · Tabellen: alter Kopf + neue Zeilen

Kombination aus Live-Seite und Kursblatt, gilt für **Vergleichsliste** und **Jahresübersicht** im Rechner:
1. Doppellinie oben (2 px Tinte + 1 px, Abstand 2 px; Jahresübersicht in Grau `#686C6A`), 4 px Luft,
2. **Kopfband** `background:#686C6A; color:#fff; padding:10px 10px` (Jahresübersicht `9px 12px`), Kicker-Typo `700 10.5px uppercase .14em`, gleiche Grid-Spalten wie die Zeilen,
3. Zeilen mit Innenabstand `16px 10px` (Jahresübersicht `11px 12px`) und **Zebra**: jede zweite Zeile `rgba(51,74,39,.035)`; Hover `rgba(51,74,39,.07)` + Rahmenlinien-Animation wie bisher; Bestwert-Zeile `rgba(6,212,150,.08)`; letzte Zeile der Jahresübersicht mit `2px solid #D3005E` oben.
Details/Merken-Zeile und Detail-Grid bekommen denselben 10-px-Seitenabstand (Einzug 126 px Desktop / 10 px mobil).

## 6 · Rechner-Ergebnis: Ring und Säulen im alten Stil

Direkt nach der ERGEBNIS-Punktlinie (+ 1-px-Linie mit 11-px-Kerbe nach unten, wie früher), vor den Kacheln:
- **Ring** 150 px: Spur `#E1E0D8` 12 px, Fortschritt Magenta 12 px (`stroke-dasharray = 2π·67`, `dashoffset` animiert 1,3 s, Delay .35 s), innen dünner Tinte-Kreis r 55 (1,5 px). Mitte: Prozent `700 32px Open Sans` Tinte + Unterzeile `13px grau` („Zinsanteil“; im Brutto-Netto „Nettoquote“).
- **Säulen** (rechts, Titel `700 20px Merriweather` „Ihre Rate im Marktvergleich“ / „Dein Deutschlandvergleich“): pro Zeile Grid `minmax(0,1fr) 84px`; Balken 36 px hoch, **Vollfarbe** (Magenta = Ihr Wert, Türkis = bestes Angebot, Tinte = Ø), Grundlinie 1 px in Balkenfarbe unter dem Balken, Label `500 13px` **weiß im Balken** wenn Breite > 55 %, sonst in Tinte rechts neben dem Balkenende; Wert `700 18px Merriweather` in Balkenfarbe rechtsbündig in der festen 84-px-Spalte (kein Überlappen mehr). Breite animiert 1,1 s aus 0.
- Der Block „So verteilt sich Ihre Zahlung“ ist entfallen (Ring ersetzt ihn).
- Kacheln folgen darunter unverändert (Monatsrate im Doppelrahmen, zwei graue Kacheln).

## 7 · Pille „Zum Anbieter“

Hover: Füll-Element wächst von Knopf (`inset 3px; width 38/32px`) auf **die gesamte Innenfläche** (`inset 0; width 100%`, `transition all .45s`), Text weiß. Kein sichtbarer Papierrand mehr zwischen Rahmen und Füllung.

## 8 · Abstände

Vergleich: Marktüberblick `margin-top 40`, Beste `44`, Liste `48` (vorher 46/54/60). Rechner: Eingaben `28/20`, Ergebnis-Bausteine `32`.

---

## Dateien in diesem Ordner (Stand Runde 2)
- `Finanzleser Vergleich & Rechner - Kursblatt.dc.html` – Autokredit + Kreditrechner (maßgeblich)
- `Finanzleser Festgeld & Eingaben - Kursblatt.dc.html` – Festgeld (Zinskurve, Kennzahlen) + Setzkasten
- `FL Lineal.dc.html`, `FL Setzzeile.dc.html`, `FL Register.dc.html`, `FL Siegel.dc.html` – Bausteine
- `README.md` – Runde 1 (Tokens, Grundaufbau); wo diese Datei abweicht, gilt diese Datei.
