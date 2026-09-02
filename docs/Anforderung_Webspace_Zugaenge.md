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

Der Webspace bekommt deshalb nur zwei eigene Unteradressen (`cms.` und `cms-dev.`,
siehe unten). `finanzleser.de` und `www.finanzleser.de` bleiben unangetastet.

**Die Domain bleibt komplett dort, wo sie ist — und deine E-Mail-Postfächer damit auch.**
Du hattest gefragt, ob es ein Problem ist, dass die Postfächer noch im alten Vertrag
liegen: nein, im Gegenteil. E-Mail und Webspace haben bei IONOS nichts miteinander zu
tun, der Umzug des Webspace berührt die Postfächer nicht. Und einen Domainumzug machen
wir bewusst *nicht*: IONOS löscht dabei alle E-Mail-Adressen der Domain, sie müssten im
neuen Vertrag einzeln neu angelegt und migriert werden. Bei sieben Postfächern ist das
ein Risiko ohne Gegenwert.

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

Mit dem Dateizugang allein komme ich leider nicht weit. Über SFTP kann ich Dateien
hochladen — aber keine Datenbank anlegen und keine Adresse vergeben. Ohne Datenbank läuft
kein WordPress, ohne Unteradresse ist es nicht erreichbar. Beides geht nur im
IONOS-Kundencenter.

### Der schnellste Weg

**Gib mir einen Zugang zum IONOS-Kundencenter des neuen Vertrags.** Dann erledige ich die
Punkte 1 bis 4 in etwa zwanzig Minuten selbst und du musst dich um nichts kümmern.

Falls das nicht geht, hier die Punkte zum Abhaken:

### Zum Abhaken

| | Was | Wo im Kundencenter |
|---|---|---|
| ☐ 1 | Zwei MySQL-Datenbanken anlegen | Hosting → Datenbanken |
| ☐ 2 | Drei Adressen anlegen (siehe Tabelle unten) | Domains & SSL → Subdomain bzw. DNS |
| ☐ 3 | SSL für die beiden Webspace-Adressen aktivieren | Domains & SSL → SSL-Zertifikat |
| ☐ 4 | PHP auf 8.3 oder neuer stellen, SSH freischalten | Hosting → PHP-Einstellungen / SSH |
| ☐ 5 | Zwei Fragen beantworten (siehe unten) | — |
| ☐ 6 | Zwei Lizenzschlüssel heraussuchen | — |

**Was mir danach zurückkommen muss:**

- **zu 1:** je Datenbank Name, Benutzername, Passwort und Hostname
- **zu 2 bis 4:** eine kurze Bestätigung, dass es erledigt ist
- **zu 5 und 6:** die Antworten bzw. Schlüssel

---

### Zu 1 · Die zwei Datenbanken

**Bitte für die Datenbanken nicht dasselbe Passwort nehmen wie für den Dateizugang.**

Auf dem alten Webspace war beides identisch. WordPress legt sein Datenbank-Passwort
technisch bedingt unverschlüsselt in einer Konfigurationsdatei ab — wer also diese eine
Datei lesen konnte, hatte damit automatisch auch vollen Zugriff auf sämtliche Dateien des
Webspace. Zwei verschiedene Passwörter kosten nichts und unterbrechen diese Kette.

Falls dein Paket nur eine Datenbank enthält: kurz Bescheid sagen. Es gibt einen
Behelfsweg, der trennt die beiden Systeme aber schlechter. Ein Upgrade kostet bei IONOS
nur wenige Euro im Monat und ist die deutlich sauberere Lösung.

### Zu 2 · Die drei Adressen

**Achtung: das sind zwei verschiedene Vorgänge.** Die ersten beiden werden mit dem
Webspace verbunden, die dritte ausdrücklich **nicht** — sie zeigt auf Netlify, wo die
Website liegt.

| Adresse | Anzulegen als | Ziel |
|---|---|---|
| `cms.finanzleser.de` | Subdomain **auf den Webspace** | Ordner `/cms` |
| `cms-dev.finanzleser.de` | Subdomain **auf den Webspace** | Ordner `/cms-dev` |
| `dev.finanzleser.de` | **DNS-Eintrag, Typ CNAME** | `dev--finanzleser-production.netlify.app` |

