---
title: "finanzleser.de — Infrastruktur ab Phase 2"
subtitle: "Zielarchitektur nach dem Umzug auf den neuen Webspace"
author: "Florian Frey"
date: "2. September 2026"
lang: de-DE
toc-title: "Inhalt"
---

\newpage

# Warum umgebaut wird

Im August 2026 wurde das WordPress von finanzleser.de über die Sicherheitslücke
*wp2shell* (CVE-2026-63030) kompromittiert. Der Kunde bekam den betroffenen
IONOS-Webspace nicht sauber und hat einen neuen Vertrag abgeschlossen. Der Umzug ist
damit ohnehin fällig — und die Gelegenheit, drei strukturelle Schwächen des bisherigen
Aufbaus zu beheben.

**1. Es gab nur ein WordPress.** Dasselbe System bediente Entwicklung und Produktion.
Jede Plugin-Installation, jede geänderte Einstellung, jedes Update wirkte sofort auf die
öffentliche Website. Gefahrloses Testen war schlicht nicht möglich. Phase 2
(Login-Bereich, Werbung, KI-Ausbau, WhatsApp) besteht fast vollständig aus genau solchen
Eingriffen.

**2. Eigener Programmcode war nirgends versioniert.** Neun mu-plugins und das
Gutenberg-Plugin `finanzleser-blocks` existierten ausschließlich auf dem Server. Bei der
Untersuchung des Vorfalls war das der blinde Fleck: Der WordPress-Kern und alle
Fremd-Plugins ließen sich gegen die offiziellen Prüfsummen abgleichen — dieser Code
gegen nichts. *(Inzwischen behoben, siehe „Bereits erledigt".)*

**3. Es gab kein Backup außerhalb von IONOS.** Zum Zeitpunkt des Einbruchs existierte
kein Wiederherstellungspunkt.

\newpage

# Die vier Adressen

Nach dem Umbau gibt es vier Systeme. Das Präfix verrät die **Art** des Systems, das
Suffix die **Umgebung**.

| Adresse | Was | Wer arbeitet damit |
|:----------------------------------|:---------------------------|:----------------------|
| `www.finanzleser.de` | Live-Website | Besucher |
| `dev.finanzleser.de` | Test-Website | Team, zur Abnahme |
| `cms.finanzleser.de` | WordPress, echte Inhalte | Redaktion |
| `cms-dev.finanzleser.de` | WordPress, Wegwerf-Kopie | Entwicklung |

Die beiden Websites laufen bei **Netlify**, die beiden WordPress-Systeme auf dem neuen
**IONOS-Webspace**.

## Warum das CMS nicht `finanzleser.de` heißen kann

Eine naheliegende Frage — die Antwort ist ein klares Nein, und zwar aus vier
unabhängigen Gründen:

- `finanzleser.de` **ist** die Website. Wer die Adresse ohne „www" eintippt, würde im
  WordPress-Backend landen statt auf der Seite.
- WordPress leitet **alle Bild-Adressen** aus seiner eigenen Adresse ab. Stünde dort
  `finanzleser.de`, verwiese jedes Bild auf den Webspace statt auf die Website. Genau
  dieser Fehler trat am 18. August auf: allein auf der Startseite waren 359 Bilder
  betroffen, und die Zwischenspeicherung backt solche Adressen binnen Stunden dauerhaft
  in alle Seiten ein.
- Google sähe zwei Websites mit identischem Inhalt. Das CMS ist bewusst für
  Suchmaschinen gesperrt — im Zweifel fällt die falsche Variante aus dem Index.
- Das SSL-Zertifikat der Website deckt `finanzleser.de` und `www.finanzleser.de`
  gemeinsam ab. Wird der Eintrag anderweitig vergeben, erneuert es sich nicht mehr.

Das CMS ist kein zweiter Auftritt der Marke, sondern ein Lieferant im Hintergrund. Es
braucht eine eigene Adresse.

\newpage

# Wie die Systeme zusammenhängen

```
   INHALTE                          CODE
   ───────                          ────

   cms.finanzleser.de               Feature-Branch
   WordPress, Redaktion                   │
        │                                 │ Pull Request
        │  Klon-Skript                    ▼
        ▼  (Sekunden)                Vorschau-Version
   cms-dev.finanzleser.de                 │
   Wegwerf-Kopie                          │ zusammenführen
        │                                 ▼
        └──────── liefert an ───────► dev.finanzleser.de
                                      Test-Website
                                           │
                                           │ zusammenführen  ◄── Livegang
                                           ▼
   cms.finanzleser.de ───── liefert an ► www.finanzleser.de
                                      Live-Website
```

## Die zentrale Regel

> **Inhalte werden ausschließlich in `cms.finanzleser.de` gepflegt.**
> Die Kopie fließt niemals zurück. Wer in der Kopie einen Artikel schreibt, hat ihn
> verloren.

Die Kopie dient dem Testen von *Struktur* — Plugins, Felder, Vorlagen, Updates — nicht
der Redaktion.

## Warum eine Wegwerf-Kopie und kein dauerhaftes Zweitsystem

Ein gepflegtes zweites WordPress entfernt sich binnen Wochen vom Produktionsstand: ein
Update hier, ein Artikel dort. Dann testet man gegen ein System, das mit der echten
Website nichts mehr zu tun hat — und das Testergebnis ist wertlos.

Die Kopie wird deshalb bewusst **nicht gepflegt**, sondern per Skript in Sekunden neu
aus der Produktion erzeugt, wann immer sie gebraucht wird. Sie ist damit
konstruktionsbedingt immer aktuell und darf jederzeit zerstört werden. Nebeneffekt: eine
Angriffsfläche weniger, die dauerhaft gepatcht werden müsste.

\newpage

# Der Weg von der Idee zur Live-Seite

| Schritt | Was passiert | Wo sichtbar |
|:--|:------------------------------------|:--------------------|
| 1 | Entwickler öffnet einen Branch für ein Feature | — |
| 2 | Pull Request → automatische Vorschau-Version | eigene Vorschau-Adresse |
| 3 | Zusammenführen in `dev` | `dev.finanzleser.de` |
| 4 | Team-Abnahme | `dev.finanzleser.de` |
| 5 | Pull Request `dev` → `main` zusammenführen | **`www.finanzleser.de`** |

**Schritt 5 ist der Livegang** — ein Klick, keine Dateiübertragung, kein Wartungsfenster.

**Rückweg:** In der Netlify-Oberfläche lässt sich jede frühere Fassung per Klick wieder
veröffentlichen. Ein fehlerhafter Livegang ist damit in unter einer Minute rückgängig
gemacht.

## Was dabei *nicht* mitgeht

Inhalte. Sie liegen im CMS, nicht im Code, und erscheinen unabhängig vom Livegang auf der
Website. Setzt eine Code-Änderung eine Änderung im WordPress voraus (ein neues Feld, ein
neuer Blocktyp), muss diese im Produktions-CMS nachgezogen werden — geplant und
dokumentiert, nicht nebenbei.

\newpage

# Der Umzug selbst

## Die Website läuft durchgehend weiter

Das ist die wichtigste Eigenschaft dieses Umzugs. Die Website liegt bei Netlify und liest
ihre Inhalte über **eine einzige Adressangabe** aus dem WordPress. Der Umzug ändert
genau diese eine Angabe:

```
vorher:   staging.finanzleser.de
nachher:  cms.finanzleser.de
```

Daraus folgt der Ablauf:

| Phase | Zustand der Live-Website |
|:------------------------|:--------------------------------------|
| heute | läuft, liest aus dem alten CMS |
| Aufbau des neuen CMS | **läuft unverändert weiter** |
| Prüfung des neuen CMS | **läuft unverändert weiter** |
| Umschaltung | wenige Minuten, dann liest sie aus dem neuen CMS |
| Falls etwas nicht stimmt | zwei Klicks zurück, altes CMS läuft noch |

Es gibt also **keinen Stichtag, an dem die Seite offline geht**, und keinen Zeitdruck.
Der übliche Umzugsschmerz — Adresseinträge umstellen und hoffen, dass alles steht —
entfällt vollständig, weil sich nur eine Adresse *hinter* dem Auslieferungsnetz ändert,
nicht die davor.

## Die Domain wird nicht angefasst

`finanzleser.de` und `www.finanzleser.de` bleiben unverändert bei Netlify. Es kommen
lediglich zwei neue Einträge hinzu (`cms.` und `cms-dev.`), die auf den neuen Webspace
zeigen. Bestehende Einträge werden nicht verändert.

**Die Domain bleibt im alten Vertrag — und die sieben E-Mail-Postfächer damit auch.**
Ein Verschieben der Domain in den neuen Vertrag würde nach Angaben von IONOS *alle
E-Mail-Adressen der Domain löschen*; die Postfächer blieben zwar als Daten erhalten,
müssten aber im neuen Vertrag einzeln neu angelegt und migriert werden. Bei sieben
Postfächern ist das ein reales Risiko ohne erkennbaren Gegenwert. E-Mail und Webspace
sind bei IONOS ohnehin voneinander unabhängig: Das Abschalten des alten Webspace berührt
die Postfächer nicht.

\newpage

# Sicherheit von Anfang an

Der Aufbau des neuen CMS folgt einer Grundregel: **Vom alten Server kommen nur Inhalte,
kein Programmcode.**

| Was | Woher |
|:--------------------------------------------|:---------------------------|
| Artikel, Bilder, Einstellungen, Rechner, Checklisten | vollständig vom alten System |
| WordPress-Kern | frisch von wordpress.org |
| Fremd-Plugins, Design-Vorlage | frisch vom jeweiligen Hersteller |
| Eigener Programmcode | aus der Versionsverwaltung |

Alles, was vom kompromittierten Server käme, müsste einzeln auf Manipulation geprüft
werden. Frisch geladen ist es beweisbar sauber — und schneller.

## Weitere Maßnahmen

- **Automatische Sicherung außerhalb von IONOS.** Der Punkt, der beim Vorfall gefehlt
  hat. Eine Sicherung, die auf demselben Server liegt wie das System, ist keine.
- **Getrennte Passwörter.** Auf dem alten Webspace waren Datenbank- und Dateizugang
  identisch — und das Datenbank-Passwort steht bei WordPress systembedingt unverschlüsselt
  in einer Konfigurationsdatei. Wer diese eine Datei lesen konnte, hatte damit beides.
- **Automatische Sicherheitsupdates.** Auf dem alten System waren sie per Konfiguration
  abgeschaltet. Das ist die dokumentierte Ursache dafür, dass der Patch gegen die
  ausgenutzte Lücke nie ankam.
- **Adressen fest verankert.** Die Adressfelder werden in der Konfigurationsdatei
  festgeschrieben und dadurch im WordPress-Backend gesperrt. Der Ausfall vom 18. August
  entstand dadurch, dass sie dort verstellt wurden; das ist danach technisch nicht mehr
  möglich.
- **Zwei-Faktor-Anmeldung** für alle Konten, Abschalten der Benutzerauflistung, Sperren
  der Testumgebung per Passwortschutz.

\newpage

# Was der Umbau am Code erfordert

Der Wechsel der Namen ist nicht rein kosmetisch. Drei Stellen müssen mitgeführt werden:

| Stelle | Änderung |
|:-----------------------------------|:---------------------------------------|
| Bildquellen-Freigabe (`next.config.ts`) | `cms.finanzleser.de` aufnehmen; alte Adresse zunächst behalten, damit ein Rückweg bleibt |
| Umgebungsvariablen (`netlify.toml`) | Zieladresse des CMS je Umgebung |
| **Sperre für Suchmaschinen** (`next.config.ts`) | siehe unten |

## Wichtig: die Sperre für Suchmaschinen

Die Testumgebung darf nicht in Google auftauchen. Die Erkennung dafür prüft derzeit, ob
die Adresse den Bestandteil „staging." enthält. Heißt die Testumgebung künftig
`dev.finanzleser.de`, **greift diese Prüfung nicht mehr — die Testumgebung wäre
indexierbar.**

Die Prüfung wird deshalb umgedreht: Statt „ist das die Testumgebung? → sperren" gilt
künftig „ist das nachweislich die Live-Website? → freigeben, sonst sperren". Damit führt
jede unerwartete Konfiguration zur sicheren Variante statt zur riskanten.

\newpage

# Bereits erledigt

- **Eigener Programmcode gesichert und versioniert.** Elf Erweiterungen, die zuvor
  ausschließlich auf dem gehackten Server existierten, liegen jetzt in der
  Versionsverwaltung. Alle Dateien wurden auf Syntaxfehler geprüft.
- **Sicherungsstand geprüft.** Der Stand vom 11. August wurde gegen das laufende System
  abgeglichen und ist inhaltlich aktuell — am Backend wird derzeit nicht gearbeitet. Es
  geht beim Umzug nichts verloren.
- **Neuer Webspace identifiziert und geprüft.** IONOS, neuer Vertrag auf neuer
  Infrastruktur, Dateizugang funktioniert.
- **Umzugsplan vollständig**, inklusive Rückweg für jeden einzelnen Schritt.

\newpage

# Was jetzt gebraucht wird

Vom Kunden liegt bisher nur der **Dateizugang** (SFTP) vor. Der reicht nicht: Über SFTP
lassen sich Dateien hochladen, aber keine Datenbank anlegen und keine Adresse vergeben.
Ohne Datenbank läuft kein WordPress, ohne Unteradresse ist es nicht erreichbar. Beides
geht ausschließlich über das IONOS-Kundencenter.

**Der kürzeste Weg ist ein Zugang zum Kundencenter des neuen Vertrags.** Dann sind die
Punkte 1 bis 4 in etwa zwanzig Minuten erledigt, ohne weitere Abstimmung. Andernfalls
muss der Kunde sie einzeln anlegen und die Ergebnisse zurückmelden.

## Die sechs Punkte

| Nr. | Anzulegen | Wo im Kundencenter | Was zurückkommen muss |
|:--|:-------------------------|:----------------------|:--------------------------|
| 1 | **Zwei MySQL-Datenbanken** | Hosting → Datenbanken | je Datenbank: Name, Benutzer, Passwort, Hostname |
| 2 | **Drei Adressen** — zwei auf den Webspace, eine auf Netlify (siehe unten) | Domains & SSL → Subdomain bzw. DNS | kurze Bestätigung |
| 3 | **SSL für `cms.` und `cms-dev.`** (Let's Encrypt, im Paket enthalten) | Domains & SSL → SSL-Zertifikat | kurze Bestätigung |
| 4 | **PHP 8.3+** einstellen, **SSH** freischalten | Hosting → PHP / SSH | kurze Bestätigung |
| 5 | — | — | Auskunft: liegt ein **weiteres Projekt** im selben Webspace? |
| 6 | — | — | **Lizenzschlüssel** ACF Pro und Yoast SEO Premium |

## Die drei Adressen im Einzelnen

🚨 **Das sind zwei verschiedene Vorgänge im Kundencenter.** Die ersten beiden werden mit
dem Webspace verbunden, die dritte ausdrücklich nicht — sie zeigt auf Netlify.

| Adresse | Anzulegen als | Ziel |
|:-------------------------------|:--------------------------------|:-------------------------------------------|
| `cms.finanzleser.de` | Subdomain **auf den Webspace** | Ordner `/cms` |
| `cms-dev.finanzleser.de` | Subdomain **auf den Webspace** | Ordner `/cms-dev` |
| `dev.finanzleser.de` | **DNS-Eintrag, Typ CNAME** | `dev--finanzleser-production.netlify.app` |

Wird `dev.finanzleser.de` versehentlich als Webspace-Subdomain angelegt, zeigt die
Test-Website auf einen leeren Ordner. Um ihr SSL-Zertifikat kümmert sich Netlify selbst;
im Kundencenter ist dafür nichts zu tun.

Das CNAME-Ziel darf schon jetzt auf den künftigen Netlify-Namen gesetzt werden, obwohl
die Umbenennung erst später erfolgt: `*.netlify.app` ist ein Wildcard — jeder Name unter
dieser Domain löst auf dieselben Netlify-Adressen auf, und Netlify entscheidet anhand der
angefragten Domain, welche Seite es ausliefert. Es gibt hier also keine
Reihenfolge-Abhängigkeit.

## Was an diesen Punkten wichtig ist

**Zu 1 — die Passwörter müssen sich unterscheiden.** Auf dem alten Webspace war das
Datenbank-Passwort identisch mit dem Passwort für den Dateizugang. WordPress legt sein
Datenbank-Passwort systembedingt unverschlüsselt in einer Konfigurationsdatei ab — wer
also diese eine Datei lesen konnte, hatte damit automatisch auch vollen Dateizugriff auf
den gesamten Webspace. Zwei verschiedene Passwörter kosten nichts und brechen diese Kette.

**Zu 1 — falls das Paket nur eine Datenbank enthält:** kurze Rückmeldung genügt. Es gibt
einen Behelfsweg, aber er trennt die beiden Systeme schlechter. Ein Upgrade auf zwei
Datenbanken kostet bei IONOS nur wenige Euro monatlich und ist die sauberere Lösung.

**Zu 4 — SSH ist kein Muss, aber eine deutliche Ersparnis.** Mit SSH wird das Erzeugen
der Testkopie ein einzelner Befehl. Ohne SSH ist es jedes Mal Handarbeit über mehrere
Schritte — bei einer Kopie, die bewusst häufig neu erzeugt werden soll, summiert sich das.

**Zu 5 — dieser Punkt stammt aus dem Sicherheitsbericht vom August.** Dort war vermerkt,
dass eine erneute Infektion über ein anderes Projekt im selben Webspace möglich ist.
Geklärt wurde er nie. Beim neuen Webspace sollte er vor dem Aufbau beantwortet sein und
nicht nach dem nächsten Vorfall.

**Zu 6 — beide Erweiterungen werden neu installiert, nicht kopiert.** Alles, was vom
kompromittierten Server käme, müsste einzeln auf Manipulation geprüft werden. Frisch beim
Hersteller geladen ist es beweisbar sauber und schneller. Die Inhalte bleiben davon
unberührt und kommen vollständig mit.

## Reihenfolge

Punkt **1 und 2 sind die eigentliche Blockade** — ohne Datenbank und Webspace-Adresse
lässt sich kein WordPress installieren und damit nichts vom Rest beginnen. Punkt 3 und 4
werden erst danach gebraucht, Punkt 5 und 6 zum Schluss.

Der DNS-Eintrag für `dev.` aus Punkt 2 hat dabei die längste Leine: Die Test-Website wird
erst gebraucht, wenn das neue CMS bereits steht. Er ist trotzdem gleich mit aufgeführt,
damit alle Adress-Einträge in einem Arbeitsgang erledigt sind statt in zweien.

Es lohnt sich also nicht, auf Vollständigkeit zu warten: Sobald 1 und 2 stehen, kann die
Arbeit anfangen.
