# Plan: Das Scrollverhalten des Fadens

Stand: 10.09.2026 · Branch `neustart/faden-zeitung` · Gemessen mit `tools/faden-scroll-mess.mjs`
(Playwright, headless Chromium 1600 × 1000) gegen den Dev-Server. Alle Zahlen unten stammen
aus dem Lauf `lauf4` (Landing → Ratgeber → Ratgeber → Ratgeber → Checkliste → Neuladen →
Aufklappen → Einklappen → Leo-Frage). Die Sonde protokolliert jeden `scrollTo`, jede
Layout-Verschiebung (Layout-Shift-API), jede Änderung im Verlauf links und je Bild die Lage
von Skelett, lebendem Kapitel, Randspalte und Eingabe.

---

## 1. Zielbild — sechs Regeln

1. **Oberhalb der Lesestelle ändert sich nie eine Höhe ohne Ausgleich.** Alles, was lädt,
   hat vom ersten Bild an seine endgültige Höhe (Skelett, Inseln, Anzeigen, Kapitelköpfe).
   Muss oberhalb doch etwas wachsen oder schrumpfen (Kapitel einklappen, Verlauf nach dem
   Neuladen), wird `scrollY` im selben Bild um die Differenz nachgeführt.
2. **Ein Klick hängt sofort ein Skelett mit der Silhouette des Ziels an** und rollt es sanft
   unter den Kopf. Der Inhalt ersetzt das Skelett **an Ort und Stelle** und blendet nur über
   die Deckkraft ein. Danach steht das Kapitel wie ein Seitenanfang — kein zweiter Sprung,
   kein Nachrücken.
3. **Nach unten mitlaufen gibt es nur in zwei Fällen:** Leo schreibt (Streaming oder
   Schreibmaschine) oder der Leser klappt etwas auf (Weiterlesen, Kurzfassung, Kapitel,
   Kiosk). Beides nur, solange der Leser am Ende steht (`folgt()`), und beides hart
   (`scrollBy` um die Differenz), nicht weich.
4. **Die Eingabe klebt am unteren Bildschirmrand. Immer.** Die Randspalten stehen still —
   sie bewegen sich nie mit dem Faden, auch nicht an seinem Ende.
5. **Nach dem Neuladen ist es derselbe Faden** — gleiche Kapitel, gleiche Lesestelle, kein
   Versatz, eingeklappte Kapitel lassen sich öffnen.
6. **Kein fremder Scroll.** Nichts im Faden ruft `ScrollTrigger.refresh()`; nichts außer der
   Scroll-Grammatik in `lib/faden/scrollen.ts` und den Mitlauf-Regeln aus 3 bewegt `scrollY`.

---

## 2. Befund — was heute passiert (gemessen)

### 2.1 Navigation: der Faden springt hin und her

| Szenario | Skelett beim Klick | Wachstum oberhalb nach dem Klick | Zweiter Sprung nach Ankunft |
|---|---|---|---|
| Landing → Ratgeber (Leser bei y 1103) | +1712 px unter der Oberkante | **+450 px nach 48 ms** (Inseln) | 2739 → 3195, dann 3189 |
| Ratgeber → Ratgeber, Leser am Ende (y 14872) | **−5138 px, also über dem Bild** | **+3513 px** (Inseln, Layout-Shift 0,455) | 9660 → 13787 |
| Ratgeber → Ratgeber, aus der Mitte (y 23384) | **−11887 px** | — | 11421 → 11653 |
| Ratgeber → Checkliste (y 20474) | **−8692 px** | — | 11706 → 11918 |

Ablauf, wie er heute im Code steht (`components/faden/FadenProvider.tsx:270–310`):

1. Im Klick-Moment wird das lebende Kapitel als Schnappschuss **sofort** als
   `kapitel--alt` eingehängt (offen), das echte lebende Kapitel bekommt `display: none`
   (`app/faden.css:343`), **alle älteren Kapitel klappen zu** (Zeile 280), und der Strom
   bekommt seine bisherige Höhe als `min-height` (Zeile 296–297).
