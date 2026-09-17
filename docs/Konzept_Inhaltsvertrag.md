---
title: "Inhaltsvertrag für den Faden"
subtitle: "Welche Felder der Faden je Inhaltstyp erwartet, wo sie im CMS liegen, wer sie erzeugt"
author: "Florian Frey"
date: "7. September 2026"
lang: de-DE
---

# Warum ein Vertrag

Der Faden zeigt jede Karte zweimal: als eigene Seite für Suchmaschinen und als Kapitel im Gespräch. Beides kommt aus demselben Datensatz. Damit das funktioniert, muss vorher feststehen, welche Felder ein Beitrag, ein Rechner, ein Begriff hat, wo sie im WordPress liegen und wer sie füllt. Dieses Dokument ist dieser Vertrag. Er gilt für drei Beteiligte:

- **das CMS** (`cms.finanzleser.de`): einzige Quelle der Wahrheit, ohne ACF, alles als Beitragstypen, Blöcke, Meta-Felder und Options;
- **das Content Studio** (Nicoles Werkzeug, spricht per REST): erzeugt und pflegt die Felder, teils automatisch, teils mit Freigabe;
- **das Frontend** (Next auf Netlify): liest per GraphQL und rendert beide Gesichter.

Grundsatz: **Nichts wird zweimal gepflegt.** Was sich aus dem Text ableiten lässt (Abschnitte, Inhaltsverzeichnis, Lesezeit, Begriffslinks), erzeugt der Server beim Rendern. Was Wissen braucht (Fragen, Antworten, Kurzfassung, Glossar-Erklärung), erzeugt das Studio als Entwurf, die Redaktion gibt frei. Was Konfiguration ist (Wächter-Regeln, Kassensturz-Fragen), liegt in Options und wird selten angefasst.

# Was heute schon da ist

Der Bestand ist besser strukturiert, als es von außen aussieht. Das Studio schreibt seit Juni nach einer festen Konvention, das Frontend liest sie bereits:

| Element | Wo es heute liegt | Wer es erzeugt | Zustand |
|---|---|---|---|
| Titel, Beschreibung | Im Content: `<h1>` am Anfang, dann ein `<p>` | Studio | fertig, `extractArticleHeader` liest es |
| Abschnitte | `<h2>` im Content | Studio | fertig, ergibt Kette und Inhaltsverzeichnis |
| Häufige Fragen | Frage-Antwort-Paare im Content | Studio | fertig, `ArticleContent` parst sie |
| Spielboxen (Mythos, Quiz, Schätzen, Karte, Gewusst) | `<div data-finanzleser-gamification="…">` mit `data-gam-field` im Content | Studio | fertig, aber nur im Text, nicht adressierbar |
| Rechner, Vergleich, Checkliste, Dokumente im Beitrag | Gutenberg-Blöcke `finanzleser/*` mit `slug` | Studio | fertig |
| Untertitel, PDF | Post-Meta `beitrag_untertitel`, `beitrag_pdf` | Redaktion | fertig, seit Phase E ohne ACF |
| Rechner, Checkliste, Vergleich, Dokument, Anbieter | eigene Beitragstypen mit Meta | Redaktion, Studio (`upsert-checkliste`) | fertig; `upsert-checkliste` verlangt noch ACF-Funktionen und ist damit vermutlich gebrochen |
| Yoast-Titel, Beschreibung, Fokus-Keyword | Yoast-Meta, per Helfer-Plugin freigegeben | Studio | fertig |
| Rechner-Konfiguration (Grundfreibetrag, BBG, Mindestlohn …) | Options-Seite + `config/rates.json` | Redaktion | fertig, ist die Datenquelle der Wächter |

Der Faden braucht also keine Neuerfindung des Beitrags. Er braucht **sieben Ergänzungen** und **zwei neue Typen**.

# Die Ergänzungen am Beitrag

Alle als Post-Meta, per `register_post_meta` mit `show_in_rest`, über den WPGraphQL-Filter freigegeben (wie `beitrag_untertitel`). Der Faden liest sie über die kanonische Seite mit; sie stehen im HTML.

