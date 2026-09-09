# Der Faden als Zeitung — Neuaufbau aus der Vorlage

Stand: 09.09.2026 · Branch `feature/faden-zeitung`

---

## Warum neu

Die ersten siebzehn Commits sind aus der **README-Beschreibung** entstanden, nicht aus
der Vorlage. Dadurch stecken überall Annäherungen und eigene Auslegungen drin — der
Satzspiegel war 300/750/300 statt 176/720/216, der Autorenring trug einen
Instagram-Farbverlauf, die Initiale war 700/3.6em statt 900/60px.

**Der Fehler war die Quelle, nicht die Sorgfalt.** `Finanzleser Faden A v2 - Zeitung.dc.html`
ist kein Bild, sondern **Quellcode**: 2053 Zeilen, jedes Element mit seinen Stilen inline.
Die Spezifikation liegt als Text vor. Sie muss gelesen werden, nicht vermessen.

### Methode ab jetzt

Für jeden Abschnitt, in dieser Reihenfolge:

1. Quelltext-Zeilen lesen (`sed -n 'A,Bp'` auf die `.dc.html`)
2. Inline-Stile in Klassen übersetzen — gleiche Werte, gleiche Verschachtelung
3. Markup der Komponente an die Struktur der Vorlage angleichen
4. Im Browser gegenprüfen: Sollwert aus dem Quelltext gegen Istwert aus `getComputedStyle`

Die Vorlage läuft unter `http://127.0.0.1:8099/…` (statischer Server auf
`docs/design_handoff_finanzleser_faden/`), die Umsetzung daneben auf dem Dev-Server.

### Was NICHT aus der Vorlage kommt

Die Vorlage ist ein Schaukasten mit erfundenen Daten und zeigt neun Kapitel auf einer
Seite. Das Produkt hat echte Daten und eine Route je Kapitel. Deshalb bleibt:

- Datenanbindung, Routing, ISR, SEO, Provider, Schnappschuss-System
- **Die Original-Werkzeuge** — Rechner, Checkliste, Vergleich, AnbieterLayout. Die
  Vorlage hat sie abgezeichnet; laut Übergabe gilt das Original.
- Der Landing-Hero mit dem Pillenflug (Wunsch vom 09.09.)
- Glossarbegriffe **ohne** Unterstrich im Fließtext (Wunsch vom 09.09.; die Vorlage
  unterstreicht sie mit `text-decoration-color: rgba(69,161,23,.4)`)

---

## A · Gestaltung neu aus dem Quelltext

Zeilennummern beziehen sich auf `Finanzleser Faden A v2 - Zeitung.dc.html`.

| # | Abschnitt | Quelle | Stand |
|---|---|---|---|
| A1 | Satzspiegel `176/720/216`, Gasse `clamp(28,4vw,64)` | 275–277 | ✅ |
| A2 | Verlauf (Randspalte links) | 278–314 | ✅ |
| A3 | Ratgeber: Kopf, Inhalt, Abschnitte, Initiale | 550–600 | ✅ |
| A4 | Kiosk (Kapitel 1) | 332–385 | ✅ |
| A5 | Kopf, Lesezeichen, Supernav | 51–86 | ⛔ **außen vor** — bleibt wie es ist (Wunsch 09.09.) |
| A6 | Megamenü „aufgeschlagene Ausgabe" | 87–232 | offen |
| A7 | Mobil-Menü | 234–273 | offen |
| A8 | Randspalte rechts: Glossar-Stapel, Aktenkoffer | 1433–1493 | offen |
| A9 | Kapitel 2: Frage, Leo-Antwort, Rechner-Umgebung | 386–549 | offen |
| A10 | Kapitel 3 Rest: Randglosse, Vergleichstabelle, Linienchart, Checkliste, FAQ, Fazit | 600–747 | teilweise |
| A11 | **Kapitel 4: Vergleich** — Filter, Sortierung, Bestwert-Stempel, Ladelinie, Leistungsquote-Ring, Anbieterkarte | 748–816 | **fehlt** |
| A12 | Kapitel 5: Kassensturz — Tacho, Lückenkarten, Level-Balken | 817–879 | teilweise |
| A13 | **Kapitel 6: Setzkasten** — die restlichen neun Formen | 880–1035 | **2 von 11** |
| A14 | Kapitel 7: Spielseite — Wordle, Schätzfrage, Quiz, Stempelkarte | 1036–1147 | Snake ✅, Rest offen |
| A15 | **Kapitel 8: Bausteine** — Zitat, Zeitmarke, Wächter-Demo, Koffer-Demo, Skelett, Offline, Teilen-Ausriss | 1148–1277 | **fehlt** |
| A16 | **Kapitel 9: Mein Bereich** — Wächter, Aktenkoffer, „Leo weiß nicht" | 1278–1329 | **fehlt** |
| A17 | Eingabe, Toast, Schubladen, Glossar-Faden | 1465–1515 | teilweise |