2. `saeubern()` **leert alle Inseln** (`lib/faden/schnappschuss.ts:38–42`) — Rechner,
   Checklisten, Kiosk, Statistiken sind im Schnappschuss null Pixel hoch. Der Schnappschuss
   ist damit kürzer als das Kapitel, das er ersetzt; das Skelett rutscht nach oben, bei einem
   Ratgeber mit Werkzeugen um mehrere tausend Pixel **über** die Lesestelle.
3. `SkelettKapitel` misst sein Rechteck und rollt sanft dorthin
   (`components/faden/SkelettKapitel.tsx:24–27`) — der Leser sieht, wie der Faden über
   leere Fläche **rückwärts** rollt (1 s, 5 000 px).
4. 48 ms bis 1 s später hängt `InselnBeleben` die echten Komponenten per Portal ein
   (`components/faden/kette/InselnBeleben.tsx:59–75`): alles oberhalb wächst um 450 bis
   3 513 px, das Skelett wandert unter dem Leser weg.
5. Trifft das neue Kapitel ein, steht es folgerichtig **nicht** unter dem Kopf (gemessen:
   526 px darunter), also zweiter sanfter Sprung (`zumKapitelScrollen`), 500 ms später eine
   Nachkorrektur um 6 px — die kommen aus `translateY(6px)` der Einblend-Animation
   `kapitel--frisch` (`app/faden.css:322`), die während der Messung noch läuft.

### 2.2 Zwei Sekunden totes Warten bei jeder Navigation

Das neue Kapitel steht 1,1 – 3,3 s nach dem Klick im DOM (Dev-Server, inkl. Kompilieren).
Sichtbar wird es aber **konstant 2,0 s später**: Ankunft 9329 ms → sichtbar 11372; 18951 →
20969; 29559 → 31572; 40759 → 42752.

Ursache `FadenProvider.tsx:344–350`: Der Pfad-Effekt merkt sich `vorher = #kapitel-live`
und wartet, bis ein **anderer** Knoten da ist. Der Kommentar dort geht davon aus, dass
`usePathname()` wechselt, bevor das Kapitel im DOM steht. Gemessen ist es umgekehrt: Der
Pfad wechselt im selben Commit wie das neue Kapitel, `vorher` ist also schon der **neue**
Knoten, `live !== vorher` wird nie wahr, und die Schleife läuft bis zur Frist
`performance.now() + 2000`. Mit Vorausladen (Produktion) wäre der Inhalt in ~100 ms da — und
der Leser sähe trotzdem 2 s Skelett. Das ist ein großer Teil der „teils sehr langen Ladezeiten“.

### 2.3 Fremder Scroll: `ScrollTrigger.refresh()` neunmal in vier Navigationen

Jede Checkliste, die fertig lädt, ruft `refreshScrollTriggers()`
(`components/checkliste/ChecklisteInline.tsx:50` → `lib/refreshScrollTriggers.ts:23`).
GSAPs `_refreshAll` scrollt dabei **jeden Scroller auf 0 und wieder zurück**
(`node_modules/gsap/dist/ScrollTrigger.js:1191` `obj(0)`, `:1235` `obj(obj.rec)`). Das ist
synchron und malt nicht, aber es **bricht jeden laufenden weichen Scroll ab** und stellt die
Position wieder her, die beim Start der Messung galt. Im Faden gibt es keinen Konsumenten für
diese Messung — die Trigger von Logo-Shrink und Leo-Dock leben in der alten Hülle.
`components/statistik/StatistikKarte.tsx:57` legt außerdem je Statistik einen ScrollTrigger an.

### 2.4 Verlauf links: das „Duplikat“

Zwei Quellen, beide reproduziert:

- **Der 8-s-Sicherheitstimer** (`FadenProvider.tsx:301–307`): Dauert die Antwort länger
  (Lauf 1: Checkliste-Route > 8 s auf dem Dev-Server), räumt er das Skelett ab und blendet
  die **alte** Seite wieder ein. Jetzt steht das alte Kapitel zweimal in der Liste
  („Gaspreise vergleichen / Gaspreise vergleichen“) — als eingefrorener Eintrag und als
  lebendes — und wird erst beim späten Eintreffen zum neuen Inhalt. Genau das beschriebene
  Bild.
