# WordPress-Backup — Schritt für Schritt

**Stand: 11.08.2026** · Für: staging.finanzleser.de (= das Live-CMS)
**Anlass:** Einbruch über die Sicherheitslücke wp2shell. Eine Security-Firma arbeitet parallel am Fall.

---

## Vorab: Reichen die alten Backups vom 7. Mai?

**Nein — aber wirf sie auf keinen Fall weg. Du brauchst beide.**

```
07.05.2026  ←  deine alten UpdraftPlus-Backups
                       ↓  danach 3 Monate Redaktionsarbeit
17.07.2026  ←  Sicherheitslücke wird bekannt, Angriffswelle startet
~19.07.2026 ←  mutmaßlicher Einbruch
10.08.2026  ←  vier fremde Administrator-Konten entdeckt
```

Das Mai-Backup liegt **zwei Monate vor dem Angriff**. Damit ist es sehr wahrscheinlich die
einzige nachweislich saubere Kopie, die überhaupt existiert. Für die Security-Firma ist das
wertvoll: Sie kann damit vergleichen, welche Dateien sich seither verändert haben, statt zu
raten.

Ersetzen kann es das neue Backup trotzdem nicht — drei Monate Inhalte fehlen darin.

> ⚠️ Die alten Backups liegen seit drei Monaten auf einem Server, auf dem jemand
> eingebrochen ist. Sehr wahrscheinlich unberührt — aber genau deshalb heute herunterladen
> und nicht dort liegen lassen.

---

## Die Reihenfolge (bitte nicht abkürzen)

1. **Zuerst** die alten Mai-Backups herunterladen — die sind unersetzlich
2. **Dann** neu sichern: erst nur die Datenbank, prüfen, dann die Dateien
3. **Zum Schluss** alles herunterladen und vom Server löschen

**Warum Datenbank und Dateien getrennt?** Bei großen Mediatheken bricht UpdraftPlus auf
diesem Hosting gerne mitten im Lauf ab. Der tückische Fall ist ein Archiv, das *vollständig
aussieht*, aber keins ist. Wenn man beides getrennt laufen lässt, merkt man den Abbruch
sofort — und muss nicht alles wiederholen.

---

## Schritt 1 — Alte Backups sichern (zuerst!)

Im WordPress-Menü: **Einstellungen → UpdraftPlus Backups**
Reiter: **„Sicherung / Wiederherstellung"**

Unten unter **„Vorhandene Sicherungen"** stehen die Einträge vom Mai. Auf den Knopf
**„Datenbank"** klicken — UpdraftPlus bereitet die Datei vor, danach erscheint
„Herunterladen".

Ablegen in einem Ordner namens:

```
finanzleser-backup-2026-05-07_SAUBERE-REFERENZ
```

### ⚠️ Befund vom 11.08.2026: die alten Dateien sind vermutlich weg

In der Liste stehen zwar Einträge ab dem 30. April, aber **nur mit einem einzigen Knopf
„Datenbank"** — Plugins, Themes und Uploads fehlen. Und der Download liefert
höchstwahrscheinlich nichts.

Der Grund: Als UpdraftPlus im Mai deinstalliert wurde, sind die Archivdateien vom Server
verschwunden. Die Liste selbst lebt aber in der WordPress-Datenbank weiter. Man sieht also
Einträge, hinter denen nichts mehr liegt.

**Kurz gegenprüfen:** Auf „Datenbank" in der Zeile vom 7. Mai klicken. Kommt kein Download
oder eine Fehlermeldung → die Dateien sind tatsächlich weg.

**Was das bedeutet, wenn es sich bestätigt:**

Wir haben dann **keine eigene saubere Kopie aus der Zeit vor dem Einbruch**. Daraus folgen
zwei Dinge:

1. **Das Restore-Angebot von IONOS auf den Stand vom 18.07.2026 wird wichtig.** Es ist dann
   der einzige verfügbare Zustand von vor dem Angriff. Das sollte beim Kunden angesprochen
   werden, bevor IONOS die Frist dafür schließt.
2. **Die Security-Firma muss anders vorgehen.** Statt gegen ein sauberes Backup zu
   vergleichen, prüft man den WordPress-Kern und alle Plugins aus dem offiziellen
   Verzeichnis gegen die Prüfsummen von wordpress.org (`wp core verify-checksums`). Das
   deckt fast alles ab — **außer** den drei selbst entwickelten Bausteinen
   (`finanzleser-anbieter`, `finanzleser-block-passthrough`, `finanzleser-config`) und dem
   Theme. Für die gibt es keine Vergleichsbasis; die muss jemand ansehen, der den Code kennt.

Die leeren Einträge kann man später über **„Lokalen Ordner nach neuen Sicherungssätzen
durchsuchen"** (Reiter „Erweiterte Werkzeuge") aus der Liste räumen. Hat keine Eile.