Rund **1.100 Zeilen Vorlage** sind noch zu übersetzen.

---

## B · Statistiken: die zwei fehlenden Formen

Beide brauchen **Daten UND Schema**, deshalb Backend zuerst.

### B1 · Kennzahlen-Vierer („Auf einen Blick")

Vorlage Zeile 890–893. Je Kennzahl:

```
label     Kicker, 700 10.5px gesperrt, grau
zahl      900 clamp(26px,2.6vw,34px) Merriweather, Zählwerk, tabular-nums
einheit   700 14px Merriweather, in der Farbe der Zahl
text      italic 300 12.5px Merriweather, grau
farbe     Tinte / Grün / Magenta / Türkis
```

Raster mit `border-top: 2px` Tinte und `border-bottom: 1px` Tinte, Zellen durch
`border-left` getrennt.

🚨 **Warum das nicht aus `FadenStatistik` geht:** Der Vierer mischt Einheiten in einem
Block (85 %, 62 €, 5,8, 1.240 €). Regel 7 des Statistik-Auftrags verlangt eine Einheit je
Diagramm. Es ist kein Diagramm, sondern ein Kasten aus vier unabhängigen Zahlen.

**Umsetzung:**

1. `lib/types.ts` — neuer Typ:
   ```ts
   export interface FadenKennzahl { label: string; zahl: number; einheit: string; text: string;
     farbe?: "ink" | "gruen" | "pink" | "tuerkis"; nachkomma?: number }
   export interface FadenKennzahlen { abschnitt: string; titel?: string;
     quelle: { name: string; url: string; stand: string }; werte: FadenKennzahl[] }
   ```
   in `FadenFelder` als `kennzahlen: FadenKennzahlen[]`
2. `wordpress/mu-plugins/finanzleser-faden.php` — `register_post_meta('post','kennzahlen')`
   als JSON-String, GraphQL-Feld `kennzahlen` (gleicher Weg wie `statistiken`)
3. `lib/faden/felder.ts` — Feld in `FADEN_GRAPHQL_FELDER`, parsen und auf
   `status: "freigegeben"` filtern
4. `lib/faden/kette.ts` — je Abschnitt zuordnen, wie `statistiken`
5. `tools/statistik-stapel.mjs` — Prüfer erweitern: 3–5 Werte, jede Zahl mit Primärquelle,
   `text` höchstens 60 Zeichen
6. `components/statistik/Kennzahlen.tsx` — Darstellung, Zählwerk über `data-zaehler`
   (nicht `data-zahl`, das ist von GSAP belegt)
7. **Recherche-Runde** über die 202 Beiträge — analog zu `docs/inhalte/statistik-batch-*.json`

### B2 · Zeitstrahl

Vorlage Zeile 934–943. Je Punkt: `tag` (700 13.5px Merriweather), `text` (400 12.5px
Open Sans), `x` (Position 0–100 %). Achse bei 70 px, Punkte 9 px mit 1,5-px-Rand,
Beschriftungen abwechselnd oben und unten, am rechten Rand nach links versetzt.

