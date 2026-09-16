# dev.finanzleser.de als eigenes Netlify-Projekt

**Stand:** 16. September 2026 · gemessen am Code, nicht aus dem Gedächtnis

Bisher hängt die Vorschau von `dev` an einem Kunstgriff: PR #10 („Vorschau dev — NICHT
MERGEN") ist ein Entwurfs-PR, der nur existiert, damit Netlify einen Deploy-Preview baut.
Ein eigenes Projekt ersetzt das durch eine feste Adresse — und trennt sauber, was heute
dieselbe Netlify-Site tut.

---

## 1 · Die eine Falle

🚨 **Nicht die Umgebungsvariablen der Produktion kopieren.**

Zwei Schutzmechanismen hängen an **einer** Variablen — `NEXT_PUBLIC_SITE_URL`, und zwar
als Positivliste auf die Produktions-URL:

| Schutz | Fundstelle | Regel |
|---|---|---|
| `X-Robots-Tag: noindex, nofollow, noarchive` auf **allen** Pfaden | `next.config.ts:154` | greift, solange `NEXT_PUBLIC_SITE_URL !== "https://www.finanzleser.de"` |
| AdSense-Testmodus (`data-adtest="on"`) | `lib/ads.ts:16` | dieselbe Bedingung |

Steht in der neuen Umgebung versehentlich die Produktions-URL, ist `dev.finanzleser.de`
**indexierbar** (eine Volltext-Dublette der Live-Seite, direkt nach der mühsam reparierten
Deindexierung) **und liefert echte Anzeigen** statt Testanzeigen aus.

Die Positivliste ist die Lehre aus PR #9: vorher wurde auf `"staging."` geprüft, und jede
neue Umgebung wäre ungeschützt gewesen. Deshalb gilt: **eine neue Umgebung ist automatisch
geschützt, solange niemand die Produktions-URL einträgt.**

---

## 2 · Umgebungsvariablen des neuen Projekts

🚨 **Alle ins Netlify-UI, keine nach `netlify.toml`** (Regel 14 in CLAUDE.md): Variablen
aus der Datei erreichen nur den Build, nicht die Functions zur Laufzeit. Stünde
`WORDPRESS_API_URL` an beiden Stellen, läsen Build und Laufzeit aus verschiedenen
Datenbanken — am 03.09.2026 real passiert, der Build war grün und jede Laufzeitseite warf 500.

### Pflicht

| Variable | Wert | warum |
|---|---|---|
| `WORDPRESS_API_URL` | `https://cms-dev.finanzleser.de/graphql` | cms-dev kennt die Faden-Felder, die Produktion nicht (Regel 12) |
| `NEXT_PUBLIC_SITE_URL` | `https://dev.finanzleser.de` | ⚠️ siehe oben — hier entscheidet sich noindex und Anzeigen-Testmodus |
| `NEXT_PUBLIC_FADEN` | `1` | sonst rendert dev den alten Satz |
| `LEO_BACKEND_URL` | wie Produktion | Chat-Proxy |
| `WP_REVALIDATE_SECRET` | wie im CMS hinterlegt | der Refresh bustet damit den Cache-Tag |

### Sinnvoll für eine Abnahmeumgebung

| Variable | Wert | wofür |
|---|---|---|
| `NEXT_PUBLIC_SCHAUKASTEN` | `1` | `/schaukasten` — alle 16 Abschnitte des Fadens nebeneinander |
| `NEXT_PUBLIC_ENTWURF` | `1` | `/entwurf/kursblatt` — der Setzkasten der Eingabe-Bausteine |
| `FINANCEADS_API_KEY`, `FINANCEADS_ADSPACE` | wie lokal | nur nötig, wenn dort Live-Abrufe laufen sollen; die Seiten selbst lesen den Schnappschuss aus WordPress |
| `WP_PREVIEW_SECRET` | wie Produktion | Beitragsvorschau aus dem CMS |
| `CLEVERREACH_*` | wie Produktion | Newsletter-Anmeldung; ohne sie bleibt das Formular stumm |

### Ausdrücklich NICHT setzen

| Variable | warum |
|---|---|
| `NEXT_PUBLIC_ADSENSE` | ohne sie rendern alle Anzeigenplätze graue Platzhalter — auf einer Abnahmeumgebung genau richtig |
| `WARM_FULL` | wärmt die ganze Sitemap nach jedem Deploy; auf dev unnötige Last auf cms-dev |

`URL` und `DEPLOY_PRIME_URL` setzt Netlify selbst.

---

## 3 · Was danach anders ist

- **PR #10 kann geschlossen werden.** Er hat nur als Bauauftrag gedient; ein Branch-Deploy
  der neuen Site ersetzt ihn. Damit entfällt auch ein Preview-Bau je Push.
- **Zwei Sites bauen.** Netlify rechnet je Deploy (15 Credits) — ein Push auf `dev` baut
  künftig die dev-Site, ein Merge nach `main` die Produktion. Vorher bündeln bleibt richtig.
- **Der Refresh-Cron braucht ein Ziel.** `.github/workflows/financeads-refresh.yml` läuft
  erst, wenn die Datei auf dem **Default-Branch** liegt — bis dahin hat sie nie ausgelöst.
  Die Secrets (`CMS_URL`, `CMS_APP_USER`, `CMS_APP_PASS`, `FRONTEND_URL`) entscheiden, ob
  er cms-dev oder die Produktion füttert. Für beide Umgebungen braucht es zwei Läufe oder
  zwei Workflows.

---

## 4 · Gegenprobe nach dem ersten Deploy

```bash
D=https://dev.finanzleser.de
curl -sI "$D/" | grep -i x-robots-tag                 # erwartet: noindex, nofollow, noarchive
curl -s  "$D/finanztools/vergleiche/tagesgeldvergleich" | grep -c 'data-adtest="on"'   # > 0
curl -s  "$D/finanztools/vergleiche/tagesgeldvergleich" | grep -c 'kb--vergleich'      # 1 = Faden an
curl -so/dev/null -w "%{http_code} /suche (Laufzeit)\n" "$D/suche?q=test"              # 200, nicht 500
```

Die letzte Zeile ist die wichtige: eine vorgerenderte Seite kann grün sein, während alles,
was zur Laufzeit WordPress braucht, 500 wirft — genau das Muster vom 03.09.2026.