| Feld | Inhalt | Format | Quelle | Verwendung im Faden |
|---|---|---|---|---|
| `kurzfassung` | Leos Kurzfassung des Beitrags, drei bis fünf Sätze, mit Quellen | JSON `{ saetze: [], quellen: [] }` | Studio erzeugt, Redaktion gibt frei | Chip „Kurzfassung von Leo“ |
| `leo_fragen` | Je Abschnitt zwei bis drei Fragen mit Antwort und Quelle („Dazu wird oft gefragt“) | JSON `[{ abschnitt: "<h2-id>", frage, antwort, quellen: [] }]` | Studio erzeugt aus dem Abschnitt, Leos Bedingungswissen liefert die Antwort, Redaktion gibt frei | Weiterlesen mit Leo, Antwort klappt im Abschnitt auf; auch im HTML, also indexierbar |
| `glossar_begriffe` | Zwei bis drei Begriffe, die der Beitrag voraussetzt | JSON `["schliessanlage", "haftpflicht"]` (Slugs des Glossars) | Studio schlägt vor, Redaktion bestätigt | Vorbelegung der Glossar-Sitzung |
| `leo_einwuerfe` | Was Leo zu diesem Beitrag einwerfen darf: Statistik, Anbieter, Spiel, Checkliste, mit Position | JSON `[{ nach: "<h2-id>", typ, slug, grund }]` | Redaktion (Standard: automatisch aus verknüpften Tools) | Einwürfe an der richtigen Stelle der Kette, höchstens zwei |
| `dazu_passt` | Drei verwandte Inhalte | JSON `[{ typ, slug }]` | Studio (Ähnlichkeit), Redaktion kann tauschen | Block „Dazu passt“ |
| `lebenslage` | Wofür der Beitrag relevant ist | Taxonomie `lebenslage` (Kind, Haus, Hund, Heirat, Ruhestand, Trennung, Jobverlust) | Studio schlägt vor | Lebensereignis-Karten, „Leo fragt“ |
| `wächter_regeln` | Welche Werte diesen Beitrag berühren | JSON `["grundfreibetrag", "bbg"]` (Schlüssel aus der Rechner-Konfiguration) | Studio erkennt Zahlen im Text | Streifen „Diese Zahl ändert sich, soll ich Bescheid geben?“ |

Was **nicht** gespeichert wird, weil der Server es beim Rendern erzeugt: Abschnitts-IDs, Inhaltsverzeichnis, Lesezeit, Begriffslinks im Text, JSON-LD (Article, FAQPage, SoftwareApplication für Rechner), Sitemap-Eintrag.

# Die neuen Typen

## Glossar (`glossar`)

Ein Beitragstyp mit eigener Adresse je Begriff (`/glossar/<slug>/`), damit jeder Begriff eine Seite und ein Kapitel ist.

| Feld | Inhalt | Quelle |
|---|---|---|
| Titel | Der Begriff in der Schreibweise, die auf der Seite steht | Studio |
| `varianten` | Schreibweisen und Flexionen, die im Text erkannt werden (Haftpflicht, Haftpflichtversicherung, Privathaftpflicht) | Studio erzeugt, Redaktion ergänzt |
| Inhalt | Erklärung in zwei bis drei Sätzen | Studio erzeugt, Redaktion gibt frei |
| `quelle` | Bedingungswerk, Gesetz oder Seite | Studio |
| `ratgeber`, `tool` | Verknüpfter Ratgeber, verknüpftes Finanztool | Studio schlägt vor |
| `frage`, `antwort` | Eine interessante Frage an Leo mit vorbereiteter Antwort | Studio erzeugt |
| `wappen` | Zu welchem Themen-Wappen der Begriff zählt | Redaktion |
| Taxonomie `rubrik` | Finanzen, Versicherungen, Steuern, Recht | Studio |

Der Server verlinkt Begriffe beim Rendern: Wortanfang plus Flexion, höchstens sechs Links je Kette, nie in Überschriften, Tabellenköpfen, Zitaten und Anzeigen. Die Redaktion setzt keine Links von Hand.

Startbestand: Das Studio zieht Kandidaten aus dem Korpus (Häufigkeit im Bestand, Fachbegriffe aus den Bedingungswerken, die 56 Begriffe des Prototyps als Muster). Ziel für den Start: rund 300 Begriffe, freigegeben in Stapeln zu 50. (Stand 7. September: 587 Begriffe im Klon, siehe unten.)

## Spiel (`spiel`)

Die Spielboxen bleiben, wie das Studio sie heute schreibt, zusätzlich adressierbar. Ein Beitragstyp mit `typ` (mythos, quiz, schaetzen, karte, gewusst, finanzwort, rubbellos), den Feldern der jeweiligen Box als Meta (dieselben `data-gam-field`-Felder, die es heute gibt), `punkte`, `wappen` und optional `datum` für tägliche und wöchentliche Formate.

