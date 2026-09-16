# Recherche: financeads-API-Gateway — Übergabe

> Stand: **2026-09-15**. Reine Recherche, **kein Projektcode geändert**.
> Alle Zahlen sind live gemessen, nicht geschätzt.
> Nächster Schritt steht ganz unten unter „Erster Schritt in der neuen Session".

---

## 1. Warum das Ganze

22 unserer 43 Vergleich-CPTs hängen an `tools.financeads.net`. Dieser Host ist seit
ca. 22.07.2026 **TCP-tot** (am 15.09. erneut gemessen: Timeout). financeads hat die
Plattform umgestellt und bietet jetzt ein **API-Gateway** an, mit dem sich eigene
Vergleichsrechner bauen lassen — statt fremde iframes einzubetten.

Der eigentliche Hebel ist aber nicht die Reparatur:

- Alle Embeds stecken heute hinter der Zwei-Klick-Consent-Schranke `externalMedia`
  (`components/vergleich/VergleichEmbed.tsx:48`). Wer nicht zustimmt, sieht einen
  Platzhalter — also die Mehrheit.
- iframe-Inhalt ist für Google unsichtbar. Eigenes Markup ist indexierbar.

Eigene Rechner rendern serverseitig **ohne Consent**; zustimmungspflichtig wird erst
der Klick nach draußen.

---

## 2. Zugänge — wo was steht

