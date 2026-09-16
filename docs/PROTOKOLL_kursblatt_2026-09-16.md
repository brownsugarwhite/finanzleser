# Abschlussprotokoll — Kursblatt

**Stand:** 16. September 2026 · Branch `feature/kursblatt` · 38 Commits über `origin/dev`
**Auftrag:** Die Design-Übergabe `design_handoff_finanzleser_kursblatt/` exakt umsetzen —
für die Vergleiche **und** alle 56 Rechner, im Fadenlayout.

---

## 1 · Was jetzt steht

**Alle 27 Schritte des freigegebenen Plans sind umgesetzt.** Das Kursblatt ist nicht mehr
ein Satz neben dem alten, sondern **der** Satz: `NEXT_PUBLIC_KURSBLATT` ist gefallen,
`skin === "faden"` heißt Kursblatt.

| | vorher | jetzt |
|---|---|---|
| Vergleichsseiten | schlichte Liste, Säulen | Zeitungskopf, Streuband oder Zinskurve, Kennzahlen, Podest, Filterzeile, Merkzettel |
| Rechner | 56 Komponenten mit `rechner-layout` | 56 Schemata im Zeitungssatz, ein gemeinsamer Rahmen |
| Eingaben | `RechnerInput`/`Select`/`Checkbox` | Lineal · Drehring · Zählwerk · Setzzeile · Register · Schalter |
| Ergebnis | Kästen und Tabellen | Kacheln mit Zählwerk, Anteilsband, Verlaufskurve mit Scrubber, Zeiger, Messlatte, Jahresübersicht |
| Weg zum Angebot | — | Brücke mit den echten Marktzahlen, Ablage im Aktenkoffer |

**Gelöscht:** 56 Rechner-Komponenten, 14 Bausteine, `useRechnerState`,
`RechnerLayoutContext`, `VergleichSaeulen`, `app/faden-vergleich.css`, 112 tote
CSS-Regelblöcke. `RechnerEmbed` von 360 auf 29 Zeilen, `app/rechner.css` von 983 auf 171.

**Abnahme:** `tools/kursblatt-mess.mjs` 50/50 · `tools/rechner-mess.mjs` 32/32 ·
`npm run verify:redirects -- --offline` bestanden · Produktionsbau grün (1466 Routen,
`[86400, false]` — Regel 11 hält).

---

## 2 · Die kritische Endrecherche

Der Auftrag lautete: gegen financeads prüfen, gegen den Livezustand prüfen, und dafür
sorgen, dass es bei uns jede Auswahl gibt, die financeads kennt. Das hat **fünf echte
Fehler** zutage gefördert — vier davon waren schon vor diesem Umbau da.

### 2.1 🚨 `country_rating` — financeads hat still gefiltert

Die API schickt in jeder Antwort zurück, welche Filter sie angewandt hat
(`data.filter_settings`). Beim Festgeld stand dort `country_rating: "AA"` — **ohne dass
wir das je angefragt hätten.** Das ist die Voreinstellung der API.

Gemessen am 16.09.2026, 20.000 € über 36 Monate:

| `country_rating` | Angebote | Länder |
|---|---|---|
| `AAA` | 21 | DE, LI, NL, SE |
| `AA` ← **unsere stille Voreinstellung** | 28 | + AT, CZ, FR |
| `A` bzw. `0` | **31** | + ES, MT |

