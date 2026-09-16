# Vergleiche pflegen — Anleitung für die Redaktion

> Stand 15.09.2026. Gilt für Vergleiche auf der financeads-API (eigener Rechner).
> Fremd-Embeds (mr-money, CHECK24, Covomo …) laufen wie bisher über den Einbindungstyp
> „iframe" / „Roh-Embed" / „Script".

## Was ein Vergleich im Backend ist

Ein Eintrag im Menü **Vergleiche** (Custom Post Type `vergleich`). Er hat:

| Feld | Zweck |
|---|---|
| **Titel** | Endet auf „… Vergleich" (z. B. „Tagesgeld Vergleich"); das Frontend zeigt „Tagesgeld". |
| **Textauszug** | Die Beschreibung: erscheint unter dem Titel, in Google-Snippets, auf der Übersicht und in Leos Empfehlungen. Zwei bis drei Sätze. |
| **Block „Vergleich-Quelle (Embed-Config)"** | Pflicht. Bestimmt, woher die Angebote kommen (siehe unten). |
| **Weitere Blöcke** | Alles, was **vor** dem Quelle-Block steht, erscheint über der Liste (Einleitung, worauf es ankommt); alles **danach** darunter (Erklärungen, Statistik-Blöcke, FAQ). |
| **Leo-Fragen** (Seitenleiste) | Drei bis acht Fragen mit Antwort und Quelle. Erscheinen unter der Liste als „Dazu wird oft gefragt" und in den strukturierten Daten (FAQPage). |

## Der Block „Vergleich-Quelle" für financeads

1. Block einfügen, Einbindungs-Typ **„financeads-API (eigener Vergleichsrechner)"**.
2. **Kategorie** wählen. Hinter jeder Kategorie steht, was sie liefert:
   - ohne Zusatz: Konditionen und Beiträge (Tarifliste mit Bestwert, Säulen, Sortierung)
   - „(Anbieterliste, keine Beiträge)": financeads liefert bei diesen Versicherungen nur
     Name, Versicherer, Logo, Prüfsiegel und Link — die Seite zeigt eine Anbieterliste.
     Leistungsmerkmale bitte als **Statistik-Block „Vergleichstabelle"** über der Liste setzen.
   - „Endpunkt zurzeit defekt": financeads liefert nichts; die Seite zeigt einen Hinweis und
     bleibt aus dem Google-Index, bis der Endpunkt repariert ist.
3. **Variante · …** (nur bei Krediten und Bausparen): fester Filter für die wenigen Seiten,
   die es schon vor dem Umbau als eigene URLs gab und die financeads selbst als eigene Rechner
   führt — Autokredit, Minikredit. 🚨 Grundsatz seit 15.09.2026: **je financeads-Kategorie
   ein Vergleich**, alles andere (Zielgruppe, Kartenart, Hund/Katze) ist ein Umschalter im
   Rechner, keine eigene Seite. Wer doch eine Variante anlegen will, prüft vorher die
   Produktmenge: `node --experimental-strip-types tools/financeads-vergleiche.mjs pruefen`.
4. **Voreinstellung · …**: die Werte, mit denen die Seite startet (Anlagebetrag, Laufzeit,
   Geldeingang …). Leer = Standard. Die Chips darunter zeigt der Rechner automatisch.
5. **Eigene Chips (JSON)**: nur, wenn die Standard-Chips nicht passen — Beispiel Minikredit:
   `{"loan":[300,500,1000,1500],"duration_months":[1,2,3,6]}`.
6. **Hinweis**: ein Satz unter der Liste, wenn die Redaktion etwas ergänzen will.

Veröffentlichen. Die Seite erscheint unter `/finanztools/vergleiche/<slug>`, in der Übersicht
(Rubrik nach Kategorie), in der Sitemap, im Werkzeugindex des Fadens (Sprungleiste, Glossar,
Kassensturz) und im Block „Vergleich" für Beiträge.

## Woher die Zahlen kommen — und wann sie sich ändern

Die Angebote holt nicht die Seite, sondern ein Lauf **zweimal täglich** (06:00 und 18:00,
GitHub Actions → `tools/financeads-refresh.mjs`). Er legt je Vergleich eine Momentaufnahme in
WordPress ab (**Vergleiche → Datenstand** zeigt Anzahl, Stand, geladen) und frischt das
Frontend auf. Ein neu angelegter Vergleich zeigt bis zum nächsten Lauf „Die Angebote werden
gerade geladen". Wer nicht warten will: Lauf manuell auslösen (Actions → „financeads-Refresh"
→ Run workflow, optional nur ein Slug).

„Stand" auf der Seite ist das jüngste Konditionsdatum von financeads, nicht die Uhrzeit des
Laufs. Fällt financeads aus, bleibt der letzte gute Stand stehen.

## Was die Redaktion NICHT tun muss

- Keine Zinsen, Beiträge oder Anbieter eintragen — alles kommt aus der API.
- Keine Affiliate-Links setzen — jede Zeile trägt ihren Partnerlink (`rel="sponsored"`).
- Keine Cookies/Consent bedenken — der eigene Rechner lädt nichts von Dritten im Browser;
  der Sichtkontakt wird serverseitig an financeads gemeldet.

## Wenn etwas fehlt

- **Kategorie fehlt in der Liste** → sie steht nicht in `lib/financeads/registry.ts`
  (Entwickler). Die Liste im Editor ist ein generierter Zwilling dieser Datei.
- **Anbieter fehlt** → financeads führt ihn für unser Werbeflächen-Konto (adspace 24770)
  nicht; das ist eine Frage an financeads, nicht ans CMS.
- **Seite zeigt „wird gerade überarbeitet"** → Endpunkt bei financeads defekt (Stand 15.09.:
  Auslandskrankenversicherung). Nichts tun; heilt beim nächsten Lauf, sobald financeads
  repariert hat.