---

## Schritt 2 — Neues Backup: NUR die Datenbank

Reiter **„Sicherung / Wiederherstellung"** → Knopf **„Jetzt sichern"**.
Es öffnet sich das Fenster **„Eine neue Sicherung erstellen"**:

| Option | Einstellung |
|---|---|
| Deine Datenbank zur Sicherung hinzufügen | ☑ **an** |
| Deine Dateien zur Sicherung hinzufügen | ☐ **aus** |

→ **„Jetzt sichern"** klicken. Dauert typisch 1–3 Minuten.

**Fertig ist es erst, wenn im Protokoll steht:**

> *„Die Sicherung ist offenbar erfolgreich und nun abgeschlossen"*

**Falls es abbricht:** Reiter **„Einstellungen"** → ganz unten **„Erweiterte Einstellungen"**
→ den Wert für die Aufteilungsgröße halbieren → erneut versuchen.

✅ *Erledigt am 11.08.2026, 4:52 Uhr.*

---

## Schritt 3 — Neues Backup: die Dateien, in ZWEI Durchgängen

Nochmal **„Jetzt sichern"**. Diesmal:

| Option | Einstellung |
|---|---|
| Deine Datenbank zur Sicherung hinzufügen | ☐ **aus** *(steht schon aus Schritt 2)* |
| Deine Dateien zur Sicherung hinzufügen | ☑ **an** |

🚨 **Wichtig:** Neben „Deine Dateien zur Sicherung hinzufügen" steht ein **`(...)`**.
Daraufklicken — es klappt eine Liste mit fünf Kästchen auf, und die sind standardmäßig
**alle leer**. Bleiben sie leer, wird trotz gesetztem Haken **nichts** gesichert.

### Durchgang 1 — alles außer der Mediathek

| Kästchen | |
|---|---|
| Plugins | ☑ |
| Themes | ☑ |
| Uploads | ☐ **noch nicht** |
| Unverzichtbare Plugins | ☑ |
| Andere Verzeichnisse, die in wp-content gefunden wurden | ☑ |

Läuft in ein bis zwei Minuten durch.

> **„Unverzichtbare Plugins" ist der wichtigste Punkt der ganzen Sicherung.** Dahinter
> stecken die drei selbst entwickelten Bausteine `finanzleser-anbieter`,
> `finanzleser-block-passthrough` und `finanzleser-config`. Die gibt es nirgendwo sonst —
> nicht im WordPress-Verzeichnis, nicht bei einem Hersteller. Ohne sie funktioniert die
> Verbindung zwischen WordPress und der Website nicht mehr.

### Durchgang 2 — nur die Mediathek

| Kästchen | |
|---|---|
| Plugins | ☐ |
| Themes | ☐ |
| Uploads | ☑ |
| Unverzichtbare Plugins | ☐ |
| Andere Verzeichnisse | ☐ |

Das dauert deutlich länger. Browser-Tab offen lassen.

**Der Sinn der Aufteilung:** Wenn die Mediathek einen Abbruch verursacht, ist trotzdem schon
alles andere gesichert — und du wiederholst nur diesen einen Durchgang statt alles.

### Kein Online-Speicher eingerichtet

Im Fenster steht: *„Sicherungen werden nicht zu einem Online-Speicher gesendet."* Das ist in
Ordnung — du lädst in Schritt 4 von Hand herunter. Ein automatisches Ziel außerhalb von
IONOS richten wir später ein, wenn die Lage beruhigt ist.

---

## Schritt 4 — Herunterladen

Die neuen Einträge zeigen jetzt mehrere Knöpfe: `Datenbank`, `Plugins`, `Themes`, `Uploads`,
`Andere`. **Auf jeden einzelnen klicken** und herunterladen.

**Alle Teile holen.** Große Uploads werden zerlegt (`...uploads.zip`, `...uploads2.zip`,
`...uploads3.zip`, …). Fehlt ein Stück, ist das Backup unbrauchbar.

Ablegen in einem Ordner namens:

```
finanzleser-backup-2026-08-11_UNGEPRUEFT
```

**Der Name „UNGEPRÜFT" ist Absicht.** Dieses Backup entsteht *innerhalb* eines Systems, in
das jemand eingebrochen ist. Als Datenquelle ist es wertvoll — aber es ist **kein sauberer
Wiederherstellungspunkt**. Bitte niemals PHP-Dateien daraus auf einem Server ausführen.

---

## Schritt 5 — Vom Server löschen

Nach dem Download unter **„Vorhandene Sicherungen"** die Einträge löschen (Papierkorb-Symbol).

