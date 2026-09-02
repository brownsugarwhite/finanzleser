# Was ich für den Umzug auf den neuen Webspace brauche

**Stand: 02.09.2026** · Neuer Webspace: `access-5021324858.webspace-host.com` (IONOS)

Danke für die Zugangsdaten. Mit SFTP allein komme ich allerdings nicht weit: ohne
Datenbank läuft kein WordPress, und ohne Subdomain hat es keine Adresse. Beides lässt
sich nur im IONOS-Kundencenter anlegen, nicht über SFTP.

Damit wir das in einem Rutsch erledigen statt in fünf Rückfragen über zwei Wochen, hier
alles auf einmal.

---

## ⚠️ Zuerst das Wichtigste: die Domain bitte NICHT mit dem Webspace verbinden

Du hattest geschrieben: *„Die Domain finanzleser.de umziehen / Mit Webspace verbinden"*.

**Bitte genau das nicht machen.** Es klingt naheliegend, würde die Seite aber sofort
abschalten — so wie am 18. August schon einmal.

Der Grund: finanzleser.de liegt nicht auf dem Webspace. Die Seite läuft bei einem
anderen Anbieter (Netlify), der Webspace liefert nur die *Inhalte* dahinter zu. Sobald
man im Kundencenter die Domain auf den Webspace stellt, überschreibt IONOS automatisch
die Adresseinträge — und Besucher sehen statt der Seite die nackte WordPress-Oberfläche.
Genau das war der Ausfall im August.

**Der Webspace bekommt nur zwei eigene Unteradressen** (`cms.` und `cms-test.`, siehe
Punkt 3). `finanzleser.de` und `www.finanzleser.de` bleiben unangetastet. Um die Domain
kümmern wir uns ganz zum Schluss, wenn der Umzug fertig ist und nichts mehr schiefgehen
kann.

---

## Am einfachsten: Zugang zum Kundencenter

Wenn du mir einen Zugang zum IONOS-Kundencenter des neuen Vertrags gibst, erledige ich
die Punkte 1–5 selbst und du musst nichts weiter tun. Das spart uns beiden am meisten
Zeit.

Falls das nicht geht, hier die Punkte einzeln zum Abarbeiten:

---

## 1 · Zwei Datenbanken anlegen

**Kundencenter → Hosting → Datenbanken → MySQL-Datenbank anlegen** (zweimal)

Schick mir danach je: Datenbankname, Benutzername, Passwort, Hostname.

> 🚨 **Wichtig: Das Datenbank-Passwort darf nicht dasselbe sein wie das
> SFTP-Passwort.** Auf dem alten Webspace waren beide identisch — und das
> Datenbank-Passwort steht bei WordPress systembedingt unverschlüsselt in einer
> Konfigurationsdatei. Wer diese eine Datei lesen konnte, hatte damit automatisch auch
> den Dateizugang. Das wiederholen wir nicht.

Die zweite Datenbank ist für die Testumgebung (siehe Punkt 3). Falls dein Paket nur eine
Datenbank enthält: sag kurz Bescheid, dann finde ich einen Weg — ein Upgrade auf zwei
Datenbanken kostet bei IONOS allerdings nur wenige Euro im Monat und ist die deutlich
sauberere Lösung.

## 2 · Zwei Unteradressen einrichten

**Kundencenter → Domains & SSL → Subdomain anlegen**

| Subdomain | Ziel-Ordner |
|---|---|
| `cms.finanzleser.de` | `/cms` |
| `cms-test.finanzleser.de` | `/cms-test` |

`cms` wird das eigentliche Redaktionssystem — dort arbeitest du und dein Team künftig.
`cms-test` ist eine Kopie zum Ausprobieren, die jederzeit weggeworfen und neu erzeugt
werden kann. Damit lassen sich Änderungen künftig gefahrlos testen, bevor sie live
gehen. Bisher ging das nicht: jede Umstellung im WordPress wirkte sofort auf die echte
Seite.

## 3 · SSL für beide aktivieren

**Kundencenter → Domains & SSL → SSL-Zertifikat** (Let's Encrypt, ist im Paket enthalten)

Ohne SSL liefen die Daten zwischen Webspace und Website unverschlüsselt.

## 4 · PHP-Version und SSH

- **PHP 8.3 oder neuer** einstellen (Kundencenter → Hosting → PHP-Einstellungen)
- **SSH-Zugang aktivieren** (Kundencenter → Hosting → SSH)

SSH ist kein Muss, spart mir aber viele Stunden Handarbeit beim Einrichten und beim
späteren Erzeugen der Testkopie.

## 5 · Zwei Fragen zum Vertrag

**a) Liegt sonst noch ein Projekt in diesem Webspace?**
Falls ja, welches? Im Sicherheitsbericht vom August stand als offener Punkt, dass eine
Neuinfektion über ein Nachbarprojekt im selben Webspace möglich ist. Das war nie
geklärt. Für den neuen Webspace möchte ich es diesmal vorher wissen.

**b) Wo liegen die 7 E-Mail-Postfächer — im alten oder im neuen Vertrag?**
Davon hängt ab, ob der spätere Domainumzug die E-Mail beeinträchtigen kann. Ich möchte
das vorher wissen, nicht hinterher merken.

## 6 · Lizenzschlüssel

Für zwei kostenpflichtige Erweiterungen brauche ich die Schlüssel, weil ich sie neu
installiere statt sie vom alten Server zu kopieren:

- **ACF Pro** (Advanced Custom Fields)
- **Yoast SEO Premium**

> **Warum neu installieren statt kopieren?** Der alte Server war kompromittiert. Alles,
> was von dort mitkommt, müsste man einzeln auf Manipulation prüfen. Frisch vom
> Hersteller geladen ist beweisbar sauber und schneller. Deine Inhalte — Artikel,
> Bilder, Einstellungen — kommen selbstverständlich vollständig mit; nur der
> Programmcode wird neu geholt.

---

## Was ich schon erledigt habe

- Der gesamte selbst entwickelte Programmcode (11 Erweiterungen) ist gesichert und
  versioniert. Er lag bisher nur auf dem gehackten Server.
- Der Sicherungsstand vom 11. August ist geprüft und inhaltlich aktuell — es gibt keinen
  Datenverlust beim Umzug.
- Der Umzugsplan steht: die Seite läuft während des kompletten Aufbaus ununterbrochen
  weiter. Die Umschaltung dauert am Ende wenige Minuten und lässt sich mit zwei Klicks
  rückgängig machen.

## Was ich ohne die Punkte oben nicht anfangen kann

Alles ab „WordPress installieren". Der Umzug hängt vollständig an Punkt 1 und 2.
