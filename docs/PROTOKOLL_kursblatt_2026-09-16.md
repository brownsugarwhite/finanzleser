# Abschlussprotokoll — Kursblatt

**Stand:** 16. September 2026 · Branch `feature/kursblatt` · 48 Commits über `origin/dev`
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

**Abnahme (Endstand nach allen drei Prüfrunden):** `tools/kursblatt-mess.mjs` 50/50 ·
`tools/rechner-mess.mjs` 32/32 · `tools/vergleich-breite.mjs` 47/47 ·
`tools/registry-pruefen.mjs --api` ohne Befund (17 Kategorien, 58 Parameter) ·
`npm run verify:redirects -- --offline` bestanden · Produktionsbau grün (1466 Routen,
`[86400, false]` — Regel 11 hält).

---

## 2 · Die kritische Endrecherche

Der Auftrag lautete: gegen financeads prüfen, gegen den Livezustand prüfen, und dafür
sorgen, dass es bei uns jede Auswahl gibt, die financeads kennt. Das hat **fünf echte
Fehler** zutage gefördert — vier davon waren schon vor diesem Umbau da.

Deine beiden Stichproben haben dann zwei weitere Runden ausgelöst (§ 2.7 und § 2.8), und
die haben mehr gefunden als die erste. **Der rote Faden durch alle drei: eine Prüfung
findet nur, wonach sie fragt.** Drei Fragen mussten erst gestellt werden —
„schneidet unsere Voreinstellung zu viel weg?", „trägt jede Auswahl überhaupt Produkte?"
und „was setzt die API, ohne dass wir es verlangt haben?". Jede hat einen Fehler zutage
gefördert, den die beiden anderen nicht sehen konnten.

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

### 2.6 Gegenprobe: alle 56 Rechner gegen den alten Satz

Jeder Rechner wurde geöffnet, ausgerechnet und Zeile für Zeile mit dem alten Satz
verglichen (`abgleich.mjs`, Playwright). Endstand:

```
56/56  rendern ohne Konsolenfehler, ohne NaN, ohne leere Werte
115 Kacheln · 300 Punktzeilen · 10 Tabellen mit 106 Zeilen · 13 Zeiger · 5 Messlatten
```

Fünf gemeldete „fehlende Zeilen" bleiben stehen und sind alle erklärt:

| Meldung | Erklärung |
|---|---|
| BAföG „Kein BAföG-Anspruch“, Elterngeld „Kein Anspruch“ | richtig fehlend — die Zeile gilt nur, wenn KEIN Anspruch besteht; mit den Voreinstellungen besteht einer |
| Stundenlohn, Steuererstattung | der alte Satz hatte dort eine Beschriftung, die erst zur Laufzeit entsteht. Der Vergleich liest den Quelltext, die Seite zeigt den Text („Über Mindestlohn“, „Voraussichtliche Erstattung“) |
| Kredit: Kreditsumme, Laufzeit, Jahreszins | Echos der Eingabefelder, die im Kursblatt direkt darüber stehen — die Übergabe lässt sie weg |
| Kredit: „Effektivzins“ | heißt jetzt „Effektiver Jahreszins“ und steht wieder da (war beim ersten Durchgang tatsächlich verloren) |

Zwei echte Fehler hat dieser Abgleich gefunden und beide sind behoben: der Rentenabschlag
gab „undefined Monate“ aus (mein eigener Umlaut-Fix hatte den Feldnamen `monate_frueher`
getroffen), und der Effektivzins des Kreditrechners fehlte.

### 2.7 🚨 Nachtrag: was 2.4 nicht sehen konnte

Deine Stichprobe am Minikredit hat eine Lücke in meiner Prüfmethode aufgedeckt, und sie
ist grundsätzlich: **§ 2.4 verglich unsere Seite mit der API bei genau unseren
Parametern.** Das ist ein Zirkelschluss — er prüft, ob wir die Daten treu darstellen, nie
ob wir die richtigen anfragen. Dazu kam, dass ich 15 von 43 Vergleichen von Hand
ausgewählt hatte; Minikredit war nicht dabei.

**Der Fehler, den das verdeckt hat:** Die Minikredit-Seite hatte `type=MINI_LOAN` fest
gesetzt. Dieser Filter liefert ausschließlich bei 500–1.000 € über 1–2 Monate Ergebnisse
— dieselben zwei, die auch ohne ihn kommen — und sonst überall null. Die Seite hat aber
zwei Regler. Wer die Laufzeit über sechs Monate zog, stand vor einer leeren Liste. Beide,
Seite und API, lieferten null, also galt sie als „deckungsgleich".