**Warum:** Die Archive liegen auf dem Server in `wp-content/updraft/`. Normalerweise ist der
Ordner geschützt — auf einem Server, auf dem jemand eingebrochen ist, würde ich mich darauf
nicht verlassen. In diesen Dateien steht die komplette Datenbank inklusive aller
Benutzerdaten.

---

## Schritt 6 — Prüfen (bitte nicht überspringen)

### a) Falls doch ein Mai-Backup herunterladbar war: ist es sauber?

*(Entfällt, wenn sich Schritt 1 bestätigt hat und die alten Dateien weg sind.)*

Die Datenbank-Datei entpacken (Endung `.gz`, Doppelklick genügt). Die entstandene
`.sql`-Datei in einem Texteditor öffnen und nach diesem Text suchen:

```
adm_4f587ad5f3
```

- **Nicht gefunden** → bestätigt: Das Mai-Backup liegt vor dem Einbruch. Sauberer
  Referenzpunkt für die Security-Firma
- **Gefunden** → der Einbruch ist älter als bisher angenommen. Sag mir Bescheid, das ändert
  die Bewertung der Lage

> Die Datei ist groß, der Editor braucht einen Moment. TextEdit reicht; bei sehr großen
> Dateien geht es schneller mit einem Programmier-Editor wie VS Code.

### b) Ist das neue Backup vollständig?

**Im WordPress-Menü die Anzahl gegenprüfen.** So viele sollten es sein (Stand 10.08.2026):

| Inhaltstyp | Anzahl |
|---|---|
| Beiträge | 202 |
| Checklisten | 207 |
| Dokumente | 137 |
| Rechner | 56 |
| Vergleiche | 43 |
| Anbieter | 147 |

**Am Backup-Eintrag selbst:**

- Sind alle fünf Knöpfe da (Datenbank, Plugins, Themes, Uploads, Andere)?
- Ist die Uploads-Datei mehrere hundert Megabyte groß? Nur ein paar Megabyte wäre ein
  Abbruch

**Die drei eigenen Bausteine im Archiv finden.** Das `Andere`- bzw.
`Unverzichtbare Plugins`-Archiv entpacken und nachsehen, ob diese drei Dateien darin sind:

```
finanzleser-anbieter.php
finanzleser-block-passthrough.php
finanzleser-config.php
```

Fehlen sie, war beim Durchgang 1 das Kästchen „Unverzichtbare Plugins" nicht gesetzt —
dann bitte diesen Durchgang wiederholen.

---

## Schritt 7 — Der Security-Firma Bescheid geben

Ein Plugin, das während einer laufenden Einbruchsuntersuchung **neu auftaucht**, ist genau
das Signal, nach dem gesucht wird. Wenn das niemand einordnet, sucht die Firma womöglich in
die falsche Richtung.

Text zum Weitergeben:

> UpdraftPlus wurde am 10.08.2026 von uns installiert, um vor der Bereinigung ein Backup zu
> ziehen. Das Verzeichnis `wp-content/updraft/` stammt daher.
>
> Zusätzlich liegt ein Backup vom 07.05.2026 gesichert vor — also aus der Zeit vor dem
> Angriffszeitraum. Es kann als Vergleichsbasis dienen, um veränderte Dateien zu
> identifizieren.

Der zweite Absatz ist der eigentlich hilfreiche.

---

## Was danach kommt

Erst wenn das Backup steht und geprüft ist:

1. **WordPress auf Version 7.0.3 aktualisieren** — damit ist die Sicherheitslücke zu.
   Alle installierten Plugins sind für 7.0 freigegeben, das habe ich geprüft
2. Die vier fremden Administrator-Konten löschen
3. **Alle Anwendungs-Passwörter zurückziehen** — das ist der stille Hintereingang, den man
   beim normalen Passwortwechsel übersieht
4. Sicherheitsschlüssel in der `wp-config.php` erneuern
5. Alle Passwörter neu setzen, auch das IONOS-Konto und das zugehörige E-Mail-Postfach
6. Malware-Scanner installieren, automatische Updates einschalten, Zwei-Faktor-Anmeldung

> **Wichtig:** Das Update schließt die Tür, wirft aber niemanden hinaus. Abgelegte
> Schaddateien und noch gültige Anwendungs-Passwörter überleben es. Die Schritte 2–6 bleiben
> also notwendig.

Für später, wenn Ruhe eingekehrt ist: ein automatisches tägliches Backup einrichten, mit
Ziel **außerhalb von IONOS** (Google Drive, Dropbox oder ähnliches). Ein Backup, das auf
demselben Server liegt wie die Seite, hilft im Ernstfall nicht.

---

## Wenn etwas nicht so heißt wie hier beschrieben

UpdraftPlus beschriftet je nach Version leicht unterschiedlich. Sag mir einfach, wie es bei
dir auf dem Bildschirm heißt — dann passe ich die Anleitung an, damit sie wortgleich zu dem
passt, was du siehst.