- **Die Abschnittsliste springt zwischen zwei Einträgen.** Sie hängt unter dem Kapitel an der
  Lesekante (`lib/faden/useAbschnittAktiv.ts:100–108`). Während des sanften Sprungs liegt
  die Lesekante erst im eingefrorenen, dann im neuen Kapitel: die Liste mit 13 Abschnitten
  erscheint unter dem alten Eintrag, verschwindet, erscheint unter dem neuen (vier bis fünf
  Umbauten der Liste je Navigation). Die Skelettzeile trägt außerdem keinen Titel
  (`components/faden/RandLinks.tsx:77–82`), der Name kommt erst mit dem Inhalt.
- Nebenbefund: Ratgeber und Checkliste heißen beide „Gaspreise vergleichen“ — ohne Typ im
  Eintrag sieht das wie ein Fehler aus.

### 2.5 Leo: keine Chat-Bewegung beim Schreiben

Die Frage rollt unter den Kopf (richtig). Die Antwort strömt danach 8 s lang: Dokument
1997 → 2763 px, `scrollY` bleibt bei 1018, das Antwortende steht 401 px **unter** dem Rand.
Ursache `components/faden/leo/LeoStrom.tsx:77`: `if (laeuft) return;` — gescrollt wird erst,
wenn die Antwort fertig ist. `mitlaufen()` aus `lib/faden/tippen.ts:40` existiert, wird aber
nur von `Weiterlesen` (vorgefertigte Fragen) benutzt.

### 2.6 Eingabe und Randspalten wandern

- Die Eingabe ist `position: sticky; bottom: 0` **in `#mitte`** (`app/faden.css:911`). Unter
  `#mitte` folgt die Fußnote; am Fadenende steigt die Eingabe deshalb um bis zu 225 px
  (gemessen Unterkante 775 – 979 statt 1000).
- Die Randspalte klebt in `.rand__lauf`, dessen Höhe die Rasterzeile ist
  (`app/faden.css:229`). Endet der Strom, wird die klebende Spalte mitgeschoben
  (Oberkante −129 … 80 px während Leo schreibt).

### 2.7 Neuladen und eingeklappte Kapitel

- Nach F5 stellt der Browser die Position wieder her (370 ms), danach fügt der Provider die
  vier eingefrorenen Kapitel **über** dem lebenden ein (486 ms, `FadenProvider.tsx:180–198`):
  der Text unter den Augen rutscht um 189 px (Layout-Shift 0,084). Kein Ausgleich.
- Aufklappen: Inhalt +1 689 px sofort, **+450 px 38 ms später** (Inseln) — zwei Stufen, keine
  Bewegung.
- Einklappen eines Kapitels **oberhalb** der Lesestelle: −2 138 px unter dem Leser (Shift
  0,456), dann kappt der Browser den Scroll um weitere 1 668 px. Kein Ausgleich
  (`kapitelUmschalten`, `FadenProvider.tsx:473`).
- Der Verlauf liegt mit 429 KB (4 Kapitel) in sessionStorage und wird bei **jeder** Änderung
  synchron neu serialisiert (`FadenProvider.tsx:210–216`).

### 2.8 Kleinere Funde

- `Begruessung.tsx:49` sucht das Finanzwort mit `.meldung, .kasten--pink` — `kasten--ks`
  trägt `kasten--pink` mit, der Scroll zielt auf den **Kassensturz**.
- `zeigeAnfang` läuft im Dev-Server doppelt (React Strict Mode, zwei identische `scrollTo`).
  Harmlos in Produktion, aber ein Hinweis, dass Sprünge idempotent sein sollten.
- Die Greeting-Enthüllung schiebt 1 239 px auf einmal ein (Kiosk), Shift 0,263 — unterhalb,
  also erlaubt, aber ohne Bewegung.
- Dev-Server: Kein Vorausladen (`router.prefetch` ist im Dev-Modus aus), 1 – 5 s Kompilieren
  je Route. Ladezeit-Abnahme gehört auf `next start` (Eintrag `faden-prod`), nicht auf
  `npm run dev`.

