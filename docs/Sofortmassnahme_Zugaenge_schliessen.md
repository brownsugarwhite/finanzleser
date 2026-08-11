# Sofortmaßnahme: Fremdzugänge schließen

**Stand: 11.08.2026** · System: `staging.finanzleser.de` (= das Live-CMS)
**Dauer: ca. 20 Minuten** · **Voraussetzung: Das Backup ist gezogen und geprüft ✅**

---

## Warum das nicht auf die Security-Firma warten kann

Aus dem Datenbank-Backup: Vom 4. bis 9. August hat sich alle rund zehn Stunden ein
automatisiertes Werkzeug in **alle** WordPress-Konten eingeloggt — auch in `flandeik`,
in Nicoles und in dein Konto. Die Zeitstempel sind über alle Konten hinweg sekundengleich,
die IP-Adressen wechseln (überwiegend AWS-Server).

**Diese Anmeldungen sind bis zum 23. August gültig.** Der Angreifer kann sich jederzeit
wieder anmelden, ohne ein Passwort zu kennen.

Diese Maßnahme **stört die Untersuchung nicht**: Sie löscht keine Datei, keine Log-Zeile
und keine Datenbankzeile. Die Sitzungseinträge bleiben als Beweismittel erhalten — nur die
zugehörigen Cookies werden wertlos.

**Was hier NICHT gemacht wird** (das gehört der Firma, weil es Spuren vernichtet):
fremde Konten löschen · Dateien säubern · WordPress-Kern aktualisieren.

---

## Vorbereitung

**a) Nicole vorwarnen.** Sie wird abgemeldet, und **„Content Studio" verliert die
Verbindung zu WordPress** und muss danach neu verbunden werden. Das sollte sie wissen,
bevor es passiert, nicht danach.

**b) SFTP-Zugang bereitlegen.** Host `home373686176.1and1-data.host`, Benutzer
`acc725937113`. Die Datei liegt im Ordner der Seite (`staging-fl/wp-config.php`).

**c) Ruhe bewahren, falls die Seite kurz hakt.** `www.finanzleser.de` läuft auf Netlify und
liefert zwischengespeicherte Seiten aus. Selbst wenn WordPress ein paar Minuten Fehler
wirft, merken Besucher nichts.

---

## Schritt 1 — `wp-config.php` sichern (Sicherheitsnetz)

Per SFTP die Datei `wp-config.php` **herunterladen** und lokal ablegen als:

```
wp-config.php.backup-2026-08-11
```

Nicht überspringen. Wenn beim Bearbeiten etwas schiefgeht, ist das die Rettung: Datei
zurückspielen, alles ist wie vorher.

---

## Schritt 2 — Neue Sicherheitsschlüssel holen

Diese Adresse im Browser aufrufen:

```
https://api.wordpress.org/secret-key/1.1/salt/
```

Es erscheinen **acht Zeilen** Zufallswerte. Bei jedem Aufruf sind sie neu — einfach die
Seite offen lassen.

> **Warum du das selbst machst und nicht ich:** Diese acht Zeilen sind das neue Schloss
> deiner Seite. Geheimnisse sollten nicht durch Dritte laufen, auch nicht durch mich.
> Hol sie direkt von WordPress.org und setz sie direkt ein.

---

## Schritt 3 — Den Block in `wp-config.php` austauschen

Datei im Texteditor öffnen. Etwa im ersten Drittel steht ein Block, der so aussieht:

```php
/**#@+
 * Authentication unique keys and salts.
 * ...
 */
define( 'AUTH_KEY',         'irgendein-langer-zufallstext' );
define( 'SECURE_AUTH_KEY',  'irgendein-langer-zufallstext' );
define( 'LOGGED_IN_KEY',    'irgendein-langer-zufallstext' );
define( 'NONCE_KEY',        'irgendein-langer-zufallstext' );
define( 'AUTH_SALT',        'irgendein-langer-zufallstext' );
define( 'SECURE_AUTH_SALT', 'irgendein-langer-zufallstext' );
define( 'LOGGED_IN_SALT',   'irgendein-langer-zufallstext' );
define( 'NONCE_SALT',       'irgendein-langer-zufallstext' );
/**#@-*/
```

