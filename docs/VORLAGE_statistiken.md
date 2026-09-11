# Statistiken im Ratgeber — Arbeitsvorlage

Wie Zahlen, Listen und Tabellen in einen Beitrag kommen. Für die Redaktion geschrieben,
nicht für Entwickler.

Alle Formen stammen aus dem Design „Die Zeitung“ (Variante A v2). Sie stehen **direkt auf
dem Papier** — keine Kästen, keine Rundungen, keine Schatten. Eine Statistik ist kein
Einschub, sie ist Teil des Textes.

---

## 1 · Die eine Regel

> **Keine Zahl ohne Quelle.** Jeder Block verlangt einen Quellennamen, eine `https`-URL und
> einen Stand. Fehlt etwas davon, sagt der Block es sofort im Editor.

Wenn eine Zahl nicht belegbar ist, gehört sie nicht in den Beitrag. Das gilt auch für
Zahlen aus dem Partnerbestand: Entweder es gibt eine zitierbare Quelle, oder die Form
bleibt leer.

Wer eine Zahl selbst ausrechnet — etwa einen Durchschnitt aus zwei veröffentlichten Summen —
schreibt das in das Feld **Hinweis**. Zum Beispiel: *„Ø Schadenhöhe aus den veröffentlichten
Summen berechnet.“*

**Sekundärquelle** ankreuzen, wenn die Quelle die Zahl nur weitergibt (ein Vergleichsportal,
eine Ratingagentur, ein Nachrichtenartikel). Im Beitrag steht dann sichtbar
„(Sekundärquelle)“ dahinter.

---

## 2 · Die vierzehn Formen: welche wofür

Im Inserter stehen sie einzeln unter ihren Namen. Einfach den Namen tippen — „Kreis…“,
„Zeitstrahl…“, „Spannen…“.

| Form | Nimm sie, wenn … | Grenzen |
|---|---|---|
| **Kreisdiagramm** | ein Ganzes in Teile zerfällt — „wofür die Hausrat zahlt“ | 3 bis 6 Stücke, Summe 100 |
| **Anteilsleiste** | dasselbe, aber flach und im Textfluss | 3 bis 5 Stücke, Summe 100 |
| **Balken** | gereihte Werte mit langen Beschriftungen, die sich nicht auf 100 summieren | 2 bis 8 Werte |
| **Säulen** | Kategorien vergleichen — Jahre, Altersgruppen, Gefahren | 2 bis 8 Kategorien, 1 oder 2 Reihen |
| **Liniendiagramm** | eine Entwicklung über die Zeit | 1 oder 2 Linien, gleich viele Werte je Linie |
| **Spannen** | „von – bis“ mit einem typischen Wert dazwischen | 2 bis 6 Zeilen, von ≤ Median ≤ bis |
| **Zeitstrahl** | ein Ablauf mit Fristen — Antrag, Prüfung, Bescheid | 2 bis 5 Stationen |
| **Vergleichstabelle** | Merkmale gegen Varianten stellen | eine Spalte darf „Empfehlung“ sein |
| **Kennzahlen-Vierer** | drei, vier große Zahlen als Einstieg | 3 oder 4 Kacheln |
| **Kennzahlen-Liste** | mehrere Werte untereinander mit Punktführung | 3 bis 8 Zeilen |
| **Schrittfolge** | eine Anleitung in Reihenfolge | 2 bis 6 Schritte |
| **Abwägung** | Dafür und Dagegen | je 1 bis 4 Punkte |
| **Begriffe** | Fachwörter erklären — **aus dem Glossar übernehmen** | 2 bis 5 Begriffe |
| **Vergleichsrechner** | einen externen Rechner einhängen | ein Vergleich aus der Liste |

### Was schon im Text steht, gehört in eine Form

