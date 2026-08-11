# Befund: Hintertür auf staging.finanzleser.de

**Erstellt: 11.08.2026** · Quelle: UpdraftPlus-Backup vom 11.08.2026 (DB 10:15, Dateien 10:20/10:24)
**Analyse rein statisch** — kein Code wurde ausgeführt, nur Archive gelesen und Zeichenketten ausgewertet.

---

## Zusammenfassung

Auf dem System war eine als WordPress-Plugin getarnte Hintertür installiert, und zwar als
**Must-Use-Plugin**. Diese laden bei **jedem** Seitenaufruf automatisch und lassen sich im
Adminbereich weder sehen noch deaktivieren — deshalb tauchte sie in keiner Plugin-Liste auf.

Die Datei selbst ist zum Zeitpunkt des Backups **nicht mehr vorhanden** (vermutlich bereits
von der Security-Firma entfernt). **Der Wiederherstellungs-Apparat in der Datenbank ist
jedoch vollständig intakt, und zwei Kopien des Installers liegen weiterhin im Dateisystem.**

> ⚠️ **Das Entfernen der Datei allein genügt nicht.** Genau dafür existiert der
> Mechanismus `sc_persist_manifest` / `sc_last_recovery_check`: Er prüft, ob die Datei noch
> da ist, und stellt sie wieder her. Solange die Datenbank-Einträge und die beiden ZIP-Archive
> bestehen, ist mit einer Neuinstallation zu rechnen.

---

## 1. Die Schaddatei

| | |
|---|---|
| **Dateiname** | `blaze-updater-pad.php` |
| **Installationsort** | `/homepages/33/d373686176/htdocs/staging-fl/wp-content/mu-plugins/` |
| **Größe** | 190.334 Bytes · 5.202 Zeilen |
| **SHA-256** | `02594001789b307d5d6de487610f5f5d267d652dca6925d684ee78ddd3ec5b3f` |
| **Interne Version** | 4.0.3 |
| **Zeitstempel (Datei im Archiv)** | 04.08.2026 03:35 |

Gefälschter Plugin-Kopf zur Tarnung:

```
Plugin Name: Blaze Updater Pad
Plugin URI:  https://adams.dev/plugins/blaze-updater-pad/
Description: Intelligent asset management utility
Author:      Logan Adams
Version:     1.1.4
```

Ein Plugin dieses Namens existiert im offiziellen WordPress-Verzeichnis nicht. Die im Kopf
genannte Version (1.1.4) weicht von der intern gespeicherten (4.0.3) ab.

Direkt hinter dem Kopf beginnt verschleierter Code: eine Dekodierfunktion mit zufälligem
Namen (`ydktuwanzhkqo`) und eine XOR-kodierte Zeichenketten-Tabelle. Gefährliche
PHP-Funktionen stehen dadurch nicht im Klartext — im Code selbst sind lediglich `gzinflate`
(2×) und 36 `add_action`-Aufrufe direkt sichtbar.

**Der Zeitstempel 04.08.2026 03:35 entspricht exakt der ersten Fremd-Anmeldung** in den
WordPress-Sitzungen (siehe Abschnitt 4).

---

## 2. Die Installer-Archive — noch im Dateisystem

Zwei **identische** Kopien, beide mit zurückdatiertem Zeitstempel zur Tarnung:

| Pfad | Zeitstempel (gefälscht) |
|---|---|
| `wp-content/themes/twentytwentyfive/845a5f6d.zip` | 01.10.2024 16:43 |
| `wp-content/uploads/2026/08/845a5f6d.zip` | 11.11.2025 21:43 |

| | |
|---|---|
| **Größe** | 59.032 Bytes |
| **SHA-256** | `7aed1ef8e9a0e4761b74169b7368e8288afc9956d7ff5482011e4b5bdf1a8782` |
| **Inhalt** | genau eine Datei: `blaze-updater-pad/blaze-updater-pad.php` |

