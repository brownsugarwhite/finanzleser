# Arbeitsauftrag: Statistiken für einen Stapel („Der Faden mit Leo“)

Du recherchierst für die Ratgeber eines Stapels je Beitrag ein bis zwei Statistiken aus
Primärquellen und schreibst sie als JSON. Du importierst nichts, committest nichts und
änderst keine anderen Dateien als die zwei genannten Ausgabedateien.

## Eingaben

- Beitragstexte des Stapels: `docs/inhalte/text/stapel-NN.txt`. Je Beitrag zuerst die
  Abschnittsliste (`heading-<n>: <h2>`), dann der Text mit `## <n> <h2>`. Der Index n ist
  der Abschnitts-Schlüssel des Frontends.
- Abschnittsliste aller Beiträge: `docs/inhalte/beitraege-liste.json` (Feld `h2`; Index = heading-n).
- Datenschema: `lib/types.ts` (Interfaces `FadenStatistik`, `StatistikReihe`, `StatistikWert`,
  `StatistikRegler`, `StatistikFormel`).
- Prüfer: `node tools/statistik-stapel.mjs NN --ohne-import` (immer mit `--ohne-import`).
- Fertige Beispiele für Stil, Länge und Ton: `docs/inhalte/statistik-batch-00.json` bis `…-03.json`.
- Erlaubte Rechner für einen Regler: die Allowlist in `lib/statistik/formeln.ts`; Eingabe- und
  Ausgabefelder stehen in den Interfaces `<Rechner>Params` und `<Rechner>Result` in
  `lib/calculators/<rechner>.ts`.

## Ausgaben

1. `docs/inhalte/statistik-batch-NN.json`:
   `[{ "slug": "...", "statistiken": [ { …FadenStatistik ohne "abschnitt" (setzt der Prüfer)… } ] }]`
   Beiträge ohne belastbare Statistik erhalten `"statistiken": []`.
2. `docs/inhalte/statistik-batch-NN.quellen.md`, Format:

   ```
   # Quellenprotokoll Stapel NN
   ## <slug> · „<titel>“ (heading-<n>)
   - Quelle: <Herausgeber, Titel>, <URL>, Stand <Datum/Jahr>, abgerufen <Datum>
   - Belege: „<wörtliches Zitat 1, höchstens zwei Sätze>“ · „<Zitat 2>“
   - Werte: <Label> = <Wert>; … · abgeleitet: <Rechenweg, falls ein Wert abgeleitet ist>
   ## <slug> · ohne Statistik
   - Grund: <warum keine belastbare Zahl gefunden wurde, welche Quellen geprüft wurden>
   ```

## Regeln (verbindlich)

1. **Nur belegte Zahlen.** Primärquellen zuerst: Gesetzestexte (gesetze-im-internet.de),
   Statistisches Bundesamt, Bundesbank, BaFin, Bundesagentur für Arbeit, Deutsche
   Rentenversicherung, Ministerien (BMF, BMAS, BMJ, BMV, BMWK, BMFSFJ), Bundesnetzagentur,
   Kraftfahrt-Bundesamt, Bundesamt für Justiz, Oberlandesgericht Düsseldorf, KfW, EZB,
   Eurostat, Verbände nur als Herausgeber eigener Statistiken (GDV, BDEW, EKD, Bundesnotarkammer).
   Sekundärquellen (Verivox, Check24, Finanztip, Statista, Presse) nur, wenn keine Primärquelle
   erreichbar ist; dann `"sekundaer": true` in `quelle`.
2. **Nichts aus dem Beitragstext übernehmen** (Beiträge können veraltet sein). Der Text zeigt
   nur, welche Zahlenaussagen ein Abschnitt macht; die Zahl kommt aus der Quelle.
3. **Ohne belastbare Zahl keine Statistik.** Lieber `"statistiken": []` als eine erfundene oder
   geratene Zahl. Runden nur so, wie es die Quelle tut. Werte als Zahl mit Punkt als Dezimaltrenner.