Bevor Sie eine neue Statistik erfinden: Sehen Sie nach, was der Beitrag schon hat. Aufzählungen
mit Zahlen, HTML-Tabellen und Prozentlisten sind fast immer eine der vierzehn Formen in
schlechterer Gestalt. In den fünf Vorlagen wurden acht solcher Stellen umgestellt — eine
Tabelle mit Beiträgen je Personengruppe wurde zu **Spannen**, eine Preisliste nach Stadt zu
**Balken**, eine Aufzählung „75–80 % / 15–20 % / 3–5 %" zu einer **Anteilsleiste**.

Der Gewinn ist doppelt: Die Zahl wird lesbar, und sie steht nur noch einmal da.

### Was in welche Form gehört

**Kreisdiagramm / Anteilsleiste** — beide zeigen Anteile eines Ganzen. Der Kreis, wenn die
Statistik für sich steht und Aufmerksamkeit verdient; die Anteilsleiste, wenn sie beiläufig
im Lesefluss mitlaufen soll. Beide verlangen, dass sich die Werte auf 100 summieren. Tun
sie das nicht, ist es keine Aufteilung — dann Säulen oder Kennzahlen-Liste nehmen.

**Säulen statt Liniendiagramm** bei wenigen Zeitpunkten (bis etwa fünf) oder wenn die
Kategorien keine Zeitreihe sind. Linien erst ab sechs, sieben Stützstellen — vorher wirkt
die Linie behauptender, als die Daten hergeben.

**Balken statt Säulen**, sobald die Beschriftungen länger als ein Wort sind — „Kaufmännischer
Angestellter" passt unter keine Säule. Der Balken verträgt außerdem Werte, die sich nicht auf
ein Ganzes summieren: Preise, Beiträge, Zahlen je Gruppe.

**Spannen** ist die ehrlichste Form für Preise. Sie zeigt, dass es eben *keinen* einen Preis
gibt. Drei Zahlen je Zeile: der günstigste Fall, der typische, der teure.

**Begriffe** nie neu formulieren. Das Glossar ist gepflegt und wird an vielen Stellen
zitiert; zwei Fassungen desselben Begriffs widersprechen sich irgendwann.

---

## 3 · So legen Sie einen Block an

1. Im Beitrag an die Stelle gehen, an der die Statistik stehen soll. **Sie erscheint genau
   dort** — zwischen zwei Absätzen, wenn Sie das so wollen.
2. `/` tippen und den Namen der Form eingeben, etwa `/Kreisdiagramm`.
3. Oben **Titel** eintragen. Er erscheint im Kicker hinter dem Formnamen:
   `KREISDIAGRAMM · WOFÜR DIE HAUSRAT ZAHLT`. Also nur den Gegenstand nennen, nicht die Form.
4. **Beizeile** ist die kursive Zeile darunter — dort gehört hin, worauf sich die Zahlen
   beziehen: *„Anteil an den Leistungen 2024“*.
5. **Einheit** ist das, was hinter jeder Zahl steht: `%`, `€`, `Mio. €`.
6. Werte über **+ Zeile** hinzufügen, über **✕** wieder weg.
7. **Quelle** ausfüllen. Pflicht.
8. Unten steht entweder `✓ Vollständig.` oder eine Liste dessen, was noch fehlt.

### Die Warnungen im Editor

Sie blockieren nichts — sie sagen nur, was auffällt:

- *„Anteile summieren sich auf 74,0, nicht auf 100.“* — bei Kreis und Anteilsleiste
- *„3 bis 6 Stücke, nicht 8.“* — zu viele Werte, die Form wird unleserlich
- *„von ≤ Median ≤ bis ist verletzt.“* — bei Spannen vertauschte Zahlen
- *„Zeile hat 2 Werte, die Tabelle 3 Spalten.“* — eine Zelle fehlt
- *„Quelle braucht eine https-URL.“*

Ein Block mit Warnungen wird trotzdem gespeichert und angezeigt. Er sieht dann aber
wahrscheinlich falsch aus.

---

