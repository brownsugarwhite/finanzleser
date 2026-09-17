# Handoff: Finanzleser Solitär (Murmelbrett) – Rätselseite

## Overview
Neues Spiel für die **Rätselseite** des Fadens (Kapitel 7, neben Finanzwort, Schätzfrage, Quiz, Snake, Stempelkarte): klassisches Brett-Solitär (Peg Solitaire) im Zeitungsstil von finanzleser.de. Ziel: ruhig, elegant, belohnend – Murmeln als Glas-Katzenaugen, kleine Mikroanimationen bei jedem Zug, Stempel am Ende, Punkte für die Stempelkarte.

Repo-Kontext: `brownsugarwhite/finanzleser` (Next.js/React). Betroffen: `components/faden/*` (Rätselseite: neues `Solitaer.tsx` neben Finanzwort/Snake), `app/faden.css` (Keyframes), Stempelkarten-Logik (Punkte). Tokens aus `app/tokens.css`.

## About the Design Files
Die Datei `Finanzleser Solitär - Rätselseite.dc.html` ist eine **Design-Referenz in HTML** (Design Component: Template mit Inline-Styles + Logikklasse) – sie zeigt Look, Maße, Zustände, Spiellogik und Animationen. Sie ist **kein Produktionscode**. Aufgabe: das Design in der bestehenden Next.js/React-Codebase nachbauen, mit den vorhandenen Tokens, Fonts und Mustern der Rätselseite. `support.js` ist die Laufzeit des Prototyp-Werkzeugs und **nicht** zu portieren. Öffnen zum Ansehen: lokaler Server, dann die HTML-Datei im Browser.

## Fidelity
**High-fidelity.** Farben, Typografie, Abstände, Zustände, Spiellogik und Animationen sind final gemeint. Die Punktwerte (30/20/10/5) sind Vorschläge und an die Stempelkarte anzupassen. Datum im Kopf ist Beispieltext.

---

## Design Tokens (wie Faden/Heute)
| Token | Wert | Verwendung |
|---|---|---|
| Papier | `#faf9f6` | Grund, Stempel-Fond `rgba(250,249,246,.82)`, Ring um gewählte Murmel |
| Tinte | `#334A27` | Text, Linien, Glaskörper (Mitte), Stempel „Festgefahren“ |
| Tinte-Glas | `#4f6c3b` → `#334A27` → `#1d2b15` | radialer Verlauf der Murmel |
| Tinte 38/30/20/6 % | `rgba(51,74,39,.38/.3/.2/.06)` | Lochrand, Schalenring, Spaltentrenner, Lochgrund |
| Grau | `#686C6A` | Kicker, Kursivhinweise, Status |
| Grau hell | `#9a9e9b` | „Zug zurück“ inaktiv |
| Grün | `#45A117` | Puls-Punkt, Zielloch, Ring, Stempel „Perfekt/Gelöst“, Pillenkreis, Funken |
| Grün dunkel | `#2E7A0B` | Kicker Spiel, Rang-Kicker, Punkte, „Neu aufstellen“, Zähler ≤ 3 |
| Katzenauge | `rgba(69,161,23,.25)` → `#7fcc4a` → `#c4f09e` → `#7fcc4a` → … | Band in der Murmel (linear 90°) |
| Schale-Band | `transparent → #a9e07c → transparent` | Band der kleinen Murmeln |

Typografie: Merriweather (variable, 300–900, italic) für Überschriften, Zahlen, Kursivtext, Stempel; Open Sans (400–700) für Kicker, Buttons, Status.
- Kopf-Kicker: `700 10.5px/1.3 Open Sans; .14em; uppercase; #686C6A`; Spiel-Kicker gleich, `#2E7A0B`, mit 8-px-Punkt `#45A117` (`fl-puls 2.4s ∞`).
- H3: `900 clamp(26px,4.6vw,34px)/1.12 Merriweather; -.02em`. Lead: `italic 300 clamp(15px,2.3vw,16.5px)/1.55; #686C6A; max-width 52ch`.
- Status rechts: `italic 300 13px Merriweather #686C6A`, wechselt mit `fl-druck .5s` (Keyframe-Name alterniert `fl-druck`/`fl-druck2` für Neustart).
- Kennzahlen: `900 clamp(28px,4.4vw,34px)/1 Merriweather; tabular-nums`; Sub `italic 300 12.5px/1.4 #686C6A`.
- Stempel: `900 clamp(18px,3.4vw,24px) Merriweather; .16em; uppercase; border 3px`.
- Fußnoten: `italic 300 12px/1.5 Merriweather #686C6A`.

