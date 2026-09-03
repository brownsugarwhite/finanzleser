# Rückmeldung an den Kunden — Stand neuer Webspace

**03.09.2026** · Direkt versendbar, unverändert kopierbar.
Vorgänger: [Anforderung_Webspace_Zugaenge.md](Anforderung_Webspace_Zugaenge.md)

---

Hallo Andreas,

danke, das ging schnell. Ich habe alles durchgemessen — der größte Teil passt, und die
Website läuft die ganze Zeit unverändert weiter. Drei Punkte sind noch offen, einer davon
eilt.

## Das läuft bereits

| | |
|---|---|
| Website | unverändert erreichbar, nichts kaputtgegangen |
| Beide Datenbanken | erreichbar, leer, funktionieren einwandfrei |
| MariaDB 11.8 | völlig in Ordnung — ich hatte Bedenken, die haben sich nicht bestätigt |
| PHP 8.4.23 | besser als gefordert, alle Erweiterungen vorhanden |
| SSL | über das Wildcard-Zertifikat abgedeckt, nichts weiter zu tun |
| `cms` / `cms-dev` | zwei getrennte Ordner, korrekt eingerichtet |
| `dev.finanzleser.de` | jetzt richtig auf Netlify gesetzt 👍 |

Zu deiner Frage von eben: Die Ordner `cms` und `cms-dev` hast du **nicht** selbst angelegt
— das macht IONOS automatisch, sobald man eine Unteradresse mit einem Zielordner anlegt.
Sie sind zeitgleich mit deinen Unteradressen entstanden. Alles richtig so, du musst dort
nichts nachholen.

---

## 1 · E-Mail — das eilt

Du hattest geschrieben, es habe alles geklappt „bis auf die E-Mails". **Wie ist der Stand
dort gerade?** Kommen Mails an die Adressen noch an?

Der Hintergrund, damit du weißt, wonach du suchst: Beim Verschieben einer Domain in einen
anderen Vertrag löscht IONOS die **E-Mail-Adressen** der Domain. Die Postfächer mit allen
Inhalten bleiben erhalten, werden aber auf eine Ersatzadresse umgehängt (Schema
`finanzleser.de_0@mailboxbackup.info`). Die MX-Einträge stehen weiterhin richtig — das
täuscht leicht darüber hinweg, dass die Adressen dahinter fehlen.

Der Weg zurück, in dieser Reihenfolge:

1. Im neuen Vertrag die sieben Adressen **neu anlegen**, gleiche Schreibweise wie vorher
2. Die alten Inhalte mit dem **IONOS E-Mail-Umzug** (Migrationswerkzeug) in die neuen
   Postfächer holen
3. Testmail an jede Adresse, von außen

**Bitte prüf zuerst, ob überhaupt noch Mails ankommen.** Falls nicht, gehen seit dem
Umzug Anfragen verloren, ohne dass es jemand merkt — Absender bekommen in dem Fall meist
gar keine Fehlermeldung. Das wäre der dringendste Punkt von allen, dringender als alles
Technische am Webspace.

## 2 · SSH — bitte noch einmal anfassen

Das ist noch nicht aktiv, und Warten hilft nicht: Bei IONOS ist SSH keine Einstellung des
Webspace, sondern eine **Eigenschaft des einzelnen Zugangs**. Beim Anlegen wählt man
zwischen „SFTP" und „SFTP + SSH". Der Zugang, den du mir geschickt hast, ist als reines
SFTP-Konto angelegt.

**Was zu tun ist:** *Hosting → SFTP/SSH*, dort einen **neuen Zugang vom Typ „SFTP + SSH"**
anlegen. Der Benutzername wird automatisch vergeben, ist also ein anderer — schick mir
bitte den neuen. Falls du bereits einen zweiten Zugang angelegt hast: dann brauche ich
einfach dessen Daten.

Warum es sich lohnt: Ohne SSH funktioniert alles, aber vieles nur umständlich. Vor allem
die Testkopie — die soll sich in Sekunden neu erzeugen lassen, damit wir sie oft und
gefahrlos benutzen. Ohne SSH wird daraus jedes Mal eine mehrstufige Handarbeit, und dann
benutzt sie erfahrungsgemäß niemand mehr.

## 3 · Zwei Angaben fehlen noch

- **Lizenzschlüssel** für **ACF Pro** und **Yoast SEO Premium**
- **Liegt noch ein anderes Projekt in diesem Webspace?** Falls ja, welches?
  (Im Sicherheitsbericht vom August stand als offener Punkt, dass eine erneute Infektion
  über ein Nachbarprojekt möglich ist. Das wurde nie geklärt.)

---

## Noch eine Bitte zu den Zugangsdaten

Die Passwörter sind über den Teams-Chat gelaufen. Damit liegen sie dauerhaft in
Microsofts Rechenzentrum, sind für Administratoren lesbar und stehen in Backups und in
der Suche — zurückholen lässt sich das nicht.

Für den Aufbau ist das kein Problem, ich **tausche sie unmittelbar danach aus** und melde
dir die neuen Werte. Dann sind die Werte aus dem Chat wertlos, egal wer sie noch liest.

Für den neuen SSH-Zugang wäre mir ein anderer Weg lieber. Am einfachsten: eine
selbstlöschende Notiz (z. B. **onetimesecret.com**) — Text eintragen, Link erzeugen, Link
schicken. Der Link funktioniert genau einmal und ist danach tot. Kostet dich keine
Anmeldung und keine halbe Minute.

Sobald der SSH-Zugang da ist, lege ich mit dem Aufbau los. Die Punkte 1 und 3 laufen
unabhängig davon.

Viele Grüße
Florian