## 4 · Die Felder je Form

Was jede Form braucht. Titel und Quelle sind überall Pflicht, Beizeile und Hinweis überall
freiwillig.

| Form | Felder |
|---|---|
| Kreisdiagramm | Einheit · Text in der Mitte · je Stück: Beschriftung, Wert, Farbe |
| Anteilsleiste | Einheit · je Stück: Beschriftung, Wert, Farbe |
| Balken | Einheit · je Wert: Beschriftung, Wert, Farbe · ein Wert zum Hervorheben |
| Säulen | Einheit · Reihen (1–2 Namen) · je Kategorie: Name und je Reihe ein Wert · Obergrenze der Skala |
| Liniendiagramm | Einheit · Linien (1–2 Namen mit Farbe) · je Stützstelle: Beschriftung und je Linie ein Wert · y-Achse von/bis · Anmerkung |
| Spannen | Einheit · je Zeile: Name, von, Median, bis · Skala von/bis |
| Zeitstrahl | je Station: Marke („Tag 0“), Text, Position in Prozent |
| Vergleichstabelle | Kopfzelle der ersten Spalte · Spalten (Name, Auszeichnung, hervorheben) · je Zeile: Name und je Spalte ein Wert · Fußnote |
| Kennzahlen-Vierer | je Kachel: Überschrift, Zahl, Einheit, Erläuterung, Farbe |
| Kennzahlen-Liste | je Zeile: Name, Wert (frei, z. B. „85 %“) |
| Schrittfolge | je Schritt: Titel, Erläuterung |
| Abwägung | Dafür (Punkte) · Dagegen (Punkte) |
| Begriffe | je Begriff: Begriff, Erklärung |
| Vergleichsrechner | Titel · Vergleich aus der Liste |

### Farben

Sechs, mehr nicht — und in dieser Reihenfolge: Tinte, Grün, Türkis, Magenta, Grau,
Hellgrau. Wer die Farbe leer lässt, bekommt sie automatisch in dieser Reihenfolge. Das ist
meistens richtig. Magenta sparsam einsetzen: es zieht den Blick und sollte dem Wert
gehören, um den es geht.

### Zahlen mit Nachkommastellen

Die Anzeige übernimmt, was Sie tippen. `1,97` bleibt `1,97`. Tippen Sie keine Stellen, die
die Quelle nicht hergibt.

---

## 5 · Wie viel ist genug

Die fünf Vorlage-Ratgeber haben zehn bis zwölf Elemente auf 1.200 bis 1.900 Wörter. Das ist
ein guter Richtwert: **etwa alle 150 Wörter eine Form**, aber nie zwei gleiche Formen
hintereinander.

Eine tragfähige Reihenfolge, an der sich alle fünf orientieren:

1. Früh im Beitrag ein **Kennzahlen-Vierer** — vier Zahlen, die das Thema aufspannen.
2. Dann die **Hauptstatistik** zum Kernabschnitt: Kreis, Säulen oder Anteilsleiste.
3. Im Kostenabschnitt **Linien** oder **Spannen** — was sich entwickelt, was etwas kostet.
4. Eine **Vergleichstabelle**, wo es Varianten gibt.
5. Im Verfahrensabschnitt **Schrittfolge** und **Zeitstrahl**.
6. Eine **Abwägung** dort, wo Leserinnen wirklich entscheiden müssen.
7. Am Ende **Begriffe** und der **Vergleichsrechner**.

**Nie zweimal dasselbe.** Zwei Formen mit denselben Zahlen sind keine zwei Statistiken,
sondern eine Statistik und eine Verdopplung. `node tools/statistik-v2-pruefen.mjs` meldet das.
Dasselbe gilt für eine Form, die nur hübsch ist: Wenn sie keine Frage beantwortet, die sich
beim Lesen stellt, gehört sie nicht in den Beitrag.