Bewegung: Standardkurve `cubic-bezier(.2,.8,.2,1)`, Überschwung `cubic-bezier(.34,1.56,.64,1)`. Tweak `tempo` (ruhig 1.35× / normal 1 / lebhaft .65×) skaliert Dauern/Delays (Faktor T).

---

## Layout (Sektion „Solitär“)
Seitenbreite 728 px (Faden), Kopfzeile „Ihr Faden · Rätselseite“ / Datum + Doppellinie (2 px, 2 px Abstand, 1 px) wie überall. Sektion `margin-top 40px; border-top 2px #334A27; padding-top 14px`, Einblenden `fl-herz .8s`.

1. Kopfzeile: Spiel-Kicker „● Solitär · Das Brett · ohne Zeitdruck“ links, Status rechts (`flex; space-between; wrap`).
2. H3 „Eine Murmel soll bleiben.“ (`margin-top 14px`), Lead (`margin-top 8px`): „Springen Sie über eine Nachbarin in ein leeres Loch – die übersprungene verlässt das Brett. Am Ende bleibt im besten Fall eine einzige, genau in der Mitte.“
3. Grid `margin-top 26px; grid-template-columns: minmax(0,1fr) 210px; gap 34px; align-items start`. **Eng** (< 560 px Containerbreite): `1fr; gap 26px`, Seitenspalte unter dem Brett.
4. Unter dem Grid: 1-px-Linie 30 % (`margin-top 30px`), Fußnote: „Das englische Brett hat 33 Löcher und 32 Murmeln. Eine einzige in der Mitte zu lassen, gilt seit dem 17. Jahrhundert als die schönste Lösung.“

### Brett (linke Spalte)
- Container `position relative; width min(100%,420px); aspect-ratio 1; margin 0 auto; user-select none`. Alles darin ist **prozentual** positioniert (7×7-Raster, Zelle = 14,28 %): kein JS für Maße nötig.
- **Löcher** (Buttons, je gültige Zelle): `left (c+.5)/7·100 %; top (r+.5)/7·100 %; width 14.28 %; aspect-ratio 1; margin −7.14 %` (Zentrierung), transparenter Grund, darin Ring `width 30 %; border 1px rgba(51,74,39,.38); background rgba(51,74,39,.06)`; leer: `inset 0 1px 2px rgba(51,74,39,.25)`, belegt ohne Schatten. `aria-label "Loch r/c"`.
  - **Zielloch** (bei gewählter Murmel, wenn Tweak `ziele` an): Ring `#45A117` gefüllt, `scale 1.15` (Überschwung .35 s), darüber zweiter Ring `1.5px #45A117` mit `fl-ring 1.4s ease-out ∞` (scale .6→2.4, opacity .8→0). Cursor pointer; ebenso bei leerem Loch, das genau eine Murmel erreichen kann.
- **Murmel** (div, je Murmel persistent per `id` – damit `left/top` per Transition animieren): `width 10.4 %; aspect-ratio 1; margin −5.2 %; border-radius 50 %; background radial-gradient(circle at 50% 58%, #4f6c3b 0, #334A27 52%, #1d2b15 100%)`; Ruhe-Schatten `0 3px 5px -2px rgba(51,74,39,.55), inset 0 -2px 4px rgba(0,0,0,.3)`. `transition: left .42s, top .42s (Standardkurve), transform .32s (Überschwung), box-shadow .32s, opacity .38s`. z-index 3 (gewählt/springend 5).
  - **Katzenauge**: Wrapper `inset 0; overflow hidden; rotate(rot)` mit `rot = ((id·47) mod 140) − 70°` (jede Murmel anders); innen Spin-Wrapper (`fl-spin` nur wenn gewählt: 5 s linear ∞, letzte Murmel bei Spielende: 3 s) mit Band `left 13%; top 39%; width 74%; height 22%; border-radius 50%; linear-gradient(90deg, rgba(69,161,23,.25), #7fcc4a 35%, #c4f09e 50%, #7fcc4a 65%, rgba(69,161,23,.25)); filter blur(.5px)`.
  - **Glanz** (oberste Ebene, pointer-events none): `radial-gradient(circle at 33% 28%, rgba(255,255,255,.95) 0, rgba(255,255,255,.4) 13%, transparent 32%), radial-gradient(circle at 70% 82%, rgba(255,255,255,.18) 0, transparent 28%)`.
  - Zustände: **Hover** (nur wenn Murmel ziehen kann): `translateY(-4%)`, Schatten `0 8px 10px -4px rgba(51,74,39,.5)`. **Gewählt**: `translateY(-9%) scale(1.1)`, Schatten `0 16px 16px -7px rgba(51,74,39,.55)` + Ring `0 0 0 2px #faf9f6, 0 0 0 3.5px #45A117`, Band dreht. **Fällt** (übersprungen): `translateY(30%) scale(.15); opacity 0` (Transition), nach 380 ms·T aus dem Brett (`weg`, opacity 0, pointer-events none – Element bleibt für „Zug zurück“). **Letzte Murmel** bei Spielende: `scale(1.12)`, Band dreht 3 s.
  - Cursor pointer nur, wenn die Murmel einen legalen Zug hat.