---

## 3. Die Lösung — Architektur in fünf Bausteinen

### A. Der Faden wächst nur nach unten (feste Höhen)

- **Inseln mit fester Höhe.** `greifen()` misst je `[data-insel]` die Höhe und schreibt sie
  als `data-insel-h`; `saeubern()` leert die Insel wie bisher, setzt aber `min-height` auf
  den gemessenen Wert. Das Portal von `InselnBeleben` rendert dann **in** eine Box, die
  schon die richtige Höhe hat — der Schnappschuss ist pixelgleich mit dem Kapitel, das er
  ersetzt, und das Skelett bleibt, wo es ist. (Gleiche Idee für den Kapitelkopf: `min-height`
  für lebende und eingefrorene Kopfzeile identisch.)
- **Ältere Kapitel klappen erst nach der Ankunft zu**, nicht im Klick-Moment, und dann mit
  Ausgleich (Baustein C). Bis dahin ändert sich oberhalb des Skeletts nichts.
- **Bodenabstand statt `min-height`-Trick.** `#strom-ende` bekommt
  `min-height: calc(100dvh − Kopf − Eingabe)`. Damit lässt sich jedes Kapitel — auch ein
  kurzes (Rechner, Begriff) — mit der Oberkante unter den Kopf rollen, das Dokument schrumpft
  nie unter den Leser, der Browser kappt nie. Der eingefrorene `strom.style.minHeight` und
  seine Freigabe nach 700 ms entfallen.
- `kapitel--frisch` blendet nur über `opacity` ein — kein `translateY`, damit die Messung des
  Sprungziels stimmt und die 6-px-Nachkorrektur verschwindet.

### B. Typisierte Skelette, Austausch an Ort und Stelle

- `lib/faden/skelett.ts`: `skelettFuer(href)` leitet aus der Adresse die Sorte ab —
  `ratgeber` (`/rubrik/thema/slug`), `rubrik`, `thema`, `rechner`, `checkliste`,
  `vergleich`, `dokument`, `begriff`, `anbieter`, `seite`, `kassensturz`, `spiel`. Jede Sorte
  hat eine eigene Silhouette mit den **echten Maßen** des späteren Kapitels: Kopfzeile
  (gleiche `min-height` wie `KapitelKopf`), Anzeige 728 × 90, Krumen, Titel zwei Zeilen,
  Untertitel, Vorspann, Autorenzeile, Bild 16 : 9, Einleitung, Inhaltskasten, erster
  Abschnitt — beim Rechner die Kartenform, beim Begriff die kurze Form. Das Schimmern
  (`faden-schimmer`) bleibt.
- Das Skelett füllt mindestens `100dvh − Kopf − Eingabe`, damit der Sprung dorthin immer
  möglich ist.
- **Das Skelett wird zum Kapitel:** Wenn das neue `#kapitel-live` da ist, verschwindet das
  Skelett und das Kapitel wird im selben Commit sichtbar — dieselbe Stelle im Strom, dieselbe
  Oberkante. Kein `zumKapitelScrollen` mehr nach der Ankunft; `zeigeAnfangStabil` bleibt nur
  als Sicherung mit Schwelle (> 4 px) und ohne Eingriff, wenn der Leser inzwischen selbst
  scrollt.
- **Ankunft erkennen, ohne 2 s zu warten:** `vorher` wird im Klick-Moment gemerkt
  (`navigieren`), nicht im Pfad-Effekt; der MutationObserver aus `useAbschnittAktiv` meldet
  den neuen Knoten. `SKELETT_MIN` (240 ms) bleibt als Untergrenze gegen das Aufblitzen.
- **Zeitüberschreitung:** Nach 8 s nicht die alte Seite wiederbeleben, sondern das Skelett
  stehen lassen und einen Hinweis zeigen („dauert länger …“); nach 15 s harter Wechsel
  (`location.assign(href)`). Ein Duplikat im Verlauf kann so nicht mehr entstehen.

### C. Eine Ausgleichs-Funktion für alles, was oberhalb passiert

