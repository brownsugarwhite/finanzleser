# Nachricht an den Kunden — Zugänge neuer Webspace

**Stand: 02.09.2026** · Webspace: `access-5021324858.webspace-host.com` (IONOS)
Direkt versendbar, unverändert kopierbar.

---

Hallo Andreas,

danke für die Zugangsdaten zum neuen Webspace. Ich habe mir das angesehen und den
kompletten Umzug durchgeplant. Zwei Dinge vorab, dann die Liste dessen, was ich von dir
brauche.

## Zuerst: die Domain bitte NICHT mit dem Webspace verbinden

Du hattest geschrieben, als nächstes stehe an, „die Domain finanzleser.de umzuziehen und
mit dem Webspace zu verbinden".

**Bitte genau das nicht machen.** Es klingt naheliegend, würde die Website aber sofort
abschalten — so wie am 18. August schon einmal.

Der Hintergrund: finanzleser.de liegt gar nicht auf dem Webspace. Die Website selbst
läuft bei einem anderen Anbieter (Netlify), der Webspace liefert nur die Inhalte dazu.
Sobald man im IONOS-Kundencenter die Domain auf den Webspace stellt, überschreibt IONOS
automatisch die Adresseinträge — und Besucher sehen statt der Website die nackte
WordPress-Oberfläche. Genau das war der Ausfall im August.

Der Webspace bekommt deshalb nur zwei eigene Unteradressen (`cms.` und `cms-test.`,
siehe unten). `finanzleser.de` und `www.finanzleser.de` bleiben unangetastet. Um die
Domain selbst kümmern wir uns ganz zum Schluss, wenn der Umzug steht und nichts mehr
schiefgehen kann.

## Und die gute Nachricht: die Website läuft während des ganzen Umzugs weiter

Ich baue das neue System vollständig daneben auf und schalte erst um, wenn es geprüft
ist. Für Besucher ändert sich in der Zwischenzeit nichts. Die eigentliche Umschaltung
dauert am Ende wenige Minuten und lässt sich mit zwei Klicks rückgängig machen. Es gibt
also keinen Stichtag, an dem die Seite offline geht.

Deine Inhalte kommen dabei vollständig mit — Artikel, Bilder, Rechner, Checklisten,
Einstellungen. Ich habe den Sicherungsstand geprüft: er ist aktuell, es geht nichts
verloren.

---

## Was ich brauche

Mit SFTP allein komme ich nicht weit: ohne Datenbank läuft kein WordPress, und ohne
Unteradresse hat es keine Adresse im Netz. Beides lässt sich nur im IONOS-Kundencenter
anlegen, nicht über den Dateizugang, den du mir geschickt hast.

**Am einfachsten wäre ein Zugang zum IONOS-Kundencenter des neuen Vertrags** — dann
erledige ich die Punkte 1 bis 4 selbst und du musst nichts weiter tun.

Falls das nicht geht, hier die Punkte einzeln:

### 1 · Zwei Datenbanken anlegen

*Kundencenter → Hosting → Datenbanken → MySQL-Datenbank anlegen* (zweimal)

Schick mir danach jeweils: Datenbankname, Benutzername, Passwort, Hostname.

**Wichtig: Das Datenbank-Passwort darf nicht dasselbe sein wie das SFTP-Passwort.** Auf
dem alten Webspace waren beide identisch — und das Datenbank-Passwort steht bei
WordPress systembedingt unverschlüsselt in einer Konfigurationsdatei. Wer diese eine
Datei lesen konnte, hatte damit automatisch auch den Dateizugang zum ganzen Webspace.
Das wiederholen wir nicht.

Die zweite Datenbank ist für die Testumgebung (siehe Punkt 2). Falls dein Paket nur eine
Datenbank enthält, sag kurz Bescheid — ein Upgrade kostet bei IONOS nur wenige Euro im
Monat und ist die deutlich sauberere Lösung.

### 2 · Zwei Unteradressen einrichten

*Kundencenter → Domains & SSL → Subdomain anlegen*

| Unteradresse | Ziel-Ordner |
|---|---|
| `cms.finanzleser.de` | `/cms` |
| `cms-test.finanzleser.de` | `/cms-test` |

`cms` wird das eigentliche Redaktionssystem — dort arbeitet ihr künftig.
`cms-test` ist eine Kopie zum Ausprobieren, die jederzeit weggeworfen und neu erzeugt
werden kann.

Das ist die wichtigste Verbesserung gegenüber vorher: Bisher gab es nur ein einziges
System. Jede Umstellung im WordPress — ein Plugin installieren, eine Einstellung ändern,
ein Update einspielen — wirkte sofort auf die echte Website. Testen war schlicht nicht
möglich. Für Phase 2 (Login-Bereich, Werbung, KI-Ausbau) ist das keine tragbare
Grundlage. Mit der Testkopie probieren wir alles gefahrlos durch, bevor es live geht.

### 3 · SSL für beide aktivieren

*Kundencenter → Domains & SSL → SSL-Zertifikat* (Let's Encrypt, im Paket enthalten)

Sonst liefen die Daten zwischen Webspace und Website unverschlüsselt.

### 4 · PHP-Version und SSH

- **PHP 8.3 oder neuer** einstellen (*Hosting → PHP-Einstellungen*)
- **SSH-Zugang aktivieren** (*Hosting → SSH*)

SSH ist kein Muss, spart mir aber viele Stunden Handarbeit beim Einrichten und beim
späteren Erzeugen der Testkopie.

### 5 · Zwei Fragen zum Vertrag

**a) Liegt sonst noch ein Projekt in diesem Webspace?** Falls ja, welches?
Im Sicherheitsbericht vom August stand als offener Punkt, dass eine erneute Infektion
über ein Nachbarprojekt im selben Webspace möglich ist. Das wurde nie geklärt. Beim
neuen Webspace möchte ich es diesmal vorher wissen.

**b) Wo liegen die 7 E-Mail-Postfächer — im alten oder im neuen Vertrag?**
Davon hängt ab, ob der spätere Domainumzug die E-Mail beeinträchtigen kann. Das möchte
ich vorher wissen und nicht hinterher merken.

### 6 · Lizenzschlüssel

Für zwei kostenpflichtige Erweiterungen brauche ich die Schlüssel:

- **ACF Pro** (Advanced Custom Fields)
- **Yoast SEO Premium**

Warum neu installieren statt vom alten Server kopieren: Der alte Server war
kompromittiert. Alles, was von dort mitkäme, müsste einzeln auf Manipulation geprüft
werden. Frisch beim Hersteller geladen ist beweisbar sauber — und schneller. Deine
Inhalte kommen davon unberührt vollständig mit; nur der Programmcode wird neu geholt.

---

## Was ich in der Zwischenzeit schon erledigt habe

- Der gesamte selbst entwickelte Programmcode für eure Website (elf Erweiterungen) ist
  gesichert und versioniert. Er lag bisher ausschließlich auf dem gehackten Server — wäre
  der Webspace gelöscht worden, hätte er neu geschrieben werden müssen.
- Der Sicherungsstand vom 11. August ist gegen das laufende System geprüft und
  inhaltlich aktuell.
- Der Umzugsplan steht vollständig, inklusive Rückweg für jeden Schritt.

## Womit es weitergeht

Sobald Punkt 1 und 2 stehen, kann ich anfangen. Alles andere hängt daran — ohne
Datenbank und Unteradresse lässt sich kein WordPress installieren.

Viele Grüße
Florian
