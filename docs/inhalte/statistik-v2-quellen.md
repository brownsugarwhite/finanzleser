# Quellen der Statistik-Datensätze (Design A v2)

Belege zu `docs/inhalte/statistik-v2-*.json`. Jede Zahl in den fünf Vorlage-Ratgebern steht
hier mit Herkunft und Abrufdatum. Recherchiert am **11. September 2026**.

Grundsatz: **keine Zahl ohne Quelle mit https-URL und Stand.** Wo eine Zahl aus
veröffentlichten Summen berechnet ist, steht das im `hinweis` des Blocks — nicht versteckt.

## Primärquellen

| Quelle | Verwendet für | Stand |
|---|---|---|
| [GDV, Statistiken zur deutschen Versicherungswirtschaft](https://www.gdv.de/resource/blob/152652/dd6bd3e5c32eb6fbd132dc654673d16c/statistiken-zur-deutschen-versicherungswirtschaft-taschenbuch-data.pdf) | Beiträge, Leistungen, Schadenquote, Verträge und Schäden für Haftpflicht und Hausrat 2014–2024 | 17.09.2025 |
| [GDV, Hausratversicherung: Schäden je Gefahr](https://www.gdv.de/gdv/statistik/statistiken-zur-deutschen-versicherungswirtschaft-uebersicht/schaden-und-unfallversicherung/einzelgefahren-verbundenen-hausratversicherung-schadenentwicklung-151992) | Leistungen je Gefahr 2022–2024 | 17.09.2025 |
| [GDV, Einkommens- und Verbrauchsstichprobe 2023](https://www.gdv.de/gdv/medien/medieninformationen/versicherungsschutz-in-der-fuenfjahreserhebung-mehr-alltagsschutz-weniger-vorsorge-fuers-alter--198196) | Verbreitung der Versicherungsarten in Haushalten | 07.04.2026 |
| [GDV, VHB 2022 Quadratmetermodell](https://www.gdv.de/resource/blob/6114/458ab7b03401b2bb3bd22b707a5ec6cc/allgemeine-hausrat-versicherungsbedingungen-vhb-2022-quadratmetermodell--data.pdf) | Unterversicherungsverzicht, Neuwert, Obliegenheiten nach dem Einbruch | 2022 |
| [GDV, AVB PHV 2020](https://www.gdv.de/resource/blob/6242/1fe6d0497c64d06bd8aab00f1cf98fac/09-avb-fuer-dieprivathaftpflichtversicherung-avb-phv-gdv-2020-data.pdf) | Deckungssumme, Forderungsausfall, Gefälligkeitsschäden | 2020 |
| [BMG, Zahlen, Daten und Fakten zur Pflegeversicherung](https://www.bundesgesundheitsministerium.de/fileadmin/Dateien/3_Downloads/Statistiken/Pflegeversicherung/Zahlen_und_Fakten/Zahlen-Fakten_Pflegeversicherung.pdf) | Versicherte, Leistungsbeziehende, Pflegegrade, Leistungsbeträge, Beitragssätze, Pflegewahrscheinlichkeit, Einrichtungen 2005–2023 | Juli 2026 |
| [Destatis, Pflegebedürftige nach Versorgungsart und Pflegegrad](https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Gesundheit/Pflege/Tabellen/pflegebeduerftige-pflegestufe.html) | Versorgungsformen Ende 2023 | 18.12.2024 |
| [vdek, Eigenbeteiligung in der stationären Pflege](https://www.vdek.com/presse/pressemitteilungen/2026/stationaere-pflege-eigenanteile-juli-2026.html) | Eigenanteil im Heim und seine Bestandteile | 14.07.2026, Stichtag 01.07.2026 |
| [Deutsche Rentenversicherung, Rentenstatistik 2025](https://jahresbericht.deutsche-rentenversicherung.de/artikel/in-zahlen-2025/) | Erwerbsminderungsrente: Zahlbeträge, Zugänge, Entwicklung seit 2013 | 2025 |
| [Destatis, Preise für Wohnimmobilien im 1. Quartal 2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_219_61262.html) | Häuserpreisindex, Preisentwicklung nach Kreistyp | 25.06.2026 |
| [Destatis, Grunderwerbsteuer der Länder](https://www.destatis.de/DE/Presse/Pressemitteilungen/Grafiken/Newsroom/2024/_Interaktiv/20240222-grunderwerbssteuer-bundeslaender.html) | Steuersätze 3,5 bis 6,5 Prozent | 2024 |
| [Deutsche Bundesbank, Zinssätze für das Neugeschäft](https://www.bundesbank.de/resource/blob/615036/9f4efe4e8f601ff991ec86223910816f/472B63F073F071307366337C94F8C870/s510athyp-data.pdf) | Bauzinsen 2026 von Monat zu Monat | Juli 2026 |
| Gesetze im Internet (§§ 11, 14, 19, 30, 172 VVG · §§ 15, 18, 45b SGB XI · § 43 SGB VI · §§ 489, 491a, 873 BGB) | Fristen, Definitionen, Verfahren | 2026 |

## Sekundärquellen

Im Frontend als „Sekundärquelle“ ausgewiesen (`quelle.sekundaer: true`).

| Quelle | Verwendet für | Stand |
|---|---|---|
| [MORGEN & MORGEN, M&M Rating Berufsunfähigkeit 2026](https://morgenundmorgen.com/magazin/mm-marktblick/m-m-marktblick-berufsunfaehigkeit-2026/) | Ursachen der Berufsunfähigkeit | 05.05.2026 |
| [Verbraucherzentrale, Hausratversicherung](https://www.verbraucherzentrale.de/wissen/geld-versicherungen/weitere-versicherungen/hausratversicherung-was-sie-wissen-muessen-11360) | Faustregel Versicherungssumme je Quadratmeter | 2026 |
| [Verbraucherzentrale, Privathaftpflichtversicherung](https://www.verbraucherzentrale.de/wissen/geld-versicherungen/weitere-versicherungen/privathaftpflichtversicherung-schutz-vor-hohen-kosten-13840) | Abwägung Selbstbehalt | 2026 |

## Zahlen aus dem Beitrag selbst

Acht Stellen der fünf Ratgeber standen schon als HTML-Tabelle oder Aufzählung im Text und
wurden in eine Form überführt. Ihre Zahlen stammen aus der **redaktionellen
Marktbeobachtung** — sie standen dort bereits als Aussage und sind mit der Umstellung weder
neu noch verändert worden.

| Beitrag | Was umgestellt wurde | Neue Form |
|---|---|---|
| Privathaftpflicht | Beiträge je Personengruppe | Spannen |
| Hausrat | Jahresbeitrag nach Stadt | Balken |
| Berufsunfähigkeit | Monatsbeitrag nach Berufsgruppe | Balken |
| Berufsunfähigkeit | Ausgang der Anträge (75–80 / 15–20 / 3–5 %) | Anteilsleiste |
| Baufinanzierung | Zinssatz nach Zinsbindung | Vergleichstabelle |
| Pflege | Beitragssatz nach Kinderzahl | Balken |
| Pflege | Leistungsbeträge je Pflegegrad | Vergleichstabelle |
| Pflege | Staffelung des Zuschusses nach Aufenthaltsdauer | Säulen |

🚨 Zwei Anmerkungen dazu:

- Die **Leistungsbeträge je Pflegegrad** standen im Beitrag mit den Werten von 2025
  (stationär 770 / 1.262 / 1.775 / 2.005 Euro). Der Block nutzt die Werte des BMG-Stands
  Juli 2026 (805 / 1.319 / 1.855 / 2.096 Euro).
- Die **Staffelung des Zuschusses** war im Beitrag als „Jahre 1-12: 15 %, Jahre 13-24: 30 %"
  angegeben. Der vdek zählt Aufenthalts**jahre**: 15 Prozent im ersten, 30 im zweiten, 50 im
  dritten und 75 ab dem vierten. Der Block folgt dem vdek.

Beides sollte die Redaktion gegenlesen.

## Eigene Berechnungen

Transparent gemacht, jeweils im `hinweis` des Blocks:

- **Ø Beitrag je Vertrag** = Beitragseinnahmen ÷ Verträge (GDV)
- **Ø Schadenhöhe** = Leistungen ÷ Anzahl Schäden (GDV)
- **Schäden je 100 Verträge** = Schäden ÷ Verträge × 100 (GDV)
- **Anteile im Kreisdiagramm Hausrat** = Leistungen je Gefahr ÷ Summe (GDV)
- **Anteile im Eigenanteil** = Bestandteil ÷ 3.364 € (vdek)
- **Monatsrate, Zinskosten und Restschuld** (Baufinanzierung) = Annuitätenformel mit
  2 Prozent Anfangstilgung. Nachgerechnet, nicht geschätzt.

## Was bewusst NICHT übernommen wurde

**Die Zahlen des Design-Handoffs sind Blindtext.** „Ø der Partner“, „Partner-Bestand
Finconext“, die Tarifstufen 46/68/112 Euro — das ist erfundene Fülldatenlage aus
`docs/design_handoff_finanzleser_faden/`. Übernommen wurden Form, Maße, Farben und Zeiten,
nie die Werte. Sie stehen weiterhin in `lib/statistik/handoffBeispiele.ts`, ausschließlich
für den A/B-Vergleich im Schaukasten.

**Keine erfundenen Tarifvergleiche.** Der Handoff zeigt eine Tabelle „Drei Tarifstufen
unserer Partner“ mit konkreten Beiträgen. Solche Zahlen gibt es öffentlich nicht; sie
müssten aus dem Partnerbestand kommen. Die Vergleichstabellen hier zeigen deshalb belegbare
Dinge: Branchenkennzahlen im Zeitvergleich, Leistungsbeträge nach Pflegegrad, die drei Wege
der Einkommenssicherung, die Wirkung eines Zinsprozentpunkts.

## Gegenprobe

```bash
node tools/statistik-v2-pruefen.mjs
```

Prüft Summen, Zeilenlängen, Wertebereiche, Quellenangabe mit https-URL und Stand, den
Zielabschnitt (muss ein Fachabschnitt sein, nicht Fazit oder FAQ) und den Rundlauf über
base64. Nutzt dafür die echten Regeln aus `lib/statistik/schema.ts`.