`scrollen.ts` bekommt `mitAusgleich(anker, aendern)`: Oberkante des Ankers messen, DOM
ändern, wieder messen, `scrollBy(0, differenz)` mit `behavior: "instant"` — alles im selben
Bild, der Leser merkt nichts. Verwendet für:

- Einklappen/Aufklappen eines Kapitels **oberhalb** der Lesestelle (Verlauf, Toggle,
  `lesestelleZurueck`, das automatische Zuklappen älterer Kapitel nach der Ankunft),
- das Einfügen des Verlaufs nach dem Neuladen,
- jede spätere Höhenänderung oberhalb (z. B. eine Anzeige, die nachlädt).

Chrome und Firefox haben dafür „Scroll Anchoring“ eingebaut — es griff hier nicht, weil der
Ankerknoten (das alte lebende Kapitel) selbst versteckt wurde; Safari kann es gar nicht.
Deshalb explizit.

Kapitel klappen **animiert** (Höhe über `grid-template-rows: 0fr → 1fr`, 0,35 s); liegt das
Kapitel unter der Lesestelle, läuft die Animation ohne Ausgleich, liegt es darüber, wird je
Bild nachgeführt (ResizeObserver auf dem Kapitel + `scrollBy`).

### D. Eingabe unten, Ränder still

- `.eingabe` wird `position: fixed; bottom: 0`, Breite und Lage wie die Mittelspalte (die
  Formel steht schon für `.fortschritt` in `app/faden.css:181–194`). `#mitte` bekommt
  `padding-bottom` in Höhe der Eingabe. Der Anker-Versatz auf Mobil
  (`body.mit-anker .eingabe { bottom: 112px }`) funktioniert mit `fixed` weiter, der
  Hero-Ausblender ebenso.
- Die Randspalten bleiben `sticky`, aber ihr Klebebereich endet nie vor dem Bildschirmrand:
  die Rasterzeile ist dank Bodenabstand (A) immer mindestens bildschirmhoch, und
  `.rand__innen` bekommt `max-height` abzüglich der Eingabehöhe. Damit stehen sie still —
  auch am Fadenende, auch während Leo schreibt. (Innerhalb der Spalte darf ein langer
  Verlauf weiter rollen — das ist die Spalte selbst, nicht der Faden. Wenn auch das nicht
  gewünscht ist: Verlauf ab Eintrag 6 verdichten.)

### E. Mitlaufen wie im Chat — eine Regel für alle Fälle

- **Leo-Stream:** ein ResizeObserver auf dem wachsenden Antwortknoten; bei jedem Wachstum
  `mitlaufen(ziel)` (hartes `scrollBy` um genau die Differenz, nur wenn das Ende unter den
  Rand rutscht) — solange `folgt()` gilt. Ein Rad-, Wisch- oder Tastenereignis nach oben
  beendet das Mitlaufen für diese Antwort („der Leser will zurücklesen“). Der
  Tipp-Indikator reserviert die Höhe der ersten Zeile, damit der Markdown-Parser
  (`LeoMarkdown`, nachgeladen) beim ersten Token nicht springt.
- **Schreibmaschine** (Weiterlesen, Begrüßung, Leo fragt): dieselbe Funktion, `aufTakt`.
- **Aufklappen** (Kurzfassung, Weiterlesen-Antwort, Kiosk, Kapitel unterhalb): Höhe
  animieren, dabei je Bild mitlaufen, wenn `folgt()`. Kein `scrollTo` mit `smooth` mehr
  auf das Aufgeklappte (`Aktionen.tsx:26` heute).
- **Eigene Frage** und **Navigation** bleiben die einzigen weichen Sprünge (`immer`).

### F. Neuladen

- `history.scrollRestoration = "manual"` im Faden. Beim Scrollen (gedrosselt) werden
  `{ kapitelId, versatz }` in sessionStorage gemerkt. Nach dem Einhängen des Verlaufs
  (`useLayoutEffect`, vor dem ersten Bild nach der Hydration) stellt der Faden die Stelle
  selbst her: Oberkante des Kapitels + Versatz, hart. Fehlt die Stelle, steht das
  aufgerufene Kapitel unter dem Kopf.