Das Verzeichnis `uploads/2026/08/` wurde am **04.08.2026 um 03:35** angelegt — ebenfalls
identisch mit der ersten Fremd-Anmeldung.

---

## 3. Wiederherstellungs-Apparat in der Datenbank (`wp_options`)

**Selbsterhaltung:**

| Option | Wert | Bedeutung |
|---|---|---|
| `sc_persist_manifest` | `a:1:{s:86:"…/mu-plugins/blaze-updater-pad.php";s:17:"190334\|1786323625";}` | Merkt sich Pfad, Größe und Zeitstempel der eigenen Datei. Zeitstempel = **Mo 10.08.2026 03:00:25** |
| `sc_last_recovery_check` | `1786322485` | Letzte Selbstprüfung: **Mo 10.08.2026 02:41:25** |

**Getarnter Verweis auf die eigene Datei:**

| Option | Wert |
|---|---|
| `e74601b1b835` | `4.0.3\|php.dap-retadpu-ezalb` |

Der zweite Teil ist `blaze-updater-pad.php` **rückwärts geschrieben**.

**Nutzlast und Konfiguration** — 16 Optionen mit hexadezimalen Zufallsnamen, `autoload=off`:

| Option | Größe | Anmerkung |
|---|---|---|
| `7e1fbe4a9185` | 253.796 Zeichen | |
| `188031f8ead8` | 157.288 Zeichen | |
| `7f3b2f1573` | 78.500 Zeichen | beginnt mit `H4sIA…` = **gzip**, base64-kodiert |
| `379ad01d8c08` | 38.696 Zeichen | |
| `f584f6977c2c` | 53.860 Zeichen | |
| `9c9a55f0ec25` | 128 Zeichen | |
| `005b826a6ab3` | 116 Zeichen | |
| `89ae22bcaa3a` | 72 Zeichen | |
| `58e2721dcf5d` | 44 Zeichen | |
| `db05451aba` | 44 Zeichen | Inhalt dekodiert: `{"__last_checked__":"1505659474"}` |
| `05c1b9b773` | 44 Zeichen | Inhalt dekodiert: `{"__last_checked__":"1505215328"}` |
| `b5717761427c` | 36 Zeichen | |
| `bcd8c2a17f9c` | 32 Zeichen | |
| `69196134209f` | 56 Zeichen | |

Gesamt rund **580.000 Zeichen** kodierter Daten in der Optionstabelle.

---

## 4. Zeitlicher Ablauf

| Zeitpunkt (deutsche Zeit) | Ereignis |
|---|---|
| **Di 04.08.2026 03:35** | Erste automatisierte Fremd-Anmeldung · Anlage von `uploads/2026/08/` · Zeitstempel der Schaddatei |
| 04.08.–09.08. | Automatisierte Anmeldungen in **alle** Konten, im Takt von ca. 10 Stunden, von wechselnden AWS-IP-Adressen. Zeitstempel über alle Konten sekundengleich |
| **So 09.08. 10:32:31** | Anlage von vier Administratorkonten, alle in derselben Sekunde |
| **Mo 10.08. 02:41:25** | Letzte Selbstprüfung der Hintertür |
| **Mo 10.08. 03:00:25** | Letzter Eintrag im Selbsterhaltungs-Manifest |
| Di 11.08. 10:15–10:24 | Backup gezogen — Schaddatei bereits entfernt, Datenbank-Einträge und Installer unverändert vorhanden |

Ein weiteres Administratorkonto (`admin_c56a8da4b8`, ID 15) existierte bereits seit
mindestens 04.08. und wurde gelöscht; seine Metadaten mit Administratorrechten liegen noch
in `wp_usermeta`.

**Beteiligte IP-Adressen:** `3.95.156.203` · `34.232.62.191` · `54.226.90.12` ·
`74.7.227.31` · `100.56.10.211` · `3.234.240.54` · `34.229.95.132` · `100.54.255.20` ·
`3.226.251.69` · `44.221.65.175` · `107.20.44.37` · `13.222.7.174` · `3.222.207.232` ·
`18.208.151.254` · `98.82.14.174`