🚨 `StatistikWert` kennt nur `label` + Zahl — für ein Ereignis („Tag 12 · Prüfung durch
Partner") fehlt das Textfeld.

**Umsetzung:** wie B1, mit
```ts
export interface FadenZeitpunkt { tag: string; text: string; anteil: number }
export interface FadenZeitstrahl { abschnitt: string; titel: string;
  quelle: {...}; punkte: FadenZeitpunkt[] }
```

### B3 · Was ohne Backend geht

Anteilsleiste ✅ und Linienchart ✅ sind fertig (13 bzw. 29 Datensätze). Die übrigen
Setzkasten-Formen — Schrittfolge, Pro/Contra, Begriffsliste, Kennzahlenliste mit
Punktführung, Spannen, Vergleichstabelle — sind **Fließtext-Formen**: Sie entstehen aus
`ol`, `ul`, `dl` und `table` im CMS-Inhalt und brauchen nur Gestaltung, keine Daten.
Teilweise erledigt, Rest in A13.

---

## C · Glossar: die Randglosse

Vorlage Zeile 594–600. Die Randglosse klappt unter dem Absatz auf und zeigt:

| Feld | Vorlage | in `BegriffDaten` |
|---|---|---|
| Buchstabe | Kicker „Glossar · D" | ableitbar aus `titel` |
| Begriff | 700 20px/1.25 Merriweather | `titel` ✅ |
| Text | 400 14.5px/1.6 Open Sans | `erkl` ✅ |
| Quelle | italic 300 12.5px | `quelle` ✅ |
| **Verwandte Begriffe** | Liste mit wachsendem Strich | **fehlt** |

**Verwandte Begriffe** — drei Wege, aufsteigend nach Aufwand:

1. **Aus der Erklärung ableiten** (kein Backend): `verlinke()` findet Glossarbegriffe im
   Text von `erkl`. Die ersten drei sind die verwandten. Ehrlich, sofort verfügbar,
   redaktionell nicht steuerbar.
2. **Aus derselben Rubrik**: `BegriffZeile.rubrik` ist da; drei aus derselben Rubrik.
   Schwächer, weil beliebig.
3. **Eigenes Feld** `verwandte: string[]` am CPT `glossar` — redaktionell gepflegt,
   braucht Backend und eine Runde über 587 Begriffe.

**Vorschlag: Weg 1 jetzt, Weg 3 später** — Weg 1 liefert brauchbare Verweise, ohne dass
jemand 587 Begriffe von Hand verknüpft.

Zusätzlich fehlt die **Randglosse als Rückfall unter 1280 px** (Vorlage Zeile 1830:
unter dieser Breite gibt es keine rechte Randspalte, dann klappt die Erklärung unter dem
Absatz auf statt in den Zettelstapel zu wandern).

---

## D · Reihenfolge

1. **A5–A8** — Kopf, Megamenü, Mobil-Menü, rechte Randspalte *(immer im Bild)*
2. **A11** — Vergleich *(fehlt ganz, eigene Route)*
3. **A16** — Mein Bereich *(fehlt ganz, eigene Route)*
4. **A13** — Setzkasten-Formen *(betrifft jeden Beitrag)*
5. **C** — Randglosse + verwandte Begriffe
6. **A9, A10, A12, A14, A17** — Rest der Kapitel
7. **A15** — Bausteine *(Katalog, am wenigsten dringend)*
8. **B1, B2** — Kennzahlen und Zeitstrahl *(Backend + Recherche, eigener Block)*

---

## E · Gegenprobe

Je Abschnitt: Sollwerte aus dem Quelltext gegen `getComputedStyle` im Browser.

Vor jedem Commit:
```bash
npx tsc --noEmit && npx next lint
```

Vor dem PR gegen `dev`:
```bash
npm run verify:redirects -- --offline
npm run build
node -e "const r=require('./.next/prerender-manifest.json').routes; console.log([...new Set(Object.values(r).map(v=>v.initialRevalidateSeconds))])"
```
→ erwartet `[86400, false]`.

🚨 **Den Build nie starten, während der Dev-Server läuft** — er schreibt `.next` neu und
zieht dem Dev-Server die Module unter den Füßen weg (passiert am 09.09.).

Reduzierte Bewegung prüfen: `app/faden.css:29` schaltet jede Animation per `!important`
ab; jede Bewegung mit unsichtbarem Anfang braucht eine Rücknahme in `zeitung.css`.