Unter den drei unterschlagenen war mit **Multitude Bank (3,40 %, Malta)** eines der
besten Angebote der Liste. Die Voreinstellung ist jetzt `0` — die vollständige Liste —
und die Bonitätsstufe ist eine sichtbare Auswahl („alle Länder / mindestens AA / nur
AAA"). Das ist zugleich die Antwort auf die Beobachtung aus der Stichprobe: *bei gleichen
Angaben andere Anbieter.*

Damit entfällt auch die selbstgebaute Bonitätsliste aus Schritt 15: die Stufen kommen
jetzt aus der Bewertung des Partners statt aus einer Länderliste nach Finanztip, die
jemand pflegen müsste. „Nur Deutschland" filtert `deposit_protection_country_iso` an der
Quelle (Festgeld 31 → 18, Tagesgeld 41 → 19) statt hinterher in einer bereits
gefilterten Liste zu suchen.

### 2.2 🚨 Der Produktdeckel schnitt drei Listen bei 40 ab

`MAX_PRODUKTE = 40` in `lib/financeads/normalisieren.ts` — ohne Hinweis, ohne Zeile
darunter:

| Vergleich | wir | financeads |
|---|---|---|
| Kreditkarten | 40 | **49** |
| Privathaftpflicht | 40 | **47** |
| Tagesgeld | 40 | **41** |

Neun Kreditkarten und sieben Haftpflichttarife fehlten. Deckel auf 80; der größte
Schnappschuss liegt bei 132 KB, die Warnschwelle bei 200 KB.

### 2.3 🚨 Elf Auswahlmöglichkeiten fehlten, eine war erfunden

Vollständiger Abgleich der `filter_settings` aller 25 Kategorien gegen unsere Parameter:

| Kategorie | neu dazu | gemessene Wirkung |
|---|---|---|
| Festgeld | `country_rating`, `deposit_protection_country_iso` | 28 → 31 · DE-Filter 31 → 18 |
| Tagesgeld | `deposit_protection_country_iso` | DE-Filter 41 → 19 |
| Girokonto | `transaction` (Buchungen/Monat) | 37 → 39 Konten |
| Kreditkarte | `average_balance`, `incoming_monthly`, `transaction` | Trefferzahl gleich, aber sie gehen in `calculated_conditions` ein — ohne sie rechnete die API still mit eigenen Vorgaben (1.000 € / 1.200 € / 0) |
| Krypto | `order_count_pa` | geht in die Gebührenrechnung ein |
| Mietkaution | `tenant_protection` | 2 → 5 Angebote |
| Steuersoftware | `target_group`, `tax_returns_per_year`, `duration_of_use` | hatte bisher **gar keine** Parameter |

**In die andere Richtung:** `coverage` bei der Tierkrankenversicherung war ein Versprechen
ohne Deckung. Die API kennt den Parameter nicht — kein Echo in `filter_settings`, keine
Wirkung bei „OP"/„FULL"/50/80/100. Ein Schalter, der nichts tut, ist schlimmer als keiner;
er ist raus.

**Bewusst nicht übernommen,** mit Begründung im Code:
`broker` (liefert exakt dieselben Produkt-IDs, gemessen bei Tagesgeld und Festgeld),
`availability` bei der Steuersoftware (jeder Wert leert die Liste),
`calculator`/`advertising_space`/`search_default`/`enabled` beim Roboadvisor (interne
Größen des Gateways, keine Angaben eines Lesers).

### 2.4 Gegenprobe: 15 von 15 Vergleichen deckungsgleich

Nach den Korrekturen zeigt jede Vergleichsseite dieselben Produkte wie die API bei
denselben Angaben:

```
festgeldvergleich      35 = 35     geschaeftskonto  30 = 30     hausrat        14 = 14
tagesgeldvergleich     41 = 41     depot            28 = 28     rechtsschutz   12 = 12
autokredit             19 = 19     baufinanzierung   7 =  7     risikoleben     6 =  6
ratenkredit            14 = 14     krypto            9 =  9     hundehaftpfl.  15 = 15
girokonto              37 = 37     privathaftpfl.   47 = 47
kreditkarten           49 = 49
```

Die vier als „abweichend" gemeldeten Fälle unterscheiden sich nur um ein Leerzeichen am
Wortende („BestGiro " gegen „BestGiro"), das unsere Normalisierung abschneidet.

**Bei den Anbieternamen weichen wir absichtlich ab und sind dabei genauer:** financeads
führt in `advertiser.name` oft die Mediaagentur — „Spark Foundry Germany GmbH" statt
Santander, „Mindshare GmbH" statt Hannoversche Versicherung, „norisk GmbH" statt
Commerzbank. Wir nehmen den Programmnamen, also die Marke.

### 2.5 Livezustand des alten Layouts

- **Rechner** (`https://www.finanzleser.de/finanztools/rechner/…`): laufen unverändert im
  alten Satz (`rechner-container`). Gerechnet wird dort mit denselben Funktionen aus
  `lib/calculators/` wie bei uns — die Zahlen sind identisch, nur die Darstellung ist neu.
- **Vergleiche** (`…/finanztools/vergleiche/festgeldvergleich`): zeigen **gar keine
  Angebote**. Kein iframe, keine Tabelle, keine Anbieterliste — nur Überschrift und
  Beschreibungstext. Der alte Einbau über `tools.financeads.net` ist tot. Was hier
  entsteht, ersetzt also nicht eine funktionierende Liste, sondern eine leere Seite.

---

## 3 · Fehler, die der Umbau nebenbei gefunden hat

| Fund | Wirkung | Wo |
|---|---|---|
| 🚨 **Sichtkontakt wurde nie gemeldet** | Die Affiliate-Vergütung hing an einem `IntersectionObserver` mit `threshold: 0.5` — bei einer 1863 px langen Liste in einem 900 px hohen Fenster unerreichbar. **Vergütungsrelevant.** | `503b7cb` |
| **`nurDetails` galt nur im Kursblatt** | Die alte Liste zeigte nach der Registry-Erweiterung elf statt vier Spalten. | `2941c34` |
| **Beim Nachladen fiel die Seite auf die Voreinstellung zurück** | Wer 23.500 € eingab und dann die Laufzeit wechselte, sah dazwischen die Zahlen zu 20.000 €. | `2941c34` |
| **`.kb-kurve` gab es zweimal** | Die Zinskurve des Vergleichs überschrieb die Restschuldkurve des Rechners (Achsenschrift 11 statt 10 px, fremdes `position/margin/padding`). | `d62791c` |
| **Der Sprung zum Ergebnis landete 40 px zu tief** | Er lief los, während der Kasten noch von 0 auf 1011 px wuchs — `scrollTo` wird auf die Seitenhöhe von diesem Augenblick geklemmt. | `d62791c` |
| **`formatProzent` ließ den Wert über die Stellenzahl entscheiden** | In einer Spalte stand „3,30 % · 3,20 % · 3 %". | `2941c34` |
| **Drei Rechner zeigten dieselbe Zeile zweimal** | Gleitzone, Rentenbeginn, Rentenschätzer — React meldete den doppelten Schlüssel. | `6d0fc06` |
| **Der Stundenlohn-Rechner trug seinen Quelltext als Beschriftung** | `label={result.ueberMindestlohn ? …}` landete als Zeichenkette in der Kachel. | `6d0fc06` |
| **Drei Rechner zeigten beide Zweige gleichzeitig** | BAföG, Elterngeld, Kfz-Steuer — „Kein Anspruch" stand neben der Aufstellung. | `6d0fc06` |
| **29 Auswahllisten wären leer gewesen** | Ihre Einträge entstanden im alten Satz erst zur Laufzeit (`Array.from`, `.map`, geteilte Konstanten). | `46968dd` |
| **Fünf Kredit-Merkmale der Übergabe gibt es bei financeads nicht** | Sondertilgung, Sofortzusage, Ratenpause, Auszahlung, Mindestalter — ersetzt durch sieben echte Felder. | `a6f2332` |

---

## 4 · Bewusste Abweichungen von der Übergabe

1. **Cent nur, wo sie etwas bedeuten.** Der alte Satz rundete jeden Betrag auf zwei
   Stellen, auch „22.921,00 €". Der Kursblatt-Satz zeigt Cent unter 100 € (Stundenlohn
   21,54 €) und darüber keine (2.921 €) — dieselbe Regel wie in den Vergleichen.