- **Finanzwort des Tages**: eine Liste aus dem Glossar (Begriff, Datum), sechs Buchstaben lang oder weniger; das Studio füllt sie ein Quartal im Voraus.
- **Wochen-Quiz**: fünf Fragen aus den Artikeln der Woche, das Studio erzeugt sie donnerstags aus den neuen Beiträgen, die Redaktion gibt frei.
- **Los des Tages, Gewusst?**: eine Zahl mit Quelle, aus dem Glossar oder der Rechner-Konfiguration.

Im Beitrag bleibt der Verweis auf ein Spiel ein Block (`finanzleser/spiel` mit `slug`), damit das Studio nicht zwei Wege pflegen muss.

# Konfiguration in Options

Nach dem Muster der Site-Settings (WP-Options, eigener REST-Endpunkt, kein ACF):

| Option | Inhalt | Wer pflegt |
|---|---|---|
| `faden_waechter_regeln` | Liste der Wecker: Schlüssel, Name, Beschreibung, Auslöser (Wert aus der Rechner-Konfiguration oder Datum), Kanal-Vorgaben | Redaktion, selten |
| `faden_kassensturz` | Die acht Fragen mit Optionen, Ikonen und Bedingungen; die Lückenregeln mit Texten und Zielen | Redaktion, mit Freigabe |
| `faden_leo_fragt` | Fragen für die Randspalte je Auslöser (Rubrik, Lebenslage, Anzahl Schritte) | Redaktion |
| `faden_lebensereignisse` | Je Ereignis die Schritte in Phasen mit Werkzeugen und Weckern | Redaktion |
| `faden_level` | Schwellen und Belohnungen | Redaktion |

# Was das Content Studio können muss

Das Studio spricht heute per REST mit dem CMS und nutzt das Helfer-Plugin. Für den Faden kommen dazu:

1. **Entwürfe erzeugen** für `kurzfassung`, `leo_fragen`, `glossar_begriffe`, `dazu_passt`, `wächter_regeln` je Beitrag, im Stapel für den Bestand und einzeln beim Speichern. Der Text kommt aus dem Beitrag, die Antworten auf Fragen aus Leos Bedingungswissen (derselbe Dienst, den die Seite nutzt), immer mit Quelle. Ohne Quelle keine Antwort, sondern eine Markierung für die Redaktion.
2. **Glossar pflegen**: Kandidaten sammeln, Erklärung entwerfen, Varianten ableiten, Freigabe in Stapeln. Endpunkt `upsert-glossar`.
3. **Spiele als Typ anlegen** statt nur als Div: Endpunkt `upsert-spiel`; die bestehenden Divs bleiben gültig und werden einmalig in Spiel-Einträge überführt.
4. **Freigabe sichtbar machen**: Jedes erzeugte Feld trägt `status: entwurf | freigegeben` und `erzeugt_am`. Das Frontend zeigt nur Freigegebenes. So kann das Studio den ganzen Bestand vorbelegen, ohne dass etwas Ungeprüftes erscheint.
5. **Helfer-Plugin bereinigen**: `upsert-checkliste` ohne ACF-Funktionen, neue Endpunkte `upsert-glossar`, `upsert-spiel`, `faden-felder` (schreibt die sieben Meta-Felder eines Beitrags in einem Aufruf).

# Migration des Bestands

Für die 1026 Beiträge ist nichts umzuschreiben, was die Kette betrifft; Abschnitte und FAQ liegen schon in der richtigen Form. Der Ablauf auf dem Klon `cms-dev`:

1. Plugin `finanzleser-faden` (Typen, Meta, Options, GraphQL-Freigabe) einspielen; Prüfung: GraphQL kennt die Felder, das Frontend baut weiter.
2. Glossar-Startbestand aus dem Korpus erzeugen, 300 Begriffe als Entwurf; Redaktion gibt in Stapeln frei.
3. Studio-Stapellauf über alle Beiträge: Kurzfassung, Fragen je Abschnitt, Begriffe, Dazu passt, Wächter-Regeln; alles als Entwurf.
4. Spiel-Divs in Spiel-Einträge überführen (Skript), Block im Beitrag setzen.
5. Stichprobe: 30 Beiträge im Faden lesen, Fragen und Kurzfassungen prüfen, Glossar-Links zählen.
6. Freigabe durch die Redaktion, dann derselbe Ablauf auf der Produktion; die Felder sind additiv, das alte Frontend ignoriert sie, es gibt keinen Zeitpunkt, an dem etwas kaputt ist.

Beim Livegang des Fadens ändert sich an Adressen nichts. Jede Kette, jeder Rechner, jeder Begriff behält oder bekommt eine kanonische Seite; die Weiterleitungskaskade bleibt; `verify:redirects` läuft vor jedem Merge. Neu hinzu kommen nur Seiten (Glossar, Spiele, Lebensereignisse), keine fallen weg.