4. **Jede Zahl steht im Quellenprotokoll mit Wortlaut-Beleg** (Zitat aus der Quelle) und URL.
   Abgeleitete Werte (etwa Rest = 100 minus Summe, Umrechnung in Mio.) sind als „abgeleitet“
   mit Rechenweg gekennzeichnet.
5. **`abschnitt_titel` exakt wie in `beitraege-liste.json`** (Text der h2, HTML-Entities wie
   `&#8217;` als Zeichen). Nur Fachabschnitte (Index ≥ 2), nie Fazit, nie „Häufig gestellte
   Fragen“. Die Statistik muss inhaltlich zu dem Abschnitt passen.
6. **Formen:** `torte` für Anteile (3 bis 6 Stücke; bei `einheit` „%“ Summe 100 ± 0,5),
   `saeulen` für Zeitreihen und Stufen (höchstens 8, kurze Labels wie Jahreszahlen),
   `balken` für Kategorien mit längeren Beschriftungen (höchstens 8). Mehrere `reihen` mit
   `umschalter.label` nur, wenn alle Reihen dieselben Labels haben (etwa Jahr, Einkommensgruppe).
7. **`einheit`** einheitlich je Diagramm: „€“, „%“, „Mio.“, „Mrd. €“, „Tsd.“, „Monate“,
   „Wochen“, „Jahre“, „Punkte“ oder „“ (leer). Keine gemischten Einheiten in einem Diagramm.
8. **Regler** nur, wenn ein Rechner aus der Allowlist die Frage wirklich rechnet:
   `regler: { label, min, max, schritt, start, einheit, formel: { typ: "rechner", rechner, eingabe, ausgabe, basis? }, ergebnis, ergebnisEinheit }`.
   `eingabe` muss ein Feld von `<Rechner>Params`, `ausgabe` ein Feld von `<Rechner>Result` sein.
   Kein Regler mit dem Rechner `rentenbesteuerung` (er rechnet den Besteuerungsanteil falsch).
9. **Texte:** `titel` ist eine Aussage (höchstens 70 Zeichen, keine Doppelpunkte am Anfang),
   `untertitel` sagt, was das Diagramm zeigt, `hinweis` ordnet in ein bis zwei Sätzen ein und
   darf weitere belegte Zahlen nennen. `quelle`: `name` (Herausgeber, Titel oder Paragraf),
   `url` (https, die genaue Fundstelle), `stand` (Datum oder Jahr der Quelle, nicht das Abrufdatum).
10. **Gesperrte Quellen:** Die Handbuchseiten des Bundesfinanzministeriums (lsth/esth) und
    manche PDF-Downloads liefern nur eine Radware-Sperrseite oder 404. Dann eine andere
    Fundstelle suchen (Pressemitteilung, Tabelle, Gesetzestext). Bei gespeicherten PDFs kann der
    Text mit `node tools/pdf-text.mjs <datei.pdf> [von] [bis]` extrahiert werden.
11. **Arbeitsweise:** Beitragstext lesen → Zahlenaussagen je Fachabschnitt notieren → je Beitrag
    ein bis zwei Statistik-Ideen mit möglicher Primärquelle → Quellen abrufen (WebFetch,
    WebSearch; höchstens rund 40 Abrufe je Stapel) → JSON schreiben → Prüfer laufen lassen und
    Fehler beheben, bis er „geprüft“ meldet → Protokoll schreiben.
12. **Ergebnisbericht** am Ende (kurz): Zahl der Beiträge und Statistiken, Beiträge ohne
    Statistik mit Grund, Werte, die abgeleitet oder aus Sekundärquellen stammen, offene Zweifel.

## Was du nicht tust

- Kein `node tools/statistik-stapel.mjs NN` ohne `--ohne-import`, kein `faden-import.mjs`.
- Kein `git commit`, kein `git add`, keine Änderung an Code, CSS, Komponenten oder anderen
  Inhaltsdateien.
- Keine Zahlen aus dem Gedächtnis, keine Schätzungen, keine „typischen Werte“.