2. **„Alle Länder" statt „Alle EU-Länder".** Ein gemessenes Festgeldangebot kommt aus
   Liechtenstein — EWR, nicht EU.
3. **Die Zinskurve zeigt den Zins, nicht den Ertrag.** Die Laufzeit-Varianten des
   Schnappschusses liegen alle beim Basisbetrag; der Zins ist betragsneutral, der Ertrag
   nicht. Weicht der eingestellte Betrag ab, steht das unter der Kurve.
4. **Das Lineal misst nicht.** Statt `offset = w/2 − x(wert)` per ResizeObserver eine
   CSS-Variable — das Lineal steht dadurch schon im gelieferten HTML richtig, ohne
   JavaScript und ohne Hydrations-Sprung.
5. **Umlaute.** „Maerz", „Heizoel", „Regulaer", „BAfoeg", „taeglich" — der Kursblatt-Satz
   ist ein typografischer Umbau; 25 Dateien korrigiert. Schlüssel und Importpfade bleiben
   unangetastet.
6. **Die Brücke nennt mehr als der Prototyp.** Nicht nur „Angebote ab 0,68 %", sondern
   auch, wie viele es sind und was das gegenüber der eigenen Rate ausmacht.

---

## 5 · Offen

| Punkt | Warum offen |
|---|---|
| **Visuelle Abnahme durch dich** | Gemessen ist alles, angesehen hast du es noch nicht. |
| **PR und Merge** | Branch `feature/kursblatt`, 38 Commits, Ziel `dev` — PR #14 (`feature/financeads-vergleiche`) liegt darunter und sollte zuerst. |
| **Festgeld-Voreinstellung** | Die Registry sagt 36 Monate (wie die Übergabe), der Block `vergleich-quelle` in WordPress pinnt 12. Das ist eine redaktionelle Entscheidung — sie zu überschreiben stünde mir nicht zu. |
| **Hinweise des Partners** | `data.notices` (Ranking-Erklärung, Datenschutz, „Alle Angaben ohne Gewähr") liegen im Schnappschuss, werden aber nirgends angezeigt. Ob (3) eine vertragliche Pflichtangabe ist, muss jemand prüfen. → eigene Aufgabe, Chip liegt bereit |
| **Tilgungsplan: 0,23 € Restschuld** | Ein Rundungsrest in `lib/calculators/kredit.ts`, der seit jeher in der sichtbaren Tabelle steht. Nicht angefasst, weil es die Live-Seite ändert. → eigene Aufgabe |
| **Rentenbesteuerungs-Rechner** | Rechnet den Besteuerungsanteil falsch (Altfund, nicht Teil dieses Umbaus). |

---

## 6 · Werkzeuge

```bash
node tools/kursblatt-mess.mjs      # Vergleichsseiten, 50 Prüfungen
node tools/rechner-mess.mjs        # Rechner, 32 Prüfungen (--slug für einen anderen)
npm run verify:redirects -- --offline   # Pflicht vor jedem Merge nach main
node --experimental-strip-types tools/financeads-refresh.mjs   # Schnappschüsse
```

🚨 Der Produktionsbau lief in einem eigenen Arbeitsbaum, damit das `.next` deines
Dev-Servers unberührt blieb. Wer ihn wiederholt, macht es genauso:

```bash
git worktree add --detach /tmp/bauprobe HEAD && ln -s "$PWD/node_modules" /tmp/bauprobe/node_modules && cp .env.local /tmp/bauprobe/ && (cd /tmp/bauprobe && npx next build)
```