| Was | Wo | Wert |
|---|---|---|
| Partner-/User-ID | Dashboard oben rechts im Benutzermenü | `18407` — **von der API nicht gebraucht** |
| API-Key | `dashboard.financeads.net` → Kopfzeilen-Knopf „API Gateway" (SSO) → Menü **Api-Keys** (`https://api.financeads.net/affiliate/api_keys`) | „Api-Key 1", 35 Zeichen |
| **adspace** | Dashboard → **Mein Konto → Meine Werbeflächen** (`/publisher/meinkonto/werbeflaeche`), Spalte WFID | **`24770`** (Finanzleser.de, Status „akzeptiert") |

Steuerzettel.de = WFID 23651, deaktiviert.

> 🚨 **Korrektur zur Memory-Notiz vom 05.08.2026.** Dort stand, `wf=24770` liefere
> 0 Ergebnisse und wir müssten auf eine adspace-ID vom Kunden warten. Für die API ist
> das falsch: **24770 ist die richtige adspace-ID**, am 15.09. mit echten Produktdaten
> verifiziert. Der offene Punkt „adspace-ID vom Kunden" ist erledigt, es fehlt nichts mehr.

### Zugriffsrechte
Freigeschaltet ist **nur „Produktdaten"** (Vergleichsrechner, Listen, Sonstiges).
**Programmdaten und Statistikdaten sind NICHT freigeschaltet** — Provisionshöhen und
Performance-Zahlen kommen also nicht über diese API.

---

## 3. Die API

- Basis: `https://api.financeads.net/api/v1/affiliate/…` (Laravel)
- Doku (Swagger): `https://api.financeads.net/documentation/v1/affiliate`
- Spezifikation: `.../affiliate.yaml` — 329 KB, OpenAPI 3.0
- Antwortformat durchgängig: `{ data, success, message }`

> 🚨 **Die Doku ist nur mit eingeloggter Browser-Session erreichbar.** `curl` bekommt
> 403, auch mit Browser-User-Agent. Holen über Claude-in-Chrome aus dem Seitenkontext
> von `api.financeads.net` heraus (dort greift das Session-Cookie
> `financeads_api_gateway_session`).

### Authentifizierung
`bearerAuth` (HTTP-Bearer) **oder** `api_key` als Query-Parameter. Keine User-ID nötig.
Jeder Aufruf braucht zusätzlich `adspace`.

### Routen (46)
- **25×** `GET /products/comparison/{kategorie}`
- **18×** `GET /list/…`
- `GET /comparison/configurations` — Farben/Schrift/Layout je adspace
- `GET /comparison/searchentry/create` — `search_default` (1 = Voreinstellung, 0 = vom
  Nutzer geändert) + `comparison_api_kennung`
- `POST /views/add` — `product_ids` (kommagetrennt) + `comparison_api_kennung`

Kategorien:
```
brokerageaccounts buildingsavings businessaccounts creditcards crowdinvesting cryptos
currentaccounts deviceinsurances dogliabilityinsurances fixedsavingsaccounts
funeralexpenseinsurances homeinsurances horseliabilityinsurances legalprotectioninsurances
liabilityinsurances loans mortgages pethealthinsurances rentaldepositinsurances roboadvisor
savingsaccounts supplementarydentalinsurances taxsoftware termlifeinsurances
travelhealthinsurances
```

Gemeinsame Parameter: `api_key adspace country_iso2 sections[] commission limit`

> **`commission` ist die Geld-Stellschraube:** `1` = bezahlte Produkte, `0` = unbezahlte,
> `0,1` = alle. **Standard ist „nur bezahlte".** Das ist die Abwägung zwischen Umsatz und
> redaktioneller Vollständigkeit — bewusst setzen, nicht dem Standard überlassen.

### Antwortstruktur je Produkt
```
data: { ads[], products[], product_groups[], notices[], filter_settings{} }

products[].base_data { id type name advertiser{} program{id,name,logo_urls}
                       landingpage_url tracking{url,target} view_url commission
                       region{} image_urls[] product_urls[] }
            details{} incentives[] ratings[] conditions{}
            calculated_conditions{ components{}, total{sum,currency,type} }
```

Zwei Felder entscheiden über die Machbarkeit, beide verifiziert:

- **`base_data.tracking.url`** — der Affiliate-Klicklink pro Produkt (64 Zeichen).
  Die Umsatzfrage ist damit beantwortet: ja, der Link kommt mit.
- **`calculated_conditions.total`** — financeads rechnet selbst. Beispiel Tagesgeld,
  5.000 € / 12 Monate: `{sum: 152.08, currency: "EUR", type: "benefit"}`.
  **Wir müssen keine Zinsmathematik nachbauen, nur darstellen.**

Dazu je Produkt: `view_url` (Impressions-Pixel), `commission` (zahlt das Produkt?),
Programmlogos in drei Größen, Einlagensicherung, Prüfsiegel, Bewertungen, Incentives.

### Tracking-Ablauf (dreistufig)
1. `searchentry/create` beim Suchvorgang (`search_default` 1/0)
2. `POST views/add` mit den angezeigten Produkt-IDs
3. Klick auf `tracking.url`

**Ob Stufe 1 und 2 vertraglich Pflicht sind, steht nicht in der Doku.** → offene Frage, siehe §7.

---

## 4. Live gemessen (15.09., `adspace=24770`, `country_iso2=de`, `limit=100`)

**24 von 25 Endpunkten liefern Daten — zusammen 470 Produkte.**

| Rechner | n | | Rechner | n |
|---|--:|---|---|--:|
| Kreditkarten | 49 | | Sterbegeld | 12 |
| Privathaftpflicht | 47 | | Pferdehaftpflicht | 12 |
| Girokonto | 38 | | Rechtsschutz | 12 |
| Tagesgeld | 38 | | Tierkranken | 12 |
| Geräteversicherung | 34 | | Krypto (BTC) | 9 |
| Zahnzusatz | 32 | | Baufinanzierung | 8 |
| Festgeld | 31 | | Risikoleben | 6 |
| Geschäftskonto | 30 | | Bausparen | 5 |
| Depot | 28 | | Crowdinvesting | 5 |
| Hundehaftpflicht | 15 | | Mietkaution | 4 |
| Hausrat | 14 | | Steuersoftware | 2 |
| Kredit | 14 | | **Auslandskranken** | **defekt** |
| Roboadvisor | 13 | | | |

20 der 24 haben ≥ 5 Anbieter, neun davon > 28. Dünn sind nur Steuersoftware (2) und
Mietkaution (4).

### Drei Fehler auf financeads-Seite
1. 🚨 **`travelhealthinsurances` ist kaputt** — parameterunabhängig HTTP 400:
   `BaseController::getApiIdentifier(): Return value must be of type string, null returned`.
   Serverfehler bei financeads, nicht umgehbar. **Betrifft unser `reisekrankenversicherung-vergleich`.**
   → muss gemeldet werden.
2. `cryptos` verlangt zwingend `coin_symbol` (Pflichtfeld, sonst HTTP 400).
3. `creditcards` lehnt `provider[]=amex` ab („ausgewählter Wert ist ungültig"), obwohl
   `list/creditcards/providers` genau `amex` liefert. Liste und Parameter passen nicht zusammen.

---

## 5. Was gebaut werden kann

### 5a. Die 22 toten Embeds

**20 direkt ersetzbar:** depot · festgeld · tagesgeld · girokonto · geschaeftskonto ·
kreditkarten · bausparen · baufinanzierung · ratenkredit · **autokredit** (loans `type=CAR`) ·
**minikredit** (loans `type=MINI_LOAN`) · mietkaution · privathaftpflicht · hausrat ·
rechtsschutz · risikoleben · sterbegeld · zahnzusatz · hundehaftpflicht ·
**studentenkonto** (currentaccounts `target_group[]=student`)

**2 nicht:**
- `reisekrankenversicherung-vergleich` — API-Endpunkt defekt (§4)
- `studentenkreditkarte-vergleich` — siehe §5c, der Filter wirkt nicht

### 5b. Sieben neue Themen, die wir gar nicht haben
Steuersoftware (2) · Roboadvisor (13) · Crowdinvesting (5) · Kryptowährungen (9 je Coin) ·
Tierkrankenversicherung (12) · **Pferdehaftpflicht (12)** · Geräteversicherung (34)

### 5c. Varianten — nur die, die wirklich filtern

Geprüft wurde per **Produkt-ID-Vergleich**, nicht per Trefferzahl. Das war nötig:

| Filter | Ergebnis |
|---|---|
| ✅ Girokonto `target_group[]` | `student` 32 vs. 38 ungefiltert (6 Produkte Differenz), `minor` 3 |
| ✅ Tierkranken `animal_type` | Hund 12 ≠ Katze 12 — **verschiedene Produkte**, zwei echte Vergleiche |
| ✅ Kredit `type` | `CAR` 5, `MINI_LOAN` 2 |
| ❌ **Kreditkarte `target_group[]`** | `student` liefert **identische ID-Menge** wie ungefiltert → kein eigener Vergleich |

Belastbar ableitbar: **rund 25–30 zusätzliche Varianten-Seiten** — Girokonto in 5–6
Zielgruppen, Geschäftskonto nach 10 Rechtsformen (Freiberufler, GmbH, GbR,
Einzelunternehmer …), Junior-Depot (`target_group[]=children`), Depot nach Börsenplatz,
Autokredit/Minikredit/Modernisierungskredit, Hunde- und Katzenkranken, Mietkaution
privat/Firma/Startup, Krypto in 6 Währungen, Festgeld nach Laufzeitstaffeln.

> 🚨 **Doorway-Page-Falle.** Varianten, die sich nur in einem Filterwert unterscheiden und
> dieselben Produkte zeigen, wertet Google als Doorway-Seiten — nach der Deindexierungs-
> geschichte im August ein reales Risiko. Steuersoftware hat 8 Zielgruppen, aber nur
> 2 Produkte; daraus 8 Seiten zu bauen wäre genau der Fehler.
> **Regel: nur Varianten mit nachweislich unterschiedlicher Ergebnismenge, jede mit
> eigenem redaktionellem Text.** Die Prüfung lässt sich automatisieren (ID-Mengen vergleichen).

### 5d. Verfügbare Listen (Varianten-Dimensionen)
Girokonto-Zielgruppen 11 · Geschäftskonto-Rechtsformen 10 · Steuersoftware-Zielgruppen 8 ·
Depot-Börsenplätze 12 (+7 `stockexchanges`) · Sicherheitsverfahren 5 · Kontoführung 4 ·
Kreditkarten-Provider 5 · Kredit-Verwendungszweck 3 (`FREE CAR MODERNIZATION`) ·
Mietkaution-Verwendung 3 (`PRIVATE FIRMA STARTUP`) · Krypto 6 (BTC ETH XRP USDT BNB SOL) ·
**Tierarten 2 (nur `cat`/`dog`)** · Regionen 2 · Crowdinvesting-Standorte 3 ·
Steuersoftware-Plattformen 3 · Depot-Zielgruppen 2 (`children`!)

---

## 6. Bestand: alte Fremdvergleiche, die financeads jetzt auch hat

| Unser Vergleich | Bisher | financeads |
|---|---|---|
| `hundekrankenversicherung-vergleich` | covomo-Skript | ✅ Tierkranken `animal_type=dog` (12) |
| `elektronikversicherung-vergleich` | covomo-Skript | ✅ Geräteversicherung (34) |
| `pferdekrankenversicherung-vergleich` | mr-money | ❌ nein — Tierkranken kennt nur Hund/Katze |

Alles Übrige im Fremdbestand ist im financeads-Katalog **nicht** enthalten: Gebäude,
Unfall, Cyber, Fahrrad, Photovoltaik, Drohne, Strom, Gas, Kfz, PKV, Renten, Leben, BU,
Bußgeld, Bauherren, Haus-/Grundbesitz.

Diese Einbindungen **laufen noch** — Ablösung wäre Konsolidierung, keine Reparatur.
Der Grund, es trotzdem zu tun: die Fremd-iframes stecken alle hinter der Consent-Schranke.

### Anbieterverteilung der 43 CPTs (Stand 15.09., aus cms-dev gelesen)
```
22  tools.financeads.net   ← TOT
 4  www.mr-money.de
 3  script:covomo
 2  rawHtml · form.partner-versicherung.de · koop.energie.check24.de · rechner.covomo.de
 1  intervisio.interrisk.de · www.covomo.de · www.haftpflichtkasse.de
    script:finanzen-de · script:bussgeld · kfz.check24.de
```

---

## 7. Offene Fragen — vor dem Bauen klären

1. **Ist `views/add` / `searchentry/create` Pflicht?** Bei Eigenbau vermutlich ja, sonst
   drohen fehlende Auszahlung oder Vertragsverstoß. Steht nicht in der Doku.
2. **Caching-Regeln und Rate-Limits.** Netlify rechnet nach **GB-Sekunden**, 74 % unserer
   Rechnung ist Wartezeit auf fremde Server (siehe Memory `project_netlify_compute_kostenstruktur`).
   Ein ungecachter API-Call pro Seitenaufruf wäre teuer — aber Zinssätze dürfen nicht veralten.
   Vertraglich zulässige Cache-Dauer erfragen.
3. **Aktualitätspflichten bei Zinsdaten.** Eigene Darstellung verschiebt die Verantwortung
   für Richtigkeit sichtbarer zu uns als beim iframe.
4. **Auslandskranken-Bug** an financeads melden (§4).

---

## 8. Projektregeln, die hier greifen

- **Regel 11 — ISR über `CONTENT_REVALIDATE`** (`lib/wordpress.ts`): niemals einen eigenen
  `revalidate`-Wert an einen Fetch hängen, der im Server-Render läuft. Next nimmt das
  **Minimum** aus Segment und allen Fetches. Gegenprobe nach jedem Build:
  ```bash
  node -e "const r=require('./.next/prerender-manifest.json').routes; console.log([...new Set(Object.values(r).map(v=>v.initialRevalidateSeconds))])"
  ```
  erwartet `[86400, false]`.
- **Kein `.catch(() => null)` auf Fetches in gecachten Routen** — ein geschluckter Fehler
  wird als 404 dauerhaft in den ISR-Cache gebacken (Memory `tech_isr_failopen_cache_poisoning`).
  Gilt jetzt auch für financeads-Fetches.
- **Regel 0 — Weiterleitungen sind heilig.** Wenn Vergleichs-URLs angefasst werden:
  `npm run verify:redirects -- --offline`, vor dem Merge `-- --preview <url>`.
- **Branch-Regeln:** ein Branch = ein Thema, abzweigen von `dev`, nie direkt auf `main`.
- **Adblocker:** keine Klassennamen mit `ad`/`banner`/`sponsor`/`promo` — bei einem
  Affiliate-Rechner besonders heikel (Memory `tech_adblock_class_naming`).
- **≤ 3 parallele Anfragen** gegen live/CMS (Memory `feedback_mess_disziplin_ionos`).

---

## 9. Betroffene Dateien

| Datei | Rolle |
|---|---|
| `app/api/vergleich-data/[slug]/route.ts` | Embed-Config je Slug; enthält die hardcodierte Fallback-Map mit den toten `tools.financeads.net`-URLs |
| `components/vergleich/VergleichEmbed.tsx` | iframe/Script-Einbindung, Consent-Gate (`:48`), 10-s-Fallback |
| `lib/consent/types.ts` | `externalMedia`-Kategorie, Anbieterliste (`:61`) |
| `lib/httpCache.ts` | `cacheHeaders()` — Cache-Control + Netlify durable |
| `wordpress/plugins/finanzleser-blocks/blocks.js` | Gutenberg-Block `finanzleser/vergleich-quelle` (base64-Config) |
| `components/rechner/` | 59 bestehende Rechner-Komponenten — Vorbild für Aufbau und Stil |

---

## 10. Erster Schritt in der neuen Session

```bash
git fetch origin
git switch -c feature/financeads-api origin/dev
```

Dann:

1. **`.env.local` befüllen** (ist gitignored, geprüft):
   ```
   FINANCEADS_API_KEY=<aus dem Gateway, Menü „Api-Keys">
   FINANCEADS_ADSPACE=24770
   ```
2. **Erste Gegenprobe von der Kommandozeile** — bestätigt Schlüssel + adspace:
   ```bash
   curl -sS "https://api.financeads.net/api/v1/affiliate/products/comparison/savingsaccounts?api_key=$FINANCEADS_API_KEY&adspace=24770&average_balance=5000&months=12&limit=3" | head -c 400
   ```
   Achtung: unklar, ob die API-Aufrufe (anders als die Doku) auch ohne Browser-Session
   gehen. Falls 403 kommt, ist das die erste zu klärende Sache.
3. **Einen Rechner als Pilot bauen** — Vorschlag **Tagesgeld**: 38 Produkte, einfache
   Parameter (`average_balance`, `months`), `calculated_conditions` liefert den Ertrag
   fertig. Daran lässt sich Datenmodell, Caching und Tracking einmal sauber durchziehen,
   bevor die anderen 23 folgen.
4. Danach entscheiden: Rendern serverseitig mit ISR, oder Route-Handler + Client-Filter?
   Die Consent-Freiheit gibt es nur bei serverseitigem Rendern.

**Nicht vergessen:** Diese Datei ist auf `feature/landing-zeitung` entstanden (dort lief
die Recherche), gehört aber thematisch nicht dorthin. Sie ist **nicht committet**.

---

*Vollständige Notizen mit allen Messwerten:*
`~/.claude/projects/-Users-bsw-Projekte-finanzleser/memory/project_financeads_api_2026_09_15.md`
