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

Unten unter **„Vorhandene Sicherungen"** stehen die Einträge vom Mai. Jede Zeile hat fünf
Knöpfe:

| Datenbank | Plugins | Themes | Uploads | Andere |
|---|---|---|---|---|

- Auf **jeden einzelnen** klicken. UpdraftPlus bereitet die Datei vor, danach erscheint
  „Herunterladen"
- **Alle Teile holen.** Große Uploads werden zerlegt (`...uploads.zip`, `...uploads2.zip`,
  `...uploads3.zip`, …). Fehlt ein Stück, ist das ganze Backup wertlos
- Ablegen in einem Ordner namens:

```
finanzleser-backup-2026-05-07_SAUBERE-REFERENZ
```

> Fehlt in einer Zeile einer der fünf Knöpfe, war schon dieses alte Backup unvollständig.
> Kein Drama — kurz notieren und weitermachen.

---

## Schritt 2 — Neues Backup: NUR die Datenbank

Reiter **„Sicherung / Wiederherstellung"** → Knopf **„Jetzt sichern"**.

Im Fenster, das aufgeht:

| Option | Einstellung |
|---|---|
| Datenbank in die Sicherung einbeziehen | ☑ **an** |
| Dateien in die Sicherung einbeziehen | ☐ **aus** |
| Diese Sicherung nur manuell löschen lassen | ☑ **an** |

Das dritte Häkchen ist wichtig — sonst räumt die automatische Aufbewahrung dein Backup
irgendwann selbst wieder weg.

→ **„Jetzt sichern"** klicken. Dauert typisch 1–3 Minuten.

**Fertig ist es erst, wenn im Protokoll steht:**

> *„Die Sicherung ist offenbar erfolgreich und nun abgeschlossen"*

**Falls es abbricht:** Reiter **„Einstellungen"** → ganz unten **„Erweiterte Einstellungen"**
→ den Wert für die Aufteilungsgröße halbieren → erneut versuchen.

---

## Schritt 3 — Neues Backup: NUR die Dateien

Nochmal **„Jetzt sichern"**, diesmal genau umgekehrt:

| Option | Einstellung |
|---|---|
| Datenbank in die Sicherung einbeziehen | ☐ **aus** |
| Dateien in die Sicherung einbeziehen | ☑ **an** |
| Diese Sicherung nur manuell löschen lassen | ☑ **an** |

Das dauert deutlich länger als die Datenbank — die Mediathek ist groß. Browser-Tab offen
lassen.

**Falls es abbricht:** Unter **„Einstellungen"** kann man auswählen, welche Dateitypen
gesichert werden. Dann in zwei Läufen:

1. Lauf: nur **Uploads**
2. Lauf: **Plugins** + **Themes** + **Andere**

---

## Schritt 4 — Herunterladen

Beide neuen Einträge, alle Teile, genau wie in Schritt 1.

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

### a) Ist das Mai-Backup wirklich sauber?

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