Nicht in **Fazit** und nicht in **Häufige Fragen**. Diese beiden Abschnitte werden im Faden
anders gesetzt; ein Block landet dort am Beitragsende statt an seiner Stelle.

---

## 6 · Fragen an Leo

Unter jedem Fachabschnitt stehen Chips mit Fragen. Wer einen antippt, bekommt Leos Antwort
an Ort und Stelle — der Chip wird zur Frage und die Antwort schreibt sich darunter ein.

Gepflegt werden sie im Feld **Leo-Fragen** des Beitrags. Je Frage gehören dazu:

| Feld | Inhalt |
|---|---|
| Abschnitt | `heading-<n>` — dieselbe Zählung wie bei den Statistiken |
| Frage | Wie jemand sie wirklich stellen würde, gern mit Situation |
| Antwort | Drei bis fünf Sätze, konkret, mit Zahlen |
| Quellen | Paragraph oder Quelle, auf die sich die Antwort stützt |

**Acht bis fünfzehn je Beitrag**, ein bis zwei je Abschnitt. Die fünf Vorlagen haben zwölf.

Was eine gute Frage ausmacht:

- **Situation statt Stichwort.** Nicht „Was ist der Kinderlosenzuschlag?", sondern
  „Ich habe drei Kinder, das älteste ist 26. Welchen Pflegebeitrag zahle ich?"
- **Beantwortbar.** Die Antwort muss aus Gesetz, Bedingungen oder Statistik folgen —
  nicht aus einer Einschätzung.
- **Nicht im Text schon beantwortet.** Eine Frage, die der Absatz darüber beantwortet,
  ist Deko.
- **Zahlen mitliefern.** „Etwa 2.800 Euro im Monat, ab dem vierten Jahr rund 900 weniger"
  ist eine Antwort. „Das hängt vom Einzelfall ab" ist keine.

## 7 · Die fünf Vorlagen zum Nachschauen

Auf cms-dev, alle mit echten Zahlen und echten Quellen:

| Beitrag | Formen darin |
|---|---|
| `vorlage-haftpflicht` | 11 Elemente · **Spannen** aus einer vorhandenen Tabelle |
| `vorlage-hausrat` | 12 Elemente · **Balken** aus der Preisliste nach Stadt |
| `vorlage-bu` | 12 Elemente · **Balken** und **Anteilsleiste** aus Tabelle und Aufzählung |
| `vorlage-baufinanzierung` | 13 Elemente · **Liniendiagramm** und Zinsbindungstabelle |
| `vorlage-pflege` | 13 Elemente · drei umgestellte Stellen, zwölf Leo-Fragen |

Belege zu allen Zahlen: `docs/inhalte/statistik-v2-quellen.md`.

Alle Formen nebeneinander, mit den Zahlen des Designs:
`/schaukasten/statistiken`.

---

## 8 · Für die Technik

- Blockfamilie: `finanzleser/statistik`, vierzehn Variationen.
  `wordpress/plugins/finanzleser-blocks/`
- Nutzlast: base64-JSON im Attribut `daten`, ausgegeben als
  `<div data-finanzleser-statistik="…"></div>`
- Frontend: `components/statistik/`, Regeln in `lib/statistik/schema.ts`
- Prüfen: `node tools/statistik-v2-pruefen.mjs`
- Vorlagen neu setzen: `node tools/vorlage-kopie.mjs [--trocken]` — setzt Blöcke, ersetzt
  vorhandene Tabellen und Listen (`statt`), entfernt doppelte (`entfernen`) und schreibt die
  Leo-Fragen
- Plugin ausspielen: `tools/plugin-deploy.sh plugins/finanzleser-blocks`

🚨 Die Prüfregeln stehen zweimal — in `lib/statistik/schema.ts` und in `blocks.js`. Das
Plugin hat bewusst keinen Build-Schritt und kann die TypeScript-Datei nicht einlesen. Wer
eine Regel ändert, ändert sie an beiden Stellen.