Dass Sitzungen für **alle** Konten gleichzeitig entstanden, ist mit gestohlenen Passwörtern
nicht erklärbar — dafür ist Codeausführung auf dem Server nötig. Das passt zur installierten
mu-plugin-Hintertür.

---

## 5. Was unauffällig ist

Diese Punkte wurden geprüft und ergaben **keinen** Befund:

- **Inhalte unverändert.** Zuletzt bearbeiteter Beitrag: 16.07.2026, also vor dem
  Angriffszeitraum. Kein eingeschleuster Text, keine fremden Links.
- **Mediathek sauber.** 749 Dateien, ausschließlich PDF (601), WebP (147) und ein SVG.
  Keine PHP-, JavaScript- oder Archivdateien außer den unter Abschnitt 2 genannten.
- **`wp-content/uploads/.htaccess`** enthält `<Files *.php> deny from all` — eine
  Schutzregel, vermutlich von Sucuri Scanner.
- **`themes/twentytwentyfive/functions.php`** enthält ausschließlich eigenen Code
  (ACF-Feldgruppe für Kategoriebilder). Keine Verschleierung, keine verdächtigen Aufrufe.
  Der Zeitstempel 10.08. 03:00 dürfte vom Wiederherstellungslauf stammen.
- **`advanced-cache.php`, `db.php`** — leere Platzhalter (nur `<?php`).
- **Die vier neuen Administratorkonten** haben keine Beiträge, keine Seiten, keine
  Medien und keine eigenen Anwendungs-Passwörter angelegt.

---

## 6. Grenzen dieser Analyse

- **Der WordPress-Kern ist nicht im Backup.** UpdraftPlus sichert `wp-content`, nicht
  `wp-admin/`, `wp-includes/` oder die PHP-Dateien im Wurzelverzeichnis. Manipulationen dort
  sind hiermit **nicht** ausgeschlossen.
- **`wp-config.php` liegt ebenfalls nicht im Backup.**
- **Kein sauberer Vergleichsstand.** Backups vom 07.05.2026 existieren nur als
  Listeneinträge; die Archive wurden bei einer Deinstallation von UpdraftPlus im Mai
  entfernt. Ein Datei-Diff gegen einen Zustand vor dem Angriff ist daher nicht möglich.
  Für die zwölf Plugins aus dem offiziellen Verzeichnis bleiben die Prüfsummen von
  wordpress.org; für Eigenentwicklungen (`finanzleser-blocks`,
  `finanzleser-studio-helper`, neun mu-plugins) gibt es keine Referenz.
- Der Schadcode wurde **nicht dekodiert oder ausgeführt**. Über Funktionsumfang,
  Kommandoserver und übertragene Daten lässt sich hier nichts sagen.

---

## 7. Empfehlung

**Die Datei zu löschen genügt nicht.** Mit zu entfernen sind:

1. Beide Installer-Archive `845a5f6d.zip` (Theme-Ordner und Mediathek)
2. `sc_persist_manifest` und `sc_last_recovery_check` in `wp_options`
3. Die 16 Optionen mit hexadezimalen Zufallsnamen (Liste in Abschnitt 3)
4. Die verwaisten `wp_usermeta`-Einträge des gelöschten Kontos ID 15
5. Das gesamte `wp-content/mu-plugins/`-Verzeichnis prüfen — dort gehören ausschließlich
   diese neun Dateien hin:
   `finanzleser-anbieter.php` · `finanzleser-block-passthrough.php` ·
   `finanzleser-config.php` · `finanzleser-cpt-excerpt.php` · `finanzleser-dokumente.php` ·
   `finanzleser-headless.php` · `finanzleser-kategorie-bilder.php` ·
   `finanzleser-noindex.php` · `finanzleser-site-settings.php`

Solange Punkt 2 und 3 bestehen, ist von einer Wiederherstellung der Hintertür auszugehen.