- **Stempel** mittig über dem Brett (z-index 8, `translate(-50%,-50%)`): Text „Perfekt“ (1 Murmel in der Mitte) / „Gelöst“ (1 Murmel) / „Festgefahren“ (sonst); Farbe grün bzw. Tinte; Fond Papier 82 %; `fl-stempel .7s` mit .5 s·T Delay. Bei „Perfekt/Gelöst“ vier **Funken** (Spark-Pfad, 10–14 px, grün) an den Ecken des Stempels: Positionen `(-14,-18) (rechts−2,-12) (-8,unten−4) (rechts−6,unten−6)`, `fl-funke .9s`, Delays `.95 + i·.1 s`·T.
- Hinweis unter dem Brett (zentriert, Fußnotenstil): „Murmel antippen, dann das Ziel. Ein leeres Loch antippen springt sofort, wenn nur eine Murmel es erreichen kann.“

### Seitenspalte (210 px; mobil volle Breite), `flex column; gap 22px`
1. **Kennzahlen**: Doppellinie oben (`border-top 2px; box-shadow 0 3px 0 -2px`) und unten (2 px + 1 px), zwei Spalten mit Trenner `1px rgba(51,74,39,.2)`, `padding 14px`.
   - „Auf dem Brett“: Zahl **rollt** (rAF, ease-out-cubic, 600–1300 ms·T) – Farbe `#2E7A0B` wenn ≤ 3 oder gelöst; `fl-tick .4s` (scale 1→1.18) bei jedem Zug (Name alterniert). Sub „Ziel: eine“.
   - „Züge“: Zahl, Sub „noch keiner“ / „ein Sprung“ / „Sprünge“.
2. **„Aus dem Spiel“** (Schale): Kicker mit 1-px-Unterlinie 30 %; Raster `repeat(8,1fr); gap 8px 6px; margin-top 12px`, ein Slot pro Murmel (32 bzw. 36): Ring 13 px `1px rgba(51,74,39,.3)`, Grund 4 %. Gefüllt: kleine Glasmurmel (`inset −1px`, gleicher Verlauf + Glanz, Band `linear-gradient(90deg, transparent, #a9e07c, transparent)` in der Rotation der Original-Murmel), poppt mit `fl-knoten .5s` (scale 0→1.5→1). Reihenfolge = Reihenfolge des Entfernens.
3. **Ergebnis** (nur bei Spielende, `fl-herz .6s` Delay .4 s): Rang-Kicker in Stempelfarbe, Satz `italic 400 15px/1.5 Merriweather`, Punkte `600 12.5px #2E7A0B` „+30 Punkte auf Ihrer Stempelkarte“.
   - 1 Murmel in der Mitte → „Experte · Perfekt“ / „Die eine Murmel, genau in der Mitte. Das schaffen die wenigsten.“ / +30
   - 1 Murmel → „Experte“ / „Eine Murmel übrig – nur nicht in der Mitte. Fast die schönste Lösung.“ / +20
   - 2 → „Kenner“ / „Zwei Murmeln übrig. Sehr gut – die letzte ist die schwerste.“ / +10
   - 3–4 → „Leser“ / „n Murmeln übrig. Beim nächsten Mal eine weniger?“ / +5
   - > 4 → „Festgefahren“ / „n Murmeln übrig und kein Zug mehr. Aufstellen und noch einmal.“ / keine Punkte
4. **Aktionen** (`border-top 1px dotted rgba(51,74,39,.35); padding-top 14px; flex wrap; gap 8px 22px`): „Zug zurück“ Strich-Link (14-px-Strich davor; inaktiv `#9a9e9b`, `disabled`) · „Neu aufstellen“ Strich-Link grün mit 18-px-Strich dahinter (Hover Tinte).
5. **Pille „Noch einmal“** nur bei Spielende (`fl-herz` Delay .9 s): Standard-Pille 48 px, grüner Kreis 38 px mit weißem Pfeil.