- Das Schreiben des Verlaufs geht in `requestIdleCallback`, und `html` wird nur beim
  Einfrieren geschrieben, nicht bei jedem Auf-/Zuklappen.

### G. ScrollTrigger raus aus dem Faden

- `refreshScrollTriggers()` wird zur No-Op, wenn `body.faden-body` gesetzt ist (oder
  `ChecklisteInline` ruft es nur außerhalb des Fadens).
- `StatistikKarte` ersetzt `ScrollTrigger.create` durch einen IntersectionObserver
  (`once`, Schwelle 20 %).
- Gegenprobe mit der Sonde: keine `scrollTo(0)`-Paare mehr im Protokoll.

### H. Verlauf links

- Die Skelettzeile trägt sofort den **Zieltitel** (Linktext, sonst Titel aus dem Index
  `indexAusCache()`), Nummer wie bisher — der Name ändert sich nach der Ankunft nicht mehr.
- Während einer Navigation und während eines programmatischen Sprungs ist das aktive
  Kapitel **gepinnt** (das Ziel); die Lesekante übernimmt erst wieder, wenn der Leser selbst
  scrollt. Die Abschnittsliste wandert dadurch genau einmal.
- Gleiche Titel: Typ-Zusatz im Eintrag („Checkliste“, „Rechner“).

---

## 4. Runden — je eine abgegrenzte Änderung, jede mit Messung abgenommen

Reihenfolge ist Absicht: erst die Geometrie (sonst misst jede spätere Runde falsch), dann
Skelette, dann die Bewegungen.

| Runde | Inhalt | Abnahme mit der Sonde |
|---|---|---|
| **R0** | Sonde ins Repo (`tools/faden-scroll-mess.mjs`), Ausgangswerte = dieses Dokument. Dev-Server neu starten (`.next` löschen, siehe § 6). | Lauf läuft durch, Zahlen wie in § 2. |
| **R1** | Baustein A: Insel-Höhen messen und setzen, älteres Zuklappen nach die Ankunft, `kapitel--frisch` ohne `translateY`, Bodenabstand statt `min-height`-Trick. Dazu die Ankunftserkennung aus B (Klick-Moment statt Pfad-Effekt). | `sk` ändert sich nach dem Klick nicht mehr; nach der Ankunft kein `liveShift`; Skelett → sichtbar ≤ 300 ms nach dem DOM-Wechsel (statt 2 000). |
| **R2** | Baustein B: typisierte Skelette, Austausch an Ort und Stelle, Timeout ohne Wiederbelebung. | Nach der Ankunft genau **null** `scrollTo`; `liveTop` = Kopf + 12 im ersten sichtbaren Bild. |
| **R3** | Baustein D: Eingabe `fixed`, Ränder still. | `ein` = innerHeight in jedem Sample; `rail` konstant über alle Szenarien. |
| **R4** | Baustein E: Mitlaufen (Leo-Stream, Schreibmaschine, Aufklappen), `Begruessung`-Selektor. | Antwortende bleibt ≥ 140 px über dem Rand; ein Rad-Ereignis nach oben stoppt es; Layout-Shift beim Aufklappen unterhalb = 0 im Bild. |
| **R5** | Baustein H: Verlauf links (Zieltitel, Pinning, Typ-Zusatz). | TOC-Umbauten je Navigation = 2 (Einfügen, Fertig). |
| **R6** | Bausteine C + F: Ausgleich, animiertes Klappen, Neuladen-Wiederherstellung, Leerlauf-Schreiben. | `liveShift` nach F5 = 0; Einklappen oberhalb: `liveShift` 0, kein Kapp-Sprung; Aufklappen in einer Bewegung. |
| **R7** | Baustein G: ScrollTrigger raus. | Keine `scrollTo(0)`-Paare im Protokoll. |
| **R8** | Abnahme auf `next start` (`faden-prod`) und im Deploy-Preview; Vorausladen prüfen (Klick → sichtbar bei vorgeladener Seite ≤ 300 ms). | Ladezeiten-Tabelle Dev vs. Prod im Plan nachtragen. |