**Die Prüfung, die gefehlt hat,** liegt jetzt als `tools/vergleich-breite.mjs` vor und
läuft über ALLE Vergleiche: jeden gesetzten Parameter einzeln weglassen und zählen.
Vervielfacht sich die Liste, ist der Parameter zu eng gewählt. **47 von 47 ohne Befund.**

Zwei weitere Funde aus demselben Nachfassen:

- **„Verwendung" und „Kreditart" standen nirgends.** Beide waren global unsichtbar,
  obwohl nur die Autokredit-Seite die Verwendung redaktionell festlegt. 🚨 Die drei Werte
  der Übergabe — Neuwagen, Gebrauchtwagen, Umschuldung — **gibt es in der API nicht**:
  `NEW_CAR`, `USED_CAR`, `RESCHEDULING` und fünf weitere antworten mit „The selected usage
  is invalid". Gültig sind genau drei: Auto, Modernisierung, freie Verwendung.
- **Tierversicherung: der Rechner des Partners lässt eine Rasse wählen, die API nicht.**
  Zwölf Parameternamen durchprobiert (`breed`, `race`, `rasse` …) — keiner existiert; von
  21 `/list/`-Endpunkten liefert keiner eine Rasseliste. Die Fehlermeldung lautet wörtlich
  „Risky group must be one of RG1, RG2, RG3". Welche Gruppe welche ist, lässt sich auch
  nicht erschließen (RG1 zwölf Tarife ab 56,97 €, RG2 drei ab 25,88 €). Die Zuordnung
  Rasse → Gruppe liegt im Widget des Partners. Geraten wird sie nicht — ein Hinweis sagt
  jetzt, wer die Gruppe festlegt. **Das bleibt offen** und braucht entweder eine Anfrage
  bei financeads oder eine belegte Quelle.

**Methodisch gelernt:** `filter_settings` zeigt nur, was die API *angewandt* hat. Ein
Parameter, den wir nie senden und der keine Voreinstellung hat, taucht dort nie auf.
Verlässlich enumerieren lässt er sich anders: ein gültiger Parameter mit ungültigem Wert
wird namentlich gerügt, ein unbekannter stillschweigend ignoriert.

### 2.8 🚨 Zweiter Nachtrag: die Spezifikation — und was danach noch fiel