### Status (rechts im Kopf)
„Die Murmeln legen sich“ (Aufbau) → „Ihr Zug · n möglich“ → „Murmel gewählt · n Ziel(e)“ → „Gelöst“ / „Kein Zug mehr“.

---

## Spiellogik
- **Brett** (Tweak `brett`): *englisch* (Default) – gültig, wenn `2 ≤ r ≤ 4` oder `2 ≤ c ≤ 4` (33 Löcher); *europäisch* – zusätzlich die vier Diagonalfelder (1,1) (1,5) (5,1) (5,5) (37 Löcher). Start: alle Löcher belegt außer Mitte (3,3). Wechsel des Bretts → `neu()`.
- **Zug**: Murmel M bei (r,c) darf in Richtung d ∈ {↑↓←→} springen, wenn (r+d) belegt und (r+2d) gültig und leer ist. Die übersprungene Murmel verlässt das Brett.
- **Eingabe**: Klick auf Murmel → gewählt (wenn sie ziehen kann; sonst `fl-wackel .45s` ±8 %/±6°, Name alterniert). Nochmals → abwählen. Klick auf Zielloch → Zug. Klick auf anderes Loch → abwählen. Ohne Auswahl: Klick auf ein leeres Loch, das **genau eine** Murmel erreichen kann → Zug sofort. Während Aufbau und nach Spielende gesperrt.
- **Zugablauf** (`ziehen`): Snapshot in `hist` (Murmeln, Schale, Zugzahl) → Murmel bekommt neue Koordinaten (Transition .42 s) + `fl-hop .42s·T` (scale 1→1.32 + translateY −14 % + größerer Schatten in der Mitte, Name alterniert per Zähler) → übersprungene `faellt` → nach 380 ms·T: `weg`, in Schale eintragen, Zähler rollen, **Ende prüfen** (keine legalen Züge → `fertig {n, mitte}`).
- **Zug zurück**: letzten Snapshot wiederherstellen (Murmeln erscheinen wieder per Opacity-Transition), `fertig` löschen.
- **Neu aufstellen** / **Noch einmal**: Brett neu, `aufbau=true` für 1,7 s·T: Murmeln fallen mit `fl-fall .55s` (Überschwung) gestaffelt von der Mitte nach außen: Delay `(.08 + chebyshev(r,c)·.1 + ((r·7+c) mod 3)·.03)·T`. Zähler rollt 0→32 in 1,3 s·T.
- **Punkte**: Stempelkarte gutschreiben (siehe Ergebnis), einmal pro gelöstem Spiel.

## State
`murmeln[{id,r,c,weg,faellt,rot}]`, `sel` (id|−1), `hov`, `hist[]`, `zuege`, `aufbau`, `hop`/`hopN` (springende Murmel + Neustartzähler), `wackel`/`wackelN`, `raus[]` (ids in Schale), `fertig` (`null | {n, mitte}`), `uebrig` (rollender Zähler), `breite` (ResizeObserver → `eng` < 560). Persistenz im Produkt: laufendes Spiel + Bestleistung in localStorage/Nutzerkonto.

## Keyframes (in `faden.css`)
- `fl-fall`: 0 % opacity 0, translateY(−45 %) scale(1.15) → 65 % opacity 1, translateY(5 %) scale(.96) → 85 % translateY(−2 %) scale(1.01) → 100 % none.
- `fl-hop`/`fl-hop2`: 50 % translateY(−14 %) scale(1.32), box-shadow `0 22px 18px -8px rgba(51,74,39,.45)`.
- `fl-wackel`/`2`: 20 % translateX(−8 %) rotate(−6°), 45 % 7 %/5°, 70 % −4 %/−3°.
- `fl-ring`: scale .6→2.4, opacity .8→0. `fl-spin`: rotate 360°. `fl-knoten`: scale 0→1.5→1.
- Übernommen aus Heute/Faden: `fl-herz`, `fl-puls`, `fl-stempel`, `fl-funke`, `fl-druck`/`2`, `fl-tick`/`2`.

## Props / Tweaks
`brett` (`englisch|europäisch`), `ziele` (boolean, Ziellöcher markieren, Default true), `tempo` (`ruhig|normal|lebhaft`).

## Assets
Keine Bilder. Spark-Pfad (Funken) inline (identisch mit `nav-spark.svg`). Fonts: Google Fonts Merriweather (variable) + Open Sans.

## Files
- `Finanzleser Solitär - Rätselseite.dc.html` – vollständiges Design mit Logik.
- `support.js` – Prototyp-Laufzeit, nicht portieren.