**Genau diese acht `define(...)`-Zeilen** durch die acht neuen aus Schritt 2 ersetzen.

Die Kommentarzeilen drumherum (`/**#@+` und `/**#@-*/`) bleiben stehen.

⚠️ **Nichts anderes in der Datei anfassen.** Insbesondere nicht:
- die Datenbank-Zugangsdaten (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`)
- die Zeile `$table_prefix`
- kein Leerzeichen und keine Leerzeile **vor** dem `<?php` ganz oben

Datei speichern und per SFTP **zurückspielen** (überschreiben).

**Wirkung: sofort.** In dem Moment, in dem die Datei auf dem Server liegt, ist jede
bestehende Anmeldung ungültig — deine, Nicoles, und die des Angreifers.

### Falls die Seite danach einen Fehler zeigt

Kein Grund zur Panik: `wp-config.php.backup-2026-08-11` zurückspielen, dann ist alles wie
vorher. Häufigste Ursache ist ein fehlendes Semikolon oder ein Anführungszeichen zu viel.
In dem Fall: melde dich, wir schauen gemeinsam drauf.

---

## Schritt 4 — Neu anmelden und Passwörter ändern

Auf `staging.finanzleser.de/wp-admin` anmelden — **mit dem bisherigen Passwort**, das ist
weiterhin gültig.

Dann **Benutzer → Dein Profil** → ganz unten **„Neues Passwort erstellen"** → speichern.

Dasselbe für die beiden anderen echten Konten:

| ID | Anmeldename | Wer |
|---|---|---|
| 9 | `flandeik` | Redaktion (eikelmeier@finanzleser.de) |
| 11 | `NiHa49FraKar$` | Nicole (hahn@finconext.de) |
| 13 | `flofre.BCN` | Du |

> Nicoles und flandeiks Passwort kannst du als Administrator direkt setzen
> (**Benutzer → Alle Benutzer → Bearbeiten**) oder die beiden es selbst machen lassen.
> Wichtig ist nur: Es passiert heute.

**Falls die Anmeldung nicht klappt** (der Angreifer könnte ein Passwort geändert haben):
„Passwort vergessen" auf der Anmeldeseite nutzen. Kommt auch da nichts an, melde dich —
dann gehen wir über SFTP.

---

## Schritt 5 — Die drei Anwendungs-Passwörter widerrufen

**Das ist der eigentliche Kern der Maßnahme.** Anwendungs-Passwörter überleben sowohl den
Schlüsseltausch aus Schritt 3 als auch den Passwortwechsel aus Schritt 4. Sie sind ein
separater Nebeneingang.

**Bei deinem Konto** (Benutzer → Dein Profil → runterscrollen zu **„Anwendungspasswörter"**):

| Name | Widerrufen? | Auswirkung |
|---|---|---|
| `Claude Code Local` | ✅ ja | keine — zeigt auf die lokale Installation |

**Bei Nicoles Konto** (Benutzer → Alle Benutzer → Nicole → Bearbeiten → runterscrollen):

| Name | Widerrufen? | Auswirkung |
|---|---|---|
| `Staging-NextJS-20260507-1052` | ✅ ja | keine — gehörte zu den erledigten Migrations-Skripten |
| `Content Studio` | ✅ ja | **Content Studio verliert die Verbindung und muss neu verbunden werden** |

Es gibt einen Knopf **„Widerrufen"** je Eintrag, und einen für alle auf einmal.

> Geprüft: Die laufende Website benutzt **kein** Anwendungs-Passwort gegenüber WordPress —
> sie liest anonym über GraphQL. Es geht also nichts an der Seite kaputt.

---

## Schritt 6 — Kontrolle

1. **Abmelden und neu anmelden.** Klappt das, ist der Schlüsseltausch sauber durchgelaufen.
2. **Benutzer → Alle Benutzer:** Es müssen weiterhin 7 Einträge sein.
   **Die vier fremden Konten bleiben vorerst stehen** — die löscht die Firma, sie sind
   Beweismittel.
3. **In beiden Profilen prüfen:** Unter „Anwendungspasswörter" darf nichts mehr stehen.
4. **Website aufrufen:** `www.finanzleser.de` und `staging.finanzleser.de` — beide normal?

---

## Schritt 7 — Der Security-Firma Bescheid geben

Text zum Weitergeben:

> Am 11.08.2026 haben wir auf `staging.finanzleser.de` die Sicherheitsschlüssel in der
> `wp-config.php` erneuert, die Passwörter der drei legitimen Konten geändert und drei
> Anwendungs-Passwörter widerrufen. Es wurden **keine** Dateien, Log-Einträge oder
> Datenbankzeilen gelöscht. Die vier unbekannten Administratorkonten stehen unverändert.
>
> Befunde aus dem Datenbank-Backup vom 11.08.2026:
>
> - Automatisierte Fremd-Anmeldungen in **alle** Konten, im Takt von ca. 10 Stunden,
>   vom **04.08. bis 09.08.2026**. Zeitstempel über alle Konten sekundengleich.
> - Beteiligte IP-Adressen u. a.: `3.95.156.203`, `34.232.62.191`, `54.226.90.12`,
>   `3.234.240.54`, `34.229.95.132`, `3.226.251.69`, `44.221.65.175`, `107.20.44.37`,
>   `13.222.7.174`, `3.222.207.232`, `18.208.151.254`, `98.82.14.174`
> - Vier Administratorkonten angelegt am **09.08.2026 um 08:32:31** — alle in derselben
>   Sekunde, also per Skript: `adm_eca43b986e` (ID 16), `admin_2088d8aecc` (17),
>   `admin_0503829c0f` (18), `adm_4f587ad5f3` (19)
> - Ein weiteres Konto `admin_c56a8da4b8` (ID 15) existierte bereits seit spätestens
>   04.08. und wurde gelöscht; seine Metadaten mit Administratorrechten liegen noch in
>   `wp_usermeta`
> - Kein Hinweis auf veränderte Inhalte: Der zuletzt bearbeitete Beitrag stammt vom
>   16.07.2026. Die Mediathek enthält 749 Dateien, ausschließlich PDF/WebP/SVG — keine
>   PHP-, JS- oder Archivdateien.
> - Die fremden Konten haben keine eigenen Anwendungs-Passwörter angelegt.
>
> Ein Backup vom 07.05.2026 (vor dem Angriffszeitraum) existiert **nicht** mehr — die
> Archive wurden bei einer Deinstallation von UpdraftPlus im Mai entfernt. Als
> Vergleichsbasis kommen daher nur die offiziellen Prüfsummen von wordpress.org in
> Betracht. Für die zwölf Plugins aus dem offiziellen Verzeichnis funktioniert das; für
> die eigenentwickelten Bestandteile (`finanzleser-blocks`, `finanzleser-studio-helper`,
> neun mu-plugins, Theme) gibt es keine Referenz.

---

## Danach — nicht heute, aber bald

- **`WP_REVALIDATE_SECRET` und `WP_PREVIEW_SECRET` erneuern.** Beide stehen im mu-plugin
  auf dem Server und in der Netlify-Konfiguration; wer Admin war, konnte sie lesen. Das
  Risiko ist gering (man könnte damit den Zwischenspeicher der Website leeren), aber sie
  gehören getauscht. Muss an beiden Stellen gleichzeitig passieren.
- **Die 37 alten Kontaktformular-Einsendungen löschen.** Sie liegen in `wp_postmeta`,
  stammen aus einem längst deinstallierten Formular-Plugin der Vorgängerseite und
  enthalten 31 Mailadressen von Privatpersonen. In der neuen Seite haben sie nichts
  verloren — und solange sie da sind, sind sie ein DSGVO-Thema.
- **Klären, ob eine Meldung nach Art. 33 DSGVO nötig ist.** Personenbezogene Daten Dritter
  waren einem Angreifer zugänglich. Ob daraus eine Meldepflicht folgt, muss der Kunde
  bewerten — das ist eine juristische Frage, keine technische.