Jede Runde: eigener Commit, Sonde vor/nach, visuelle Abnahme durch den User. Nicht zwei
Runden in einem Zug — die Lehre vom 09.09. gilt hier genauso.

---

## 4a. Stand nach der Umsetzung (10.09.2026, abends)

R1–R7 sind umgesetzt, je Runde ein Commit auf `neustart/faden-zeitung`:
`1d87f27` R1+R2 · `0186b22` R3 · `c42f9b9` R4 · `d5deeb9` R5 · `c711fab` R6 · `5826115` R7,
dazu die Nachbesserungen nach der Messung (R8). Nicht gepusht.

**Entscheidungen des Users (vor R1 gefragt):** nach einer Navigation bleiben die **letzten
zwei** Kapitel offen (das verlassene und das neue), alles davor klappt mit Ausgleich zu ·
Skelett mit Kopfzeile, Pfad **und echtem Titel** aus dem Link · Randspalte rollt intern ohne
Balken · bei langem Warten nur ein Hinweis, **nie** ein harter Seitenwechsel.

**Was die Sonde danach misst** (Lauf `r8`, Dev-Server, gleiche Szenarien wie § 2):

| Szenario | vorher | nachher |
|---|---|---|
| Skelett beim Klick | bis −11 887 px, danach +3 513 px Nachrücken | +866 px unter dem Kopf, bleibt stehen |
| Ankunft → sichtbar | 2,0 s nach dem DOM-Wechsel | 20–60 ms |
| Kapitel bei der Ankunft | 526 px unter dem Kopf, zweiter Sprung | 76 px = Kopf + 12, kein Sprung |
| Zuklappen älterer Kapitel | −2 139 px unter dem Leser | `scrollBy −1 932` im selben Bild, Kapitel bleibt bei 76 |
| Portale im eingefrorenen Kapitel | +206/+246 px unausgeglichen | `scrollBy +246` im selben Bild |
| `ScrollTrigger.refresh` | 9× in 4 Navigationen | 0 |
| Eingabe-Unterkante | 775 … 1000 | 1000 in jedem Sample |
| Randspalte | −129 … 80 | 80 (86 vor dem Kleben) |
| Neuladen | +189 px Versatz | Lesestelle vor der Hydration hergestellt, Verlauf mit `scrollBy +189` |
| Einklappen oberhalb | −2 138 px, dann Kappung | `scrollBy −2 139`, Kapitel bleibt bei 1 px |
| Leo-Antwort | wächst 401 px unter den Rand | Ende bleibt bei 892 (Mitlaufen, `scrollBy` je Wachstum) |
| Verlauf links | Skelettzeile ohne Namen, Liste springt 4–5× | Zieltitel sofort, gepinnt, Typ bei gleichen Titeln |

**Was noch offen ist:**
- R8-Abnahme auf `next start` und im Deploy-Preview (Vorausladen, echte Zeiten).
- Die Öffnungs-Animation eingefrorener Kapitel ist im Dev-Server nicht messbar (Hauptthread
  beim Aufklappen zu lange belegt, die 360 ms sind vorbei, bevor ein Bild kommt).
- Im Dev-Server laufen Layout-Effekte doppelt (Strict Mode): das gerade eingefrorene Kapitel
  spielt deshalb beim Klick einmal seine Aufklapp-Animation — unsichtbar, weil die Höhe fest
  ist, in Produktion gar nicht.
- Ein Linktext wie „Eigene Seite öffnen" ergibt jetzt den Titel des umgebenden Werkzeugs;
  generische Texte, die ich nicht kenne, stehen so lange in der Ladezeile, bis der Inhalt da ist.

## 5. Offene Entscheidungen (vor R1 klären)

1. **Sollen ältere Kapitel überhaupt automatisch zuklappen?** Mit Ausgleich ist es
   unsichtbar; ohne Zuklappen wird der Faden lang, aber der Leser findet beim Hochscrollen
   alles offen vor. Vorschlag: zuklappen, wie bisher gedacht.