Wird `dev.finanzleser.de` versehentlich als Webspace-Subdomain angelegt, zeigt die
Test-Website auf einen leeren Ordner. Der Weg dafür ist *Domains & SSL → Aktionen-Menü →
DNS*, nicht *Subdomain anlegen*.

`cms` wird euer Redaktionssystem — dort arbeitet ihr künftig.
`cms-dev` ist eine Kopie zum Ausprobieren, die jederzeit weggeworfen und in Sekunden neu
erzeugt werden kann.
`dev` ist die Test-Website, auf der das Team abnimmt, bevor etwas live geht.

Das ist die wichtigste Verbesserung des ganzen Umbaus. Bisher gab es nur ein einziges
System: Jede Umstellung im WordPress — ein Plugin installieren, eine Einstellung ändern,
ein Update einspielen — wirkte sofort auf die echte Website. Gefahrloses Testen war
schlicht nicht möglich. Für Phase 2 mit Login-Bereich, Werbung und KI-Ausbau ist das
keine tragbare Grundlage; das sind genau die Eingriffe, die man vorher ausprobieren will.

### Zu 3 · SSL

Nur für `cms.` und `cms-dev.` — ohne SSL liefen die Daten zwischen Webspace und Website
unverschlüsselt durchs Netz. Um das Zertifikat für `dev.finanzleser.de` kümmert sich
Netlify automatisch, dort ist nichts zu tun.

### Zu 4 · PHP und SSH

SSH ist kein Muss, aber eine spürbare Ersparnis: Damit wird das Erzeugen der Testkopie
ein einzelner Befehl. Ohne SSH ist es jedes Mal Handarbeit über mehrere Schritte — bei
einer Kopie, die bewusst häufig neu erzeugt werden soll, summiert sich das schnell.

### Zu 5 · Zwei Fragen

**a) Liegt sonst noch ein Projekt in diesem Webspace?** Falls ja, welches?

Im Sicherheitsbericht vom August stand als offener Punkt, dass eine erneute Infektion
über ein anderes Projekt im selben Webspace möglich ist. Geklärt wurde er nie. Beim neuen
Webspace hätte ich die Antwort gern vorher — nicht nach dem nächsten Vorfall.

**b) Was enthält der alte Vertrag genau — und lässt sich der Webspace-Teil kündigen, ohne
dass Domain und E-Mail-Postfächer mitgehen?**

Schick mir bei Gelegenheit die Vertragsübersicht aus dem Kundencenter. Wenn sich das
nicht trennen lässt, ist das kein Drama: Dann laufen einfach zwei Verträge nebeneinander
weiter, der alte nur noch für Domain und E-Mail. Immer noch besser, als die Postfächer
anzufassen.

### Zu 6 · Lizenzschlüssel

Für **ACF Pro** und **Yoast SEO Premium**.

Beide installiere ich neu, statt sie vom alten Server zu kopieren. Alles, was von dort
mitkäme, müsste ich einzeln auf Manipulation prüfen — frisch beim Hersteller geladen ist
es beweisbar sauber und geht schneller. Deine Inhalte bleiben davon unberührt und kommen
vollständig mit; nur der Programmcode wird neu geholt.

---

## Was ich in der Zwischenzeit schon erledigt habe

- **Euren Programmcode gesichert.** Elf selbst entwickelte Erweiterungen lagen bisher
  ausschließlich auf dem gehackten Server. Wäre der Webspace gelöscht worden, hätten sie
  neu geschrieben werden müssen. Sie liegen jetzt in der Versionsverwaltung.
- **Den Sicherungsstand geprüft.** Der Stand vom 11. August ist gegen das laufende System
  abgeglichen und inhaltlich aktuell — es geht beim Umzug nichts verloren.
- **Den Umzugsplan fertiggestellt**, inklusive Rückweg für jeden einzelnen Schritt.

## Womit es weitergeht

**Punkt 1 und 2 sind die eigentliche Blockade** — ohne Datenbank und Unteradresse lässt
sich kein WordPress installieren. Punkt 3 und 4 brauche ich beim Aufbau, Punkt 5 und 6
kurz danach.

Warte also bitte nicht auf Vollständigkeit: Sobald 1 und 2 stehen, lege ich los.

Viele Grüße
Florian