Dein Einwand aus § 2.7 („aber wie kann man filtern, wenn Auswahlmöglichkeiten fehlen?")
hat mich die Frage anders stellen lassen: nicht mehr „welchen Parameternamen könnte die
API kennen", sondern **wo steht das geschrieben**. Es steht geschrieben — in der
OpenAPI-Spezifikation des Partners (`api.financeads.net/documentation/v1/affiliate.yaml`,
nur mit eingeloggter Browser-Sitzung lesbar). Daraus habe ich den vollständigen
Parameterbestand aller 25 Kategorien gezogen und Zeile für Zeile gegen unsere Registry
gestellt. Was dabei herauskam, war mehr als eine Liste fehlender Felder.

#### Die Rasse: es gab die belegte Quelle doch

In § 2.7 steht, eine Zuordnung Rasse → Risikogruppe sei „mit belegter Quelle nicht
möglich". Das war voreilig. Dieselbe Spezifikation nennt den Endpunkt
`list/pethealthinsurance/animalbreeds` — **579 Hunderassen und 50 Katzenrassen, jede mit
ihrer Gruppe**, abrufbar mit unserem API-Schlüssel allein. Es fehlte nie der Zugang, nur
der Pfad; zwölf geratene Parameternamen und 21 geratene Listenpfade hatten mich zu dem
Schluss gebracht, es gäbe ihn nicht.

Der Leser tippt jetzt seine Rasse ein, gesetzt wird die Gruppe. Gemessen: „Deutsche
Dogge" → Gruppe 3 → vier Tarife ab 25,88 € statt zwölf ab 11,22 €. Die Einteilung folgt
übrigens der **Größe**, nicht den Listenhunden (Chihuahua Gruppe 1, Mops und Rottweiler
Gruppe 3) — und **alle 50 Katzenrassen liegen in Gruppe 1**, dort ändert die Eingabe
nichts. Beides steht so im Hinweis unter der Liste, statt es zu verschweigen.

Die 19 Wertelisten liegen als `lib/financeads/listen.generated.json` im Repo
(`tools/financeads-listen.mjs` baut sie neu).

#### 🚨 Der zweite Fall vom Schlage `country_rating`: sieben Depots waren unsichtbar

Beim Depot-Vergleich liefert die API **ohne** `stock_exchanges` 28 Depots, **mit** dem
Parameter 35 — und die sieben, die nur mit Handelsplatz erscheinen, sind ausgerechnet die
gebührenfreien: finanzen.net zero und sein Kinderdepot, justTRADE, flatex (Depot und
Neukundendepot), comdirect Pure Depot, Alchemy Markets. Die 28 sind eine echte Teilmenge
der 35. Offenbar rechnet der Partner die Ordergebühr erst, wenn der Handelsplatz
feststeht. Voreinstellung ist jetzt „alle großen Börsen", und der Handelsplatz ist eine
sichtbare Auswahl (Frankfurt 22, NYSE 12, Hamburg 10 Depots).

#### 🚨 Eine Seite war seit einem Tag stillgelegt, obwohl sie längst wieder lief

`travelhealthinsurances` (Auslandskrankenversicherung) stand seit dem 15.09. als
`defekt`: der Endpunkt warf parameterunabhängig HTTP 400, einen Serverfehler des
Partners. Beim Gegenprüfen habe ich ihn erneut angefasst — **er antwortet wieder**, und
zwar nicht mit einer mageren Anbieterliste, sondern mit vollen Konditionen. Aus der
stillgelegten Seite wird damit eine vollwertige Klasse-A-Kategorie mit Jahresbeitrag,
Reisedauer, Altersspanne, Rücktransport und Notfallhilfe.

Dazu drei Angaben, die alle drei den Preis bewegen: Alter (ab 65 teurer, ab 70 noch
einmal), Reisedauer (ab 56 Tagen steigen Preise, ab 70 bleiben zwei Tarife, ab 90 keiner)
und wer reist (allein / mit Kind / Paar — eigene Tarife). **Und dieselbe Falle wie beim
Festgeld:** ohne Angaben rechnet die API still mit Alter 60 und 45 Reisetagen.

*Lehre:* Einen als kaputt vermerkten Endpunkt bei jeder Gegenprüfung erneut anfassen.
Sonst bleibt eine Seite für immer stillgelegt, weil sie einmal stillgelegt war.

#### Was sonst dazugekommen ist — und was bewusst nicht

| Kategorie | neu | gemessen |
|---|---|---|
| Depot | `stock_exchanges` | 28 → **35** Depots |
| Girokonto | `credit_card` | 28 von 37 Konten führen eine Kreditkarte |
| Kreditkarte | `provider`, `payment_methods`, `transaction_not_eu` | Visa 18 · Mastercard 23; Kredit 31 · Charge 10 · Prepaid 5 · Debit 3 |
| Crowdinvesting | `location`, `duration_to` | hatte bisher **gar keine** Parameter |
| Steuersoftware | `availability` | Browser / Android / iPhone |
| Tierkranken | `coverage` | Vollschutz schneidet 12 → 7 |
| Auslandskranken | `age`, `travel_duration`, `insured_person`, `excess` | ganze Kategorie neu |

**Zwei Korrekturen an meiner eigenen Arbeit von gestern:**

- **`coverage` bei der Tierversicherung war kein erfundenes Feld.** § 2.3 sagt das
  Gegenteil, und die Begründung dort war ein Fehlschluss: `coverage=OP` liefert dieselben
  zwölf Tarife wie gar kein `coverage`, und `filter_settings` echot ihn nicht — beides
  sah nach „kennt die API nicht" aus. Es heißt aber nur, dass OP-Schutz die untere Stufe
  ist, die jeder Tarif erfüllt. `coverage=FULL` schneidet auf sieben.
- **`availability` bei der Steuersoftware war nicht tot, ich hatte die falschen Vokabeln
  geraten.** ONLINE/OFFLINE/APP/DESKTOP leerten die Liste; die gültigen Werte stehen im
  Produkt selbst (`details.available_platforms`: `web.Browser`, `smartphone.Android/iOS`,
  `desktop.Windows/MacOS/Linux`) und heißen kleingeschrieben genauso.

**Und drei Dinge sind aus der Registry geflogen, weil sie nichts taten:**

- Bei der **Kreditkarte** standen `average_balance`, `incoming_monthly` und `transaction`
  — drei Bedienelemente, zwei davon Lineale über die volle Satzbreite. Ich hatte sie
  gestern mit der Begründung aufgenommen, sie gingen in `calculated_conditions` ein.
  Nachgerechnet: mit 50.000 € Kontostand, 8.000 € Geldeingang oder 150 Buchungen kommt
  Produkt für Produkt dasselbe Ergebnis. **Ein Echo in `filter_settings` ist kein Beweis
  für Wirkung.**
- Bei der **Steuersoftware** stand `target_group` mit vier Gruppen, von denen drei die
  Liste leerten. Die beiden Programme sind Allzweckprogramme.
- `card_status[]` bei der Kreditkarte bleibt draußen: 32 Kandidaten durchprobiert, jeder
  einzelne „The selected card status is invalid." Es gibt weder einen Listenendpunkt noch
  ein Feld im Produkt, aus dem sich die Vokabel ableiten ließe. Dasselbe bei `coverage`
  der Zahnzusatzversicherung — 16 Werte, jeder leert die Liste von 32 auf 0.

#### 🚨 Die Prüfung, die diesmal gefehlt hätte

`tools/vergleich-breite.mjs` aus § 2.7 fragt: schneidet ein gesetzter Parameter die Liste
zu eng? Es fehlte die Gegenfrage: **trägt jede angebotene Auswahl überhaupt Produkte?**
Das ist die Minikredit-Falle aus einer anderen Richtung, und sie saß schon wieder in der
Registry: bei der Tierkrankenversicherung standen fünf Stufen Selbstbeteiligung, von
denen **drei (150 €, 350 €, 500 €) null Tarife liefern**. Wer sie gewählt hätte, wäre vor
einer leeren Liste gestanden.

Gefunden hat das `tools/registry-pruefen.mjs --api` — neu, und die dauerhafte Form dessen,
was ich heute von Hand gemacht habe. Sie prüft drei Dinge über alle Kategorien:

1. **Jede Option muss Produkte tragen.** (fand die drei toten Selbstbeteiligungsstufen)
2. **Was setzt die API ungefragt?** `filter_settings` gegen unsere gesendeten Parameter.
   (das ist der `country_rating`-Fund, als Dauerprüfung)
3. **Jedes Preset muss eine gültige Option sein.** `klemme()` setzt ein Preset, das nicht
   in `optionen` steht, stumm auf den Standard zurück — der Chip steht da und tut nichts.
   (fand zwei Fälle: Tieralter „8 Jahre", Zahnzusatz „25/55 Jahre")

Stand nach den Korrekturen: **17 Kategorien, 58 Parameter, keine Befunde.**

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
| **Reisekranken-CPT** | Der Endpunkt lebt wieder, die Seite steht im Kursblatt-Satz. Der Block `vergleich-quelle` im CMS trägt noch `vor: {}` — die Registry-Standards greifen, aber wer die Voreinstellung redaktionell setzen will, tut es dort. |
| **Hinweise des Partners** | `data.notices` (Ranking-Erklärung, Datenschutz, „Alle Angaben ohne Gewähr") liegen im Schnappschuss, werden aber nirgends angezeigt. Ob (3) eine vertragliche Pflichtangabe ist, muss jemand prüfen. → eigene Aufgabe, Chip liegt bereit |
| **Tilgungsplan: 0,23 € Restschuld** | Ein Rundungsrest in `lib/calculators/kredit.ts`, der seit jeher in der sichtbaren Tabelle steht. Nicht angefasst, weil es die Live-Seite ändert. → eigene Aufgabe |
| **Rentenbesteuerungs-Rechner** | Rechnet den Besteuerungsanteil falsch (Altfund, nicht Teil dieses Umbaus). |

---

## 6 · Werkzeuge

```bash
node tools/kursblatt-mess.mjs      # Vergleichsseiten, 50 Prüfungen
node tools/rechner-mess.mjs        # Rechner, 32 Prüfungen (--slug für einen anderen)
node tools/vergleich-breite.mjs    # zeigt jede Seite, was ihre Kategorie hergibt? (47)
node tools/registry-pruefen.mjs [--api]   # trägt jede Auswahl Produkte? was setzt die API ungefragt?
node tools/financeads-listen.mjs [--prüfen]   # die 19 Wertelisten des Partners (Rassen, Anbieter, Börsen)
npm run verify:redirects -- --offline   # Pflicht vor jedem Merge nach main
node --experimental-strip-types tools/financeads-refresh.mjs   # Schnappschüsse
```

Die Reihenfolge ist Absicht: `registry-pruefen` fragt, ob die **Auswahl** stimmt,
`vergleich-breite`, ob die **Voreinstellung** nicht zu eng ist, und `kursblatt-mess`, ob
der **Satz** stimmt. Drei verschiedene Fragen — jede hat einmal einen Fehler gefunden,
den die beiden anderen nicht sehen konnten.

🚨 Der Produktionsbau lief in einem eigenen Arbeitsbaum, damit das `.next` deines
Dev-Servers unberührt blieb. Wer ihn wiederholt, macht es genauso:

```bash
git worktree add --detach /tmp/bauprobe HEAD && ln -s "$PWD/node_modules" /tmp/bauprobe/node_modules && cp .env.local /tmp/bauprobe/ && (cd /tmp/bauprobe && npx next build)
```