2. **Skelett mit echtem Titel oder reines Schimmern?** Der Titel ist beim Klick bekannt
   (Linktext). Vorschlag: Kopfzeile mit echtem Pfad, Rest schimmert.
3. **Randspalte intern rollen lassen** (langer Verlauf) oder verdichten? Vorschlag: rollen,
   ohne sichtbaren Balken, wie jetzt.
4. **Nach 15 s harter Wechsel** oder weiter warten? Vorschlag: harter Wechsel — besser als
   ein Faden, der still steht.

---

## 6. Nebenbefund Dev-Server (heute, 16:18)

Beim Öffnen der Vorschau hat die Claude-Sitzung über `.claude/launch.json` einen **zweiten**
`next dev` gestartet (Port 51672). Der schreibt in dasselbe `.next` wie der laufende Server
auf Port 3000 — der liefert seitdem für den Beitrags-Chunk
`/_next/static/chunks/app/[kategorie]/[sub]/[slug]/page.js` ein 404, und Next fällt auf
einen **harten Seitenwechsel** zurück (Faden weg, Neuladen). Der zweite Server ist
gestoppt; der auf Port 3000 braucht einen Neustart:

```bash
rm -rf .next && npm run dev
```

Regel daraus: Vor jeder Browser-Vorschau `lsof -nP -iTCP:3000 -sTCP:LISTEN` — läuft schon
ein Server, nur dessen Adresse benutzen, nie einen zweiten starten.

---

## 7. Messprotokoll (Auszug, Lauf 4, Millisekunden ab Seitenstart)

```
B  Landing → Ratgeber
  8003 TOC   neu:Heute / verlauf__laedt            ← Klick
  8013 Δ     doc 3568→4059; laedt=true             ← alte Seite versteckt, Skelett da (sk +1712)
  8016 scrollTo 2739 smooth (2×, Strict Mode)
  8051 Δ     doc 4059→4509                          ← +450 px OBERHALB: Inseln portaliert
  8160…8596  weicher Scroll 1127 → 2703
  9329 add   #kapitel-live                          ← RSC da (1,3 s)
  9468 scrollTo 0 / 0 / 2739 auto  ← GSAP _refreshAll (ChecklisteInline → refreshScrollTriggers)
 11372 rm    kapitel--skelett; laedt=false          ← 2,0 s nach Ankunft (Frist im Pfad-Effekt)
 11426 Δ     liveShift 0→526                        ← Kapitel 526 px unter dem Kopf
 11457 scrollTo 3195 smooth                         ← zweiter Sprung
 11928 scrollTo 3189 smooth                         ← 6-px-Korrektur (translateY der Einblendung)

C  Ratgeber → Ratgeber (Leser am Ende, y 14872)
 17885 Δ     sk = −5138                              ← Skelett über dem Bild
 17890 scrollTo 9658 smooth                         ← 1 s rückwärts über leere Fläche
 18904 Δ     sk −96 → +3417, CLS 0,455              ← Inseln (+3513 px) schieben das Skelett weg
 18951 add   #kapitel-live                          ← RSC da (1,1 s)
 19096 / 20405 / 20858  scrollTo 0 … auto           ← drei GSAP-Refreshes
 20969 laedt=false (2,0 s später), liveShift 0→4197
 21001 scrollTo 13787 smooth                        ← 4 127 px vorwärts

E  Neuladen (/finanztools/checklisten/gaspreise-vergleichen)
   370 Δ     y 0→624                                 ← Browser stellt her
   486 add   4× kapitel-alt; liveShift −469→−280     ← +189 px Versatz unter dem Leser

F2 Kapitel oberhalb einklappen
  9542 Δ     liveShift 0→−2138, CLS 0,456; dann y 2482→814 (Kappung)

G  Leo-Frage
 13033 scrollTo 1411 smooth                         ← Frage unter den Kopf (Dokumentende)
 15949…23146 doc 1997→2763, y bleibt 1018           ← Antwort wächst 401 px unter den Rand
       ein 775…979 (statt 1000), rail −129…80       ← Eingabe steigt, Randspalte wandert
```