# Was der Prototyp daraus liest

Der Prototyp bekommt einen Export (`tools/faden-export.mjs`), der aus dem Klon per GraphQL genau diese Felder holt und in die Strukturen des Prototyps schreibt (`ARTIKEL`, `GLOSSAR`, `kaesten`). So sehen wir den Faden mit echten Texten, bevor eine Zeile Next-Code entsteht, und prüfen den Vertrag am Material statt am Papier.

# Entscheidungen, die noch offen sind

- **Antworten vorgenerieren oder live erzeugen?** Empfehlung: vorgenerieren und freigeben (Qualität, Kosten, Indexierbarkeit); nur „Weiterfragen“ läuft live über Leo.
- **Wer gibt frei?** Vorschlag: Nicole im Studio; Andreas nur bei Bedingungsfragen der Partner.
- **Glossar als Kette im Faden ja oder nein** (offen seit Runde 5): Der Vertrag geht von ja aus, jeder Begriff ist eine Seite.
- **Zugang zu Leos Dienst aus dem Studio**: braucht einen API-Schlüssel des Heroku-Dienstes; klären mit Finconext.

# Stand im Klon (7. September 2026)

Der Vertrag ist auf cms-dev.finanzleser.de umgesetzt und mit Inhalten gefüllt. Auf dem Klon wird **direkt veröffentlicht**, ein Freigabelauf ist dort nicht nötig; nur das Produktions-CMS bleibt unangetastet. Der Freigabe-Status (`entwurf` / `freigegeben`) bleibt im Schema, damit das Content Studio ihn später auf Produktion nutzen kann.

| Inhalt | Menge | Quelle im Repo | Import |
|---|---|---|---|
| Beitragsfelder (Kurzfassung, Fragen je Abschnitt, Glossar-Vorbelegung, Einwürfe, Dazu passt, Wächter-Werte) | alle 202 Beiträge: 202 Kurzfassungen zu je fünf Sätzen, 808 Fragen mit Antwort und Quelle (vier je Beitrag), Glossar-Vorbelegung je Beitrag; Einwürfe, Dazu passt und Wächter-Werte bei den 10 Pilot-Beiträgen | `docs/inhalte/felder-pilot.json` (10), `felder-batch-01.json` bis `felder-batch-17.json` (192) | `node tools/faden-import.mjs felder …` |
| Glossar (Erklärung, Antwort, Quelle, Varianten, Rubrik, Wappen, Ratgeber, Tool) | 587 Begriffe mit 2.094 Varianten, alle veröffentlicht, keine Variante doppelt vergeben (Rubriken: Versicherungen 174, Finanzen 153, Recht 132, Steuern 128) | `docs/inhalte/glossar-prototyp.json` (56), `glossar-pilot.json` (22), `glossar-batch-01.json` bis `glossar-batch-17.json` (509) | `… glossar …` |
| Spiele (Finanzwort 14 Tage, Wochen-Quiz 37 und 38, Mythos 7, Schätzen 7, Gewusst 7, Los 7, Begriffskarten 5) | 49 Einträge mit Datum, Punkten, Wappen | `docs/inhalte/spiele-pilot.json` | `… spiele …` |
| Options (Wächter-Regeln 10, Kassensturz mit Fragen/Lücken/Score, Leo fragt 8, Lebensereignisse 4, Level 3) | 5 Options | `docs/inhalte/faden-options.json` | `… options …` |

Die 192 Beiträge nach dem Pilot wurden in 17 Stapeln zu je zwölf Beiträgen geschrieben und importiert: `node tools/faden-text.mjs <slugs>` legt die Texte lesbar in `docs/inhalte/text/_stapel.txt`, die Felder und Glossarbegriffe entstehen als `felder-batch-NN.json` und `glossar-batch-NN.json`, `node tools/faden-stapel.mjs NN` prüft und importiert. Die Prüfung ist der eigentliche Vertrag in ausführbarer Form: Abschnittstitel müssen exakt dem h2 des Beitrags entsprechen (`beitraege-liste.json`), Glossar-Verweise müssen auf einen Begriff aus einer der JSON-Dateien zeigen, Werkzeug-Verweise (`rechner/…`, `checkliste/…`, `vergleich/…`) auf einen Slug im CMS, und keine Glossar-Variante darf zweimal vorkommen. Was die Prüfung ablehnt, wird korrigiert, nie übergangen.

Regeln, die beim Schreiben galten und für das Studio weiter gelten:

- **Abschnitts-IDs** sind `heading-<n>` über alle h2 des Beitrags gezählt (so vergibt sie das Frontend in `addHeadingIds`). Die Fragen sitzen nur in Fachabschnitten, nie in Kicker, Einleitung, Fazit oder FAQ.
- **Jede Antwort hat eine Quelle** (Paragraf, Tabelle, Urteil oder der Beitrag selbst). Zahlen sind die des Beitrags (Stand 2026).
- **Fehler im Beitrag werden nicht übernommen.** Wo der Beitrag einem Gesetz widerspricht (Beispiele: Beitragsbemessungsgrenze 2026 noch nach West und Ost getrennt, Versicherungsteuer auf Lebensversicherungen, Nachtzeitklausel mit vertauschten Uhrzeiten, „Pflicht“ zur Pferdehaftpflicht), nennt die Kurzfassung den richtigen Stand. Marktzahlen und Gesetzesvorhaben, die sich nicht prüfen lassen (Zinssätze, Tarifpreise, Referentenentwürfe), tragen den Zusatz „laut Beitrag“, damit Leo sie nicht als eigenes Wissen ausgibt.
- **Glossar-Varianten sind eindeutig.** Ein Wort wie „Grenzsteuersatz“ oder „Freistellungsauftrag“ gehört zu genau einem Begriff; beim Zusammenführen der Stapel wurden 14 Doppelvergaben aus den frühen Dateien bereinigt (die Variante bleibt beim spezifischeren Begriff). Zu allgemeine Wörter („Werktag“, „Bedingungen“) sind keine Varianten.
- **Links zeigen nur auf Bestehendes.** Jeder `{typ, slug}` wird vor dem Import gegen Beiträge, Rechner, Checklisten, Vergleiche und Glossar geprüft; was fehlt, bleibt leer statt zu raten.
- **Wächter-Werte** sind Pfade in `config/rates.json` (`lohnsteuer.grundfreibetrag`, `unterhalt.tabelle`, `rente.rentenwert_ab_01jul_2026` …). Ändert sich der Wert, weiß der Wächter, welche Beiträge und Rechner betroffen sind.
- **Spielfelder** folgen den Feldnamen der heutigen Boxen (`aussage/stimmt/aufloesung`, `frage/a/b/c/richtig/erklaerung`, `frage/min/max/antwort/einheit/aufloesung`, `begriff/erklaerung`, `text`), damit das Frontend sie ohne Umbau rendern kann.

Beim Schreiben aufgefallen, noch nicht behoben: `config/rates.json` führt den Kinderfreibetrag mit 9.540 Euro und den Besteuerungsanteil 2026 mit 83 Prozent; die Beiträge und das Gesetz sagen 9.756 Euro und 84 Prozent. Das betrifft den Kindergeld-Rechner auf der Live-Seite und gehört in einen eigenen Fix.

# Was der Prototyp heute liest (7. September 2026)

`node tools/faden-export.mjs` zieht alle 202 Beiträge samt Feldern (1.318 Abschnitte, 808 Fragen, 808 FAQ-Paare), die 587 Glossarbegriffe, die 49 Spiele und die 5 Options aus cms-dev in den Prototyp (`python3 docs/prototype/build.py` danach). Damit zeigt der Prototyp echte Ketten: Kicker und Teaser als Vorspann, die Einleitung, jeden Fachabschnitt mit Text, Spielboxen, Werkzeugen und den Fragen aus `leo_fragen`, dann FAQ aus dem Yoast-Block, Fazit, „Dazu passt“ aus `dazu_passt` (klickbar, wenn der Zielbeitrag exportiert ist), die Glossar-Vorbelegung, die Kurzfassung als Leo-Antwort und Leos Einwürfe an der Stelle, die `leo_einwuerfe.nach` nennt. Startvorschläge, Kassensturz, Leo fragt, Wächter-Regeln, Lebensereignis „Kind“, Level, Wochen-Quiz, Finanzwort, Zahl des Tages, Mythos und Gewusst kommen aus Spielen und Options. Was noch aus dem Prototyp selbst stammt: Rechner außer dem Unterhaltsrechner (Platzhalterkarten mit Sprung), Anbieter-, Vergleichs- und Dokumentkarten, das Los des Tages und die Wappen.

Der Datenstand vom 7. September macht aus dem Prototyp 6,4 MB (`leo-faden.html`), als Artifact 6,6 MB; die Grenze des Artifact-Dienstes liegt bei 16 MB. Der automatische Durchlauf (`pw-daten.mjs`, Playwright) prüft daran Kette, Fragen, Spiele, Werkzeuge, Glossar-Links, Kassensturz, Quiz, Finanzwort und „Leo fragt“ und lief mit dem vollen Bestand ohne Konsolen- oder Seitenfehler.
