---
title: "finanzleser.de ist das Gespräch mit Leo"
subtitle: "Konzept für Phase 2: Das Finanzmagazin als Faden mit Karten, jede Karte mit eigener Seite"
author: "Florian Frey"
date: "7. September 2026"
lang: de-DE
toc-title: "Inhalt"
---

\newpage

# Auf einen Blick

**Die These.** Finanzleser hat in Phase 1 Inhalte und Layout erneuert. Was die Seite von jedem anderen Finanzmagazin unterscheidet, ist aber nicht sichtbar: Leo, der Agent, der die Bedingungswerke der Versicherer gelesen hat und Fragen mit Quelle, Seite und Paragraf beantwortet. Im Zeitalter der KI-Suche ist das der Grund, finanzleser.de aufzurufen statt ChatGPT. Deshalb wird das Gespräch mit Leo zum Kern der Seite. Nicht als Fenster in der Ecke, sondern als die Seite selbst.

**Drei Versprechen an die Leserin.**

1. *Fragen Sie, statt zu suchen.* Jede Frage bekommt eine Antwort mit Quelle. Dazu erscheinen Rechner, Checklisten, Vergleiche und Kontakte direkt im Gespräch, nicht auf einer anderen Seite. Jedes Fachwort im Text ist einen Tipp von seiner Erklärung entfernt.
2. *Alles bleibt auffindbar.* Jeder Ratgeber, jeder Rechner, jedes Spiel behält seine eigene Adresse im Netz. Google, Bing und die KI-Suchmaschinen sehen darunter vollständige Inhalte. Ein Mensch sieht diese Adresse nur als Gespräch: Wer über einen Link kommt, landet im Faden, in dem genau dieser Inhalt bereits offen liegt.
3. *Es lohnt sich, wiederzukommen.* Ein Finanzwort am Tag, ein Aktenkoffer für Ergebnisse, ein Wächter, der bei Fristen und Änderungen Bescheid sagt. Kostenlos, ohne Zwang zur Registrierung, mit einem Konto als Sicherung.

**Was sich für Finconext ändert.** Die Seite wird vom Informationsportal zum Gesprächsraum, in dem Leo zur richtigen Zeit den Weg zu Finconext öffnet: eine Karte „Angebot berechnen bei Finconext“ nach einer beantworteten Haftpflicht-Frage, ein Versicherungs-Check als Belohnung nach vier Wochen Finanzfrage des Tages, ein Wächter, der am 1. November drei geprüfte Kfz-Angebote schickt. Das Maklergeschäft bekommt einen Zulauf, der aus Nutzen entsteht, nicht aus Werbung.

**Was dieses Dokument leistet.** Es beschreibt das Konzept, belegt es mit Recherche (Kundenbindung, Spiele, Suchmaschinen, Werbung, Recht, Scroll-Intros), zeigt die Seitenführung in zwölf Skizzen und vier Ansichten aus dem Prototyp und ordnet den Ausbau in Stufen. Ein klickbarer Prototyp liegt bei. Die technische Umsetzung ist in einem separaten Anhang beschrieben.

\newpage

# Ausgangslage

## Was Phase 1 geschafft hat

Die Seite ist seit Juli 2026 live: rund 830 Seiten, darunter 56 Rechner, 207 Checklisten, 43 Vergleiche, 147 Anbieter-Kontaktseiten und die Ratgeber in vier Rubriken. Die Google-Deindexierung ist repariert, die Weiterleitungen aus dem alten Bestand sind gesichert, die Betriebskosten sind gesenkt. Leo antwortet bereits heute real, mit Quellen aus dem Wissensbestand.

## Was der Traffic sagt

Die Google Search Console zeigt, wofür Menschen heute kommen. Die stärksten Seiten sind Rechner und Formulare rund um Familie und Steuer:

| Seite | Impressionen (Stand 20. August 2026) |
|---|---|
| Düsseldorfer Tabelle | 38.458 |
| LVM Versicherung Kontakt | 25.574 |
| Steuerformulare | 25.401 (meistgeklickt) |
| Unterhaltsvorschuss | 24.296 |
| Rentenbesteuerungsrechner | 19.334 |
| Kindergeldauszahlung | 17.897 (ohne passendes Ziel) |
| Unterhaltsrechner | 16.459 |
| HUK24 Unfallversicherung | 13.637 |

Der Bedarf ist konkret und wiederkehrend: Wie viel Unterhalt, welches Formular, wann kommt das Kindergeld. Genau solche Fragen kann ein Gespräch besser beantworten als eine Trefferliste. Und genau hier muss Leos Einstieg andocken.

## Was Leo heute ist

Leo sitzt auf der Startseite als Widget mit Eingabefeld. Er kann viel, zeigt es aber nicht: Die Antwort erscheint als Text, die passenden Rechner und Checklisten liegen woanders, ein Verlauf fehlt, nichts bleibt nach dem Schließen. Die Seite drumherum erzählt nicht, was Leo besonders macht.

## Was finconext.de heute ist (öffentliche Sicht)

Für dieses Konzept wurde finconext.de aus der öffentlichen Sicht ausgewertet: Startseite, Sitemap (112 Adressen, davon 100 Versicherer-Unterseiten), Help-Center-Subdomains und Sichtbarkeit bei Google. Interne Zahlen lagen nicht vor.

- Zehn Partner werden prominent geführt: Haftpflichtkasse, Uelzener, Ammerländer, Degenia, DEURAG, DOMCURA, GVO, MVK, Neodigital, NV-Versicherungen. Laut „Über Finconext“ besteht Zusammenarbeit mit mehr als 100 Gesellschaften; im Suchindex finden sich weitere Help-Center (HanseMerkur, VHV, Adcuri).
- Die Sparten, die auf den Unterseiten am häufigsten vorkommen: Privathaftpflicht (9 von 10 Partnern), Hausrat (8), Unfall (8), Hundehaftpflicht und Hundekranken (6), Fahrrad (5), Wohngebäude (5), Pferd (5), Rechtsschutz (2), Kfz (1). Private Krankenversicherung, Berufsunfähigkeit, Zahnzusatz oder Riester kommen nicht vor.
- Die Tarifrechner sind Eigenentwicklungen und bereits als Gespräch gebaut („Sie chatten mit einem KI-Assistenten“). Es gibt keine Einbindung von Mr-Money oder Vergleichsportalen. Unter berater.finconext.de läuft ein digitaler Berater mit WhatsApp-Kontakt.
- Die Sichtbarkeit bei Google tragen nicht die Landingpages, sondern die Help-Center-Artikel je Versicherer (Beispiel: Gewässerschaden, Schlüsselverlust, Mietsachschäden in der Privathaftpflicht). Zwei dieser Help-Center liegen auf finanzleser.de-Subdomains (Degenia, GVO).

Für das Konzept heißt das: Die Brücke zu Finconext führt über Haftpflicht, Hausrat, Unfall, Tier, Fahrrad und Gebäude. Und der Übergang ist leicht, weil auf beiden Seiten ein Gespräch steht.

\newpage

# Die Idee: Finanzleser ist das Gespräch

## Der Faden

Die Seite ist ein durchgehendes Gespräch, der Faden. Oben der schlanke Zeitungskopf mit dem Register (Ratgeber · Finanztools · Service · Finanzleser Plus), in der Mitte die Unterhaltung mit Leo in Lesebreite, am linken Bildschirmrand der Verlauf des Tages mit dem Inhaltsverzeichnis des offenen Ratgebers, am rechten Bildschirmrand das Glossar der Sitzung und die Anzeige, unten die Eingabe, die immer da ist. Alles, was Finanzleser zu bieten hat, erscheint im Faden: ein Ratgeber als Kette, ein Rechner, ein Vergleich, eine Checkliste, ein Dokument, ein Anbieter, ein Spiel, eine Statistik. Man scrollt nach oben und findet, was man vorhin gelesen hat. Man verlässt den Faden nie.

## Gestaltung: ein schlichter Zeitungsstil

Der Faden sieht nicht aus wie ein Chat, sondern wie eine gut gesetzte Zeitung. Papierton statt Sprechblasen, dünne Linien statt Schatten, keine gerundeten Kästen. Serif-Titel in drei Größen, darüber ein Kicker in Kapitälchen (RATGEBER · VERSICHERUNGEN › HAFTPFLICHT · 4 MIN.). Leo spricht in Absätzen mit dem Kicker LEO, eine Frage steht als „Ihre Frage“ kursiv mit dünner Linie am Rand. Farbe nur, wo sie etwas bedeutet: Grün für Aktionen und Leo, Magenta für Spiele. Werkzeuge (Rechner, Vergleiche, Checklisten, Statistiken) stehen in Kästen mit dünner Linie, wie Infokästen in einer Zeitung. Eine Textspalte von 64 Zeichen, damit lange Ratgeber lesbar bleiben.

## Die Details der heutigen Seite bleiben

Der Zeitungsstil übernimmt, was die Seite heute verspielt und schlicht macht: die Punktlinie mit „powered by Finconext“ unter der Kopfzeile, die Spark-Sterne am Register, die Pille, die beim Überfahren der Rubriken aufblüht, die Farbpunkte je Werkzeug (Magenta Rechner, Türkis Vergleiche, Lila Checklisten, Terracotta Dokumente), der Autoren-Ring mit Farbverlauf, die Uhr für die Lesezeit, das Fazit mit Starburst, die Häufigen Fragen zwischen den Fragezeichen, die Rubrik-Icons und die dunkelgrüne Textfarbe auf Papierton.

**Der Rahmen aus den Linien.** Der schönste Rollover der heutigen Seite bleibt: Stehen Karten nebeneinander, getrennt durch dünne Linien mit einem Spark in der Mitte, dann wächst beim Überfahren aus den beiden Linien ein Rahmen um die Karte, im Uhrzeigersinn, und die Sparks daneben drehen sich. Im Faden hat der Rahmen runde Ecken, gezeichnet als Linie, die von den Sparks aus nach oben und unten läuft und sich in der Mitte der Kanten schließt. Er liegt auf den Finanztools der Startseite, auf der Rubrikenwahl und überall, wo Karten in einer Reihe stehen.

**Der Kopf** ist eine Zeile: das Zeichen ganz links am Bildschirmrand, in der Mitte das Register mit Sparks dazwischen (✦ Ratgeber ✦ Finanztools ✦ Service ✦ Finanzleser Plus ✦, das Plus in Grün), rechts das grüne Lesezeichen mit der Kerbe. Darin stehen ein Wort und zwei Zeichen: „Newsletter“ öffnet Leos Wochenbrief im Faden, der Aktenkoffer trägt als kleine Zahl, was darin liegt, das Personenzeichen ist Anmeldung und Mein Bereich. Das Lesezeichen sitzt an der Fensterkante, die Bildlaufleiste des Browsers ist ausgeblendet, die Seite nutzt die ganze Breite. Auf dem Handy kommt der Burger für das Menü dazu, das Wort fällt weg. Das Register übernimmt die Pille der heutigen Seite Zug um Zug: Beim Überfahren wächst aus der Mitte des Eintrags ein dunkles Rechteck, das wie eine Lupe über der Zeile liegt (der Eintrag darin erscheint weiß und ein wenig größer), darüber zwei Linien, eine dünne und eine kräftige, die der Pille mit kleinem Verzug folgen. Zwischen den Einträgen gleitet die Pille mit leichtem Überschwingen, beim Verlassen zieht sie sich zum Punkt zusammen. Ist ein Registerblatt offen, bleibt die Pille auf dem Eintrag stehen, sein Name wird magenta; fährt man über andere Einträge, springt sie nach dem Verlassen zurück. Die Suche hat keine eigene Lupe mehr: Die Leo-Zeile ist zugleich die Suche und schlägt beim Tippen Ratgeber, Rechner, Begriffe und Rubriken vor. Sie ist gebaut wie die Suchleiste der heutigen Startseite: eine helle Glaspille, um die sich beim Überfahren eine feine Linie im Uhrzeigersinn zeichnet und beim Verlassen im Uhrzeigersinn wieder verschwindet; bei Fokus ein dunkler Ring. Der grüne Knopf „Fragen“ erscheint erst, wenn man tippt. Der Kopf hat keinen eigenen Hintergrund und keine Linie. Unter ihm liegt der progressive Blur der heutigen Seite, exakt so gebaut wie dort: acht Ebenen, die nach unten hin weicher werden, dazu ein Papierverlauf, der den Inhalt nach oben ausblendet. Der Inhalt verschwimmt beim Scrollen unter dem Register, das Register bleibt scharf. Auf dem Handy trägt der Kopf nur Zeichen und Lesezeichen, das Menü öffnet mit dem Burger. Die zwei Randspalten öffnen auf schmalen Bildschirmen als Schubladen über zwei kleine Knöpfe „Verlauf“ und „Glossar“ über dem Faden.

**Die Spalten ersetzen den Slider.** Nach dem Intro steht im Kapitel „Heute“ unter Leos Begrüßung ein Kasten wie die Inhaltsseite einer Zeitung: vier Spalten, eine je Rubrik, getrennt durch die dünnen Linien mit Spark. In jeder Spalte das Icon, der Rubrikname, die Zahl der Ratgeber und darunter die Themen als Liste mit Zahlen. Rubrik und Thema sind damit auf einen Blick da, ohne Klick. Fährt man über eine Spalte, wächst der Rahmen aus den Linien (siehe oben). Tippt man ein Thema, klappt die Spalte auf: Sie wird breit, die drei anderen Rubriken werden zu schmalen Rücken mit senkrechtem Namen, wie Zeitungen im Regal. In der offenen Spalte stehen die Themen der Rubrik als Reiter, darunter die Ratgeber des gewählten Themas in Zeitungsspalten, dann die Finanztools zum Thema. Ein Tipp auf einen Rücken wechselt die Rubrik, „Alle Rubriken“ klappt zurück. Alles ist Typografie; die Spalten gleiten, nichts fliegt.

![P6 · Die Spalten: vier Rubriken mit ihren Themen, der Rahmen wächst aus den Linien.](docs/konzept-visuals/P6-rubriken.png)

![P7 · Eine Spalte ist aufgeklappt: Themen als Reiter, Ratgeber in Spalten, die anderen Rubriken als Rücken.](docs/konzept-visuals/P7-spalte-offen.png)

## Kapitel statt Chat-Verlauf

Damit der Faden nicht zum endlosen Protokoll wird, ist er in Kapitel geteilt. Jede neue Frage, jede Auswahl aus dem Register, jeder Sprung eröffnet ein Kapitel mit Kopfzeile (Kapitel 3 · Versicherungen › Haftpflicht · 14:32). Beginnt das nächste Kapitel, faltet sich das vorige zu einer Zeile mit seinem Titel; „aufklappen“ holt es zurück. Links steht die Kapitelliste des Tages. Das offene Kapitel bleibt so immer ruhig und übersichtlich, egal wie lange man liest. Nachfragen zum selben Thema bleiben im Kapitel.

**Lesebreite und Ränder.** Die Mitte ist genau 728 Pixel breit, die Breite des klassischen Zeitungsbanners: Ein 728 × 90 passt exakt in die Spalte, ein 300 × 250 lässt im Text noch 400 Pixel für den Umfluss. Die Leo-Zeile ist mit 750 Pixel ein wenig breiter als die Spalte und steht deshalb ein Stück über sie hinaus, auf dem Landing wie im Faden. Die zwei Randspalten hängen nicht an der Mitte, sondern am Bildschirmrand: Verlauf und Inhaltsverzeichnis ganz links, Glossar und Anzeigen ganz rechts. Der Raum dazwischen bleibt frei und ruhig; auf großen Bildschirmen wächst er, auf kleinen schrumpft er, die Lesebreite bleibt. Elemente, die breiter sind als der Faden, gibt es nicht; Vergleiche mit drei Spalten passen in die Lesebreite.

**Der Faden springt nie ans Ende.** Ein Chat scrollt gewohnheitsmäßig zur letzten Zeile. Für einen Ratgeber wäre das falsch: Man landete am Fazit statt am Titel. Deshalb gilt eine einfache Regel. Neues erscheint mit seinem Anfang unter der Kopfzeile: ein neues Kapitel, ein Ratgeber, ein Rechner, das Glossar. Kurze Dinge (ein Satz von Leo, ein paar Vorschläge) werden nur ins Bild gerückt. Und der Faden folgt nur, wenn man gerade das zuletzt Erschienene liest; wer oben in einem Ratgeber steht, wird von einem später eingeworfenen Kasten nicht weggescrollt. Löst man mitten im Lesen etwas aus, das den Faden ans Ende springen lässt (ein „Leo fragen“-Vorschlag im Ratgeber, ein Begriff aus dem Glossar, Leos Frage in der Randspalte), merkt sich die Seite die Lesestelle. Direkt unter der Kopfzeile erscheint ein dunkler Knopf mit grünem Pfeil: „Zurück zu ‚Schlüsselverlust: Wann die Haftpflicht zahlt‘“. Er nennt das Kapitel, aus dem man kommt, bleibt stehen, bis man dorthin zurück ist oder ihn antippt, und funktioniert auch dann noch, wenn inzwischen ein neues Kapitel begonnen und das alte zugeklappt hat: Der Tipp klappt es wieder auf und führt an die Zeile zurück. Niemand verliert den Faden.

**Nichts kommt zweimal vor.** Öffnet man einen Ratgeber, ein Spiel oder einen Rechner ein zweites Mal, entsteht kein neues Kapitel: Das vorhandene wandert ans Ende des Fadens und klappt auf. Der Verlauf bleibt kurz, und das Inhaltsverzeichnis eines Ratgebers hängt im Verlauf direkt unter seinem Eintrag, nicht darüber.

![W2 · Der Faden im Zeitungsstil: Register oben, Kapitel unten, Eingabe fest.](docs/konzept-visuals/W2.png)

## Die Karten

Eine Karte ist der Inhalt in seiner kompakten, bedienbaren Form. Der Rechner rechnet in der Karte, die Checkliste lässt sich abhaken, der Vergleich zeigt seine Spalten, die Statistik bewegt sich. Ein Ratgeber ist eine Kette aus Karten (Kapitel 6). Jede Karte hat denselben Rahmen: einen farbigen Streifen für den Typ, einen Titel in der Magazinschrift, den Inhalt und eine Fußzeile mit „Teilen“, „In den Aktenkoffer“ und „Vorlesen“. Eine Taste „Seite öffnen“ gibt es nicht, weil es außerhalb des Fadens nichts zu öffnen gibt. Wo Leo eine Karte einwirft, steht darüber, warum: „passt zu Ihrer Frage, weil …“.

![W4 · Anatomie einer Karte und die acht Kartentypen.](docs/konzept-visuals/W4.png)

**Alle Karten stehen im Prototyp.** Seit dem 7. September gibt es für jeden Kartentyp mindestens ein Beispiel: den Ratgeber als Kette, zwei Rechner (Unterhalt und Berufsunfähigkeit mit Säulen, die den Reglern folgen), zwei Vergleiche (Hundekrankenversicherung als Kasten, Privathaftpflicht als Tabelle mit Filter, Sortierung und markiertem Bestwert), die Checkliste, zwei Dokumente (Steuerformulare und eine Kündigungsvorlage, deren Brief beim Tippen mitschreibt), die Anbieter-Karte (LVM: Kontakt, Kündigen, Schaden melden in drei Spalten), sechs Spielformen (Finanzwort, Zahl des Tages, Mythos, Wochen-Quiz, Rubbellos, Gewusst-Box) samt Wappen-Album und Level, und drei Statistiken: Balken, Ring und die Torte im Stil der heutigen Seite mit weißen Fugen, Wert in der Mitte und Legende, die beim Überfahren das Stück hervorhebt. Dazu die Karten des Haltens: Wächter mit Schaltern und Glocke, Aktenkoffer mit veralteten Einträgen in Magenta, das Lebensereignis „Ein Kind kommt“ als Zeitleiste, die Wochenbrief-Ausgabe als Kapitel. Und die stillen Zustände: der Ladezustand als schimmerndes Skelett, „Leo weiß es nicht“ mit drei Wegen statt einer Ausrede, die Offline-Meldung, der Teilen-Dialog als Zeitungsausriss, die Übergabe an Finconext mit einem Papierflieger, der zum Rand fliegt.

**Mikroanimationen, die etwas erklären.** Legt man etwas in den Aktenkoffer, fliegt der Eintrag in einem Bogen zum Koffer im Lesezeichen, der Koffer blinkt kurz, die Zahl springt. Tippt man einen Begriff an, fliegt ein Spark in die Randspalte, und der neue Eintrag leuchtet. Schickt man eine Frage ab, steigt der Text aus der Zeile an seine Stelle im Faden. Ein neues Kapitel blendet im Verlauf ein. Hakt man einen Punkt der Checkliste ab, wächst die Linie über den Text. Schaltet man einen Wecker ein, läutet die Glocke. Steigt man ein Level auf, setzt sich ein Stempel. Jede dieser Bewegungen zeigt, wohin etwas gegangen ist oder was sich geändert hat; keine ist Dekoration.

## Die Seite ist der Faden

Das ist der Punkt, an dem Chat und Magazin zusammenkommen. Jede Karte hat eine eigene Adresse. Unter dieser Adresse liefert der Server den Faden mit genau dieser Karte, bei einem Ratgeber mit der ganzen Kette: Titel, Text, Rechner, Meta-Angaben, strukturierte Daten, alles vollständig im HTML. Das ist, was Google, Bing und KI-Suchmaschinen sehen, und was ein Besucher ohne JavaScript sieht. Es ist derselbe Faden, nur still: ohne Leos Begrüßung, ohne Verlauf, ohne Einwürfe.

Im Browser eines Menschen kommen diese Dinge sofort dazu: Leo begrüßt, der Verlauf erscheint, Leo streut passende Ergänzungen ein, die Eingabe steht unten. Es gibt keine zweite Ansicht, keine „reine Ratgeberseite“, die man besuchen könnte. Die Adresse ist ein Baustein für Suchmaschinen und zum Teilen; ein Mensch erlebt sie ausschließlich als Gespräch.

![W6 · Eine Adresse, ein Inhalt: Was der Server schickt und was der Mensch sieht.](docs/konzept-visuals/W6.png)

Die Recherche bestätigt, dass dieser Weg der richtige ist: Google empfiehlt weiterhin serverseitig gerenderte Inhalte für alles, was gefunden werden soll; Endlos-Scroll ohne eigene Adressen gefährdet die Indexierung; die Best Practice ist genau die hier gewählte Kombination aus eigener Adresse je Einheit und vollständigem Inhalt im HTML (Quellen in Kapitel 13).

## Drei Einstiege

1. **Startseite.** Die Eingabe steht beim Laden in der Mitte des Bildschirms, darunter drei Beispielfragen und die drei Finanztools (Rechner, Checklisten, Vergleiche). Eine einzige Bewegung läuft dazu ab, drei Sekunden, ohne dass man scrollen müsste (Kapitel 4). Beim Wiederbesuch dieselbe Ansicht ohne Bewegung.
2. **Link von außen.** Aus dem Wochenbrief, aus WhatsApp, aus Google: Der Link zeigt auf die normale Adresse. Man landet im Faden, die Kette liegt ausgerollt, Leo sagt „Willkommen zurück“. Ein Link auf einen Abschnitt springt an die Stelle.
3. **Frage oder Sprung.** Getippt, gesprochen oder als Vorschlag angetippt. Für die ältere Zielgruppe sind die Vorschlag-Chips und das Register der Hauptweg: Tippen statt Schreiben (Kapitel 7).

![W5 · Vom Wochenbrief direkt in den Faden, ohne Umweg.](docs/konzept-visuals/W5.png)

\newpage

# Der Startseiten-Moment

Die Entscheidung nach Runde 6: **Die Zeitung.** Beim Laden liegt im Hintergrund eine Zeitung im Stil der Finanzleser-Grafiken: dünne dunkelgrüne Linien, Papierton, das Zeichen im Kopf, Spaltenlinien, ein Rechner-Kasten mit einer grünen Zahl. Sie liegt zugeklappt da, ihre Rückseite zeigt das Zeichen. Innerhalb von anderthalb Sekunden schlägt sie sich auf, und die Kamera fährt weich in Position, bis die Zeitung schön ausgerichtet liegt. Gleichzeitig blendet in der Mitte der Inhalt ein: Titelzeile, die Eingabe „Was kann ich für Sie tun?“, drei Beispielfragen und die drei Finanztools als ruhige Reihe. Unten steht ein kleiner Ruf zum Weiterlesen: „Finanzleser entdecken“ mit einem Pfeil nach unten, der leicht wippt.

Scrollt man, übernimmt die zweite Bewegung, gekoppelt an den Scroll: Die Zeitung klappt sich zu, wird zum Papierflieger und startet vom Betrachter weg in den Bildschirm hinein, mit einer leichten Kurve, bis er in der Tiefe verschwindet. Die Eingabezeile löst sich dabei aus der Mitte und gleitet nach unten an die Stelle, an der sie im Faden immer steht; dort übernimmt die Zeile des Fadens, die genauso aussieht. Es ist dasselbe Feld, es wechselt nur den Platz. Dahinter beginnt der Faden. Zurückscrollen spult zurück. Die Bewegung braucht keine Bilder, nur HTML, CSS-3D und ein SVG für den Flieger; auf dem Handy ist die Zeitung kleiner, die Anordnung der Elemente dieselbe.

**Die Finanztools** stehen ohne Kästen und ohne farbige Kanten: drei Spalten, getrennt durch die dünnen Linien mit Spark, wie die Kartenreihen der heutigen Seite. Farbpunkt und Name als Kicker, die Zahl groß in Serifen, ein Satz, „Zu den Rechnern“ mit dem langen Pfeil. Fährt man mit der Maus darüber, wächst aus den Trennlinien ein Rahmen mit runden Ecken um die Spalte (Kapitel 3, „Der Rahmen aus den Linien“).

![P5 · Die Zeitung schlägt sich auf, die Kamera fährt in Position, der Inhalt blendet ein.](docs/konzept-visuals/P5-zeitung.png)

**Das Landing.** Die Fassung, mit der die Seite jetzt startet, ist die ruhigste: kein Film, keine Zeitung, nur Papier. Unter dem Kopf steht mit viel Luft eine kurze Zierlinie mit Spark, darunter in gesperrten Versalien „Das digitale Finanzmagazin“, dann die Zeile „Fragen Sie Ihren persönlichen Versicherungsberater Leo“, darunter die helle Pille „Was kann ich für Sie tun?“ und ein Satz: Leo hat 12.480 Versicherungs- und Finanzdokumente gelesen und antwortet mit Quelle und Seite. Sonst nichts. Wer scrollt, sieht die Zeilen ausblenden, und die Pille fliegt nach unten an ihren Platz im Faden; dort ist sie dasselbe Feld. Wer tippt, ist im Faden.

![P10 · Das Landing: Zierlinie, Kicker, Titel, Pille, ein Satz.](docs/konzept-visuals/P10-landing.png)

![P12 · Die Pille des Registers: dunkles Rechteck mit Lupe, zwei Linien darüber, wie auf der heutigen Seite.](docs/konzept-visuals/P12-register-pille.png)

## Was sich gut anfühlt

Acht Regeln aus der Recherche, an denen sich jede Fassung messen lassen muss:

1. **Kurz und nicht blockierend, oder scroll-gekoppelt.** Die Bewegung beim Laden dauert unter drei Sekunden, die Eingabe ist von der ersten Sekunde an bedienbar, nichts wartet auf das Ende. Alles, was länger wäre, müsste am Scrollen hängen, damit Zurückscrollen zurückspult (Nielsen Norman Group zu Scroll-Jacking).
2. **Kurz:** ein bis drei Bildschirmhöhen. Selbst die interaktiven Objekte der GPT-6-Astra-Seite sind genau eine Bildschirmhöhe hoch.
3. **Eine Bewegung**, kein Feuerwerk. Das X der iPhone-X-Seite war eine Idee, die zum Bildschirm wurde.
4. **Leicht geglättet**, nicht 1:1 am Scroll, damit es gleitet statt ruckt.
5. **Kein Einrasten**, das der Leser nicht erwartet.
6. **Mobil ohne Festhalten** der Seite gegen den Daumen; eigene, kürzere Fassung.
7. **Ladezeit schützen:** Das erste sichtbare Element ist sofort da, die Animation blockiert nichts (Largest Contentful Paint).
8. **Weicher Übergang**: Das Intro endet in genau dem Zustand, den die Seite danach hat, mit durchgehendem Papierton. Kein Schnitt.

Zur Astra-Seite: Ihre Dynamik kommt weniger vom Scrollen als von der Interaktivität, das Objekt lässt sich mit der Maus drehen. Das lässt sich als Detail übernehmen, ist aber nicht der Kern eines Scroll-Intros.

## Drei Ideen für die eine Bewegung

**1 · Lichtfäden.** Das Finanzleser-Zeichen steht in der Mitte. Es zerfällt in gut dreißig dünne, grün leuchtende Fäden, die dem Betrachter in die Tiefe entgegenkommen und an ihm vorbeiziehen; dahinter blendet in derselben Sekunde der Inhalt ein: Titel, Eingabe, Beispielfragen, die drei Finanztools docken von unten an. Die Maus bewegt den Raum minimal mit. Dauer zweieinhalb Sekunden. Technik: CSS-3D-Transformationen ohne WebGL, das Zeichen als SVG, keine weiteren Assets. Auf dem Handy dieselbe Bewegung mit weniger Fäden. Die Fassung, die dem Netflix-Vorbild am nächsten kommt und dabei ganz aus der Marke entsteht.

**2 · Anflug.** Die Kamera fliegt durch einen hellen Himmel. Weiche Wolken rauschen auf den Betrachter zu, erst schnell, dann langsamer; von weit hinten kommt ein Papierflieger, zieht eine Schleife und landet in der Eingabezeile. Der Inhalt steht von Anfang an, die Bewegung liegt dahinter. Dauer drei Sekunden. Technik: CSS-Perspektive mit Tiefenstaffelung, Flieger und Wolken als SVG oder Lottie. Die Fassung mit der größten Weite, dafür die am wenigsten markentypische.

**3 · Zoom.** Beim Laden füllt dichtes Kleingedrucktes den Bildschirm, siebenfach vergrößert. Die Kamera zieht sich in drei Sekunden zurück, der Text wird zur Fläche, einzelne Wörter färben sich nacheinander grün (fremder Schlüssel, 30.000 €, unverzüglich, 30. November), und in der Mitte steht die ganze Zeit die Eingabe: Leo liest das Kleingedruckte, Sie fragen. Technik: eine einzige Skalierung plus Farbwechsel, reines HTML, keine Bilder. Die günstigste Fassung und die, die Leos Versprechen am direktesten erzählt.

![P4 · Anflug: Wolken rauschen auf den Betrachter zu, der Papierflieger kommt aus der Tiefe; Eingabe und Finanztools stehen von Anfang an.](docs/konzept-visuals/P4-anflug.png)

**Im Prototyp** stehen die drei unter „Neu“ in der Leiste „Intro-Variante“, dazu vier weitere Fassungen mit derselben Regel (Stapel, Ausgabe, Kompass, Strom) und, unter „Scroll (alt)“, die fünf scroll-gekoppelten Ideen aus Runde 4. Alle Fassungen lassen sich umschalten, ohne die Seite neu zu laden.

**Empfehlung.** Standard ist das Landing (Kapitel „Drei Einstiege“): still, sofort lesbar, die Pille im Mittelpunkt. „Die Zeitung“ bleibt die Fassung mit Bewegung für den Moment, in dem die Seite etwas erzählen soll (Kampagne, Neustart, Präsentation); „Lichtfäden“ und „Zoom“ bleiben als weitere Fassungen im Prototyp wählbar.

## Fünf frühere Ideen (Scroll-Fassungen, Runde 4)

Sie bleiben als Material für spätere Kampagnen und für Übergänge innerhalb des Fadens. Alle fünf im Stil der Finanzleser-Grafiken: dünne dunkelgrüne Linien, weiche Flächen, Papierton, Merriweather. Leo ist in dreien nur ein Blick oder eine Hand, nicht die Hauptfigur.

**1 · Die Akte.** Ein flacher Aktenkoffer im Linienstil liegt auf dem Papier. Beim Scrollen öffnet er sich, die Kamera fährt hinein: Bedingungswerke, Formulare und Policen fächern als dünne Blätter auf, einzelne Zahlen leuchten kurz grün auf (12.348 €, 30. November, 30.000 €). Am Ende faltet sich alles zu einer einzigen Zeile zusammen: der Eingabezeile „Fragen Sie Leo“. Leo erscheint nur als Hand mit Feder, die die Zeile setzt. Technik: Bildsequenz aus Blender oder Cinema 4D (etwa 80 Bilder als WebP, 2 bis 3 MB) auf Canvas, per Scroll gescrubbt, oder als 3D-Szene in Spline. Zweieinhalb Bildschirmhöhen. Die spektakulärste der fünf, auch die teuerste.

**2 · Der Papierflieger.** Ein 80-seitiges Bedingungswerk liegt aufgeschlagen. Beim Scrollen falten sich die Seiten zu einem Papierflieger, der über das Papier gleitet und dabei eine gepunktete Linie zieht: die Punktlinie der Seite. Der Flieger landet in der Eingabezeile, die Punktlinie wird ihr Rahmen. Leo fängt ihn, wenn man will. Technik: SVG-Morph (Flubber oder GSAP MorphSVG) plus CSS-Scroll-Animation, unter 300 KB, kein Video. Zwei Bildschirmhöhen. Die leichteste Verbindung zur Marke, weil die Punktlinie schon da ist.

**3 · Das Register.** Die Kamera schwebt über eine ausgebreitete Zeitungsseite in Draufsicht: Papier, dünne Linien, die Rubriken als Reiter. Beim Scrollen zoomt sie in eine Zeile hinein, Buchstaben werden zu Chips, Zahlen zu Rechnern, ein Wort („Schlüsselverlust“) wird zur Frage, und die Seite richtet sich auf: der Faden. Am Ende steht die Kopfzeile mit Register genau so, wie sie bleibt. Technik: Bildsequenz oder WebGL-Fläche mit Kamerafahrt, der Text als echtes HTML darüber, damit er scharf bleibt. Drei Bildschirmhöhen. Die konsequenteste Umsetzung des Zeitungsgedankens.

**4 · Der Paragraf.** Ein riesiges §-Zeichen in Merriweather füllt den Bildschirm, das Markenzeichen des Versicherungs- und Rechtsdeutsch. Beim Scrollen wird es zum Faden: Die obere Schleife öffnet sich zu Leos Absatz, die untere wird zur Eingabezeile, der senkrechte Strich zum Register. Dazwischen laufen Zeilen aus Bedingungswerken wie Wasser durch die Form. Ein Element, eine Bewegung, wie das X, das zum iPhone wurde. Technik: SVG-Morph plus CSS, unter 100 KB, perfekt für das Handy. Anderthalb bis zwei Bildschirmhöhen. Die eleganteste und günstigste Fassung.

**5 · Die Lupe.** Eine runde Lupe, wie die Linsen-Maske in der heutigen Navigation, gleitet beim Scrollen über dichtes, winziges Kleingedrucktes. Unter der Lupe wird der Text lesbar, Schlüsselwörter färben sich grün („Schlüsselverlust“, „30.000 €“, „unverzüglich“), Zahlen springen als Kästen heraus. Die Lupe wächst, bis ihr Rand der Rahmen der Eingabezeile ist. Leos Augen blitzen einmal in der Lupe auf (das Pupillen-Tracking existiert). Technik: CSS-Maske plus Scroll-Animation, der Text ist echtes HTML, scharf und barrierefrei, keine Bilder, unter 50 KB. Zwei Bildschirmhöhen. Die Fassung, die Leos Versprechen am direktesten zeigt: Er liest das Kleingedruckte.

Die fünf Szenen liegen weiter im Prototyp (Leiste „Intro-Variante“, Gruppe „Scroll (alt)“). Sie brauchen Scrollen, bevor die Eingabe erscheint, und erfüllen damit die Anforderung aus Runde 5 nicht mehr. „Die Lupe“ eignet sich weiterhin als Übergang von einer Kopfkarte in die Kette, „Die Akte“ als gerenderte Sequenz für eine spätere Kampagne.

\newpage

# Leo als Gastgeber

## Rolle

Leo ist kein Kundendienst-Bot und kein Verkäufer. Er ist der Gastgeber des Magazins: Er kennt die Bedingungen, findet die Stelle, rechnet vor, holt die Checkliste, zeigt die Statistik und öffnet, wenn es passt, die Tür zu Finconext. Die Recherche zu Lemonade zeigt, woran Chat-Personas scheitern: wenn sie ein Formular nur verkleiden oder mehr versprechen, als dahintersteht. Leo tut das Gegenteil: Er zeigt seine Quellen und sagt, warum er etwas vorschlägt.

## Regeln

- **Wert zuerst, Adresse danach.** Nie eine Registrierung, ein Formular oder ein Angebot vor der Antwort.
- **Höchstens zwei Einwürfe je Antwort.** Erst die Antwort, dann passende Karten. Nie eine Anbieter-Karte vor der Antwort.
- **Immer mit Quelle.** Bedingungswerk, Paragraf, Seite. Bei Zahlen die Institution und das Jahr.
- **Immer mit Grund.** „Leo wirft ein: passt zu Ihrer Frage, weil …“.
- **Rückfragen statt Belehrung.** „Möchten Sie wissen, was bei Jobverlust passiert?“
- **Grenzen benennen.** Was Leo nicht weiß, sagt er. Bei individuellen Entscheidungen verweist er auf die Beratung bei Finconext.
- **Anbieter-Fokus.** Wählt jemand einen Versicherer, bezieht Leo sich strikt auf dessen Bedingungen (die Funktion existiert bereits).

## Was Leo in jeder Antwort mitbringt

Quellenliste, bis zu drei Anschlussfragen als Chips, „Vorlesen“-Taste, „In den Aktenkoffer“. Auf breiten Bildschirmen rechts eine Spalte „Leo schlägt vor“ mit drei Karten, auf dem Handy als Chips über der Eingabe.

\newpage

# Die acht Karten

| Karte | Bestand heute | Wann Leo sie einwirft | Was Suchmaschinen unter der Adresse sehen |
|---|---|---|---|
| **Ratgeber** | Ratgeber in vier Rubriken | Wenn die Frage Hintergrund braucht; als Kette bei Links von außen | Die ganze Kette: Kopfkarte, Abschnitte, Häufige Fragen, Fazit |
| **Rechner** | 56 | Wenn eine Zahl gefragt ist (Unterhalt, Rente, Steuer) | Rechner mit Erklärung und Häufigen Fragen |
| **Vergleich** | 43, teils mit Partnerlinks | Wenn nach „lohnt sich“ oder „welcher“ gefragt wird | Vergleichstabelle mit Kriterien |
| **Checkliste** | 207 | Nach einer Antwort mit Handlungsbedarf | Checkliste, abhakbar, als PDF |
| **Dokument** | Formulare, Vorlagen | Wenn ein Formular gebraucht wird (Steuerformulare sind die meistgeklickte Seite) | Dokument mit Ausfüllhilfe |
| **Anbieter** | 147 Kontaktseiten, 10 Finconext-Partner | Nach einer beantworteten Sparten-Frage, mit Grund | Kontakt, Leistungen, Weg zu Finconext |
| **Spiel** | 6 Formate in Ratgebern | Wenn die Frage beantwortet ist; täglich als Ritual | Das Spiel mit Auflösung und Teilen |
| **Statistik** | neu | Wenn eine Zahl das Bild schärft (animiert, immer mit Quelle) | Grafik mit Quelle und Text |

Neu sind der Kartentyp Statistik und die eigene Adresse für Spiele. Alles andere existiert und wird in den Karten-Rahmen gefasst.

![W3 · Der Faden auf dem Handy: Karten stapeln sich, eine Karte klappt im Faden auf.](docs/konzept-visuals/W3.png)

## Der Ratgeber als Kartenkette

Ein Ratgeber wird nicht angeteasert und woanders gelesen. Er steht ganz im Faden, als Kette aus Karten, die sich aus dem heutigen Artikel automatisch ableiten lässt:

- **Kopf:** Brotkrumen (Versicherungen › Haftpflicht), Kicker mit Lesezeit, Titel, Vorspann, Bild, dann das Inhaltsverzeichnis als Sprungmarken. Wer nur wissen will, worum es geht, ist nach dem Vorspann fertig.
- **Abschnitte:** einer je Zwischenüberschrift, immer ausgerollt, wie ein Zeitungsartikel. Rechner, Checklisten, Vergleiche und Spiele, die heute im Artikel eingebettet sind, stehen als Kästen in der Kette. Nach jedem Abschnitt eine Frage an Leo („Und bei grober Fahrlässigkeit?“), nie ein Pop-up.
- **Häufige Fragen, Fazit,** dann „Kurzfassung von Leo“, die Wochenbrief-Karte und zwei passende Ratgeber.

Die Kette ist immer ganz da. Wer aus dem Wochenbrief oder von Google kommt, landet an der richtigen Stelle. „Kurzfassung von Leo“ liefert drei Sätze mit Quelle, auf Wunsch vorgelesen.

**Teilen.** „Teilen“ kopiert die Adresse des Ratgebers. Wer sie öffnet, landet im Faden mit ausgerollter Kette. „Abschnitt teilen“ hängt die Stelle an (…/schluesselverlust/#sofort-tun), und der Faden springt dorthin. Die Adresse selbst ist ein Baustein für Suchmaschinen; ein Mensch sieht sie nur als Faden.

![W10 · Der Ratgeber als Kartenkette: Kopfkarte, Abschnitte, Fragen an Leo, Wochenbrief.](docs/konzept-visuals/W10.png)

\newpage

# Navigation: Oben wird geblättert, unten wird gelesen

Der Faden darf die Orientierung nicht kosten. Man muss wie gewohnt zu jeder Rubrik, jedem Thema und jedem Werkzeug kommen, schnell und gezielt. Und das Menü darf den Faden nicht zumüllen. Die Lösung trennt beides sauber: Geblättert wird oben, in der Kopfzeile. Gelesen wird unten, im Faden. Ins Lesen gelangt nur, was man gewählt hat.

## Das Register und das Registerblatt

Der Kopf ist schlank: das Zeichen, vier Register-Einträge, rechts in der grünen Ecke die Suche und der Zugang zum eigenen Bereich. Die vier Einträge decken alles ab, was die Seite anbietet:

| Register | Erste Spalte | Zweite Spalte | Dritte Spalte |
|---|---|---|---|
| **Ratgeber** | Die vier Rubriken Finanzen, Versicherungen, Steuern, Recht mit Icon und Zahl | Die Themen der Rubrik (Haftpflicht, Hausrat, Kfz, Tier …) | Die Ratgeber des Themas als Zeitungsliste, darunter die Finanztools zum Thema und die Anbieter |
| **Finanztools** | Rechner (56), Vergleiche (43), Checklisten (207) | Die Liste mit Filter | Meistgenutzt, Hinweis auf Partnerlinks |
| **Service** | Anbieter, Dokumente, Glossar, Finconext | Anbieter: Sparten und Liste · Dokumente: Vorlagen und Formulare · Glossar: Alphabet und Begriffe · Finconext: Kurzvorstellung | Anbieter: die Finconext-Partner · Dokumente: wie sie im Faden öffnen · Glossar: die zwei Wege · Finconext: Link zur Seite und zum Versicherungs-Check |
| **FL Plus** | Aktenkoffer | Wächter mit Jahresleiste | Profil und Belohnungen (Kapitel 9) |

Ein Tipp auf ein Register öffnet keine neue Seite und legt nichts in den Faden. Er klappt das **Registerblatt** unter der Kopfzeile auf, ein ruhiges Blatt in drei Spalten. Finconext ist darin eine Kurzvorstellung mit Link zur Seite von Finconext; das Glossar ist ein Alphabet, hinter dem die Begriffe liegen (Kapitel 8).

Wählt man einen Ratgeber, ein Werkzeug, ein Dokument oder einen Begriff, klappt das Blatt wieder ein, und nur der gewählte Inhalt kommt als neues Kapitel in den Faden. Das Register merkt sich den Ort: „Sie lesen: Ratgeber › Versicherungen › Haftpflicht“ steht rechts neben dem Register. Ein erneuter Tipp auf die Rubrik öffnet das Blatt wieder, Esc oder ein Tipp daneben schließt es. Kein Rubrik-Sprung erzeugt jemals eine Karte im Faden. Auf dem Handy fährt das Blatt als Vollbild von oben ein, die Themen als Reihe, die Liste darunter.

Jedes Registerblatt trägt die Adresse der heutigen Übersichtsseite (etwa /versicherungen/). Suchmaschinen bekommen sie als Faden mit offenem Blatt. Für Menschen ist sie nur ein Zustand der Kopfzeile.

## Die Sprungleiste

Die Eingabe springt, bevor sie fragt. Wer „unter“ tippt, sieht sofort Vorschläge aus dem Bestand: Rechner Unterhaltsrechner 2026, Ratgeber Unterhaltsvorschuss, Ratgeber Düsseldorfer Tabelle, Checkliste Trennung mit Kindern, und als letzte Zeile „Leo fragen: unter…“. Ein Tipp legt den Inhalt als Kapitel in den Faden; Rubriken und Themen öffnen das Registerblatt. Enter ohne Auswahl stellt die Frage an Leo. Die Vorschläge kommen aus einem lokalen Verzeichnis, ohne Wartezeit. Gesprochen genügt „Unterhaltsrechner“. Die Vorschläge unter der Zeile („Zahlt die Haftpflicht bei Schlüsselverlust?“, „Kassensturz: Wie gut bin ich aufgestellt?“) erscheinen nur, wenn das Ende des Fadens im Bild ist und unter dem Text Platz für sie bleibt; mitten in der Lektüre bleiben sie eingeklappt und nehmen dem Text nichts weg.

## Die zwei Randspalten

Die Randspalten sind aufgeräumt worden; alles, was Werbung für die Seite selbst war (Vorschläge, Meistgelesen, Partnerkasten), ist verschwunden. Jede Spalte ist ein Block, der unter dem Kopf klebt: oben der Inhalt, unten die große Anzeige (300 × 600 auf beiden Seiten, beide Spalten sind 300 Pixel breit). Verlauf und Glossar sind damit immer erreichbar; werden sie lang, scrollen sie in sich. Ist der Block höher als der Bildschirm, bleibt die Anzeige unten angeschnitten, und erst das Ende des Fadens schiebt den Block nach oben und gibt sie ganz frei. Die Werbung wandert also erst mit dem Ende des Fadens, nie vorher. **Links** steht der Verlauf des Tages: ein Eintrag je Kapitel, in der Reihenfolge des Fadens. Unter dem Eintrag des offenen Ratgebers hängt sein Inhaltsverzeichnis als nummerierte Liste, der aktuelle Abschnitt markiert, ein Tipp springt an die Stelle. Darunter das Feld für den Wochenbrief, unten die Anzeige (300 × 600). **Rechts** liegt oben das Glossar der Sitzung (Kapitel 8), darunter Leos Frage, wenn er eine hat, und unten die Anzeige (300 × 600).

**Leo fragt.** Rechts unten ist beim Laden nichts. Leos Frage kommt erst, wenn der Leser etwas getan hat, das sie nahelegt, und sie betrifft ihn: Wer eine Weile im Haftpflicht-Ratgeber liest, bekommt „Sie lesen zur Haftpflicht: Wie viel zahlen Sie im Monat für Ihre Privathaftpflicht?“ mit einem Schieberegler. Nach dem Unterhaltsrechner fragt Leo, für wie viele Kinder gerechnet wird; nach dem Hundevergleich, ob der Hund schon versichert ist; nach dem dritten Schritt einer Sitzung, wann man zuletzt alle Verträge auf einen Blick gesehen hat (der Weg zum Kassensturz); nach drei Antworten im Ratgeber, ob Leo sie aufs Handy schicken soll. Der Kasten poppt auf, jede Frage kommt höchstens einmal je Besuch, nie zwei zugleich, „Später“ schließt ihn. Er sagt ausdrücklich „Antwort erscheint im Faden“: Leo antwortet nie in der Randspalte, sondern unten im Gespräch, mit Quellen und Vorschlägen wie jede andere Antwort. Nach dem Antippen bedankt sich der Kasten, der Faden springt zur Antwort, der Knopf „Zurück zu …“ unter der Kopfzeile führt an die Lesestelle zurück, und der Kasten verschwindet wieder.

![P16 · Leo fragt, wenn es passt: nach einer Weile im Haftpflicht-Ratgeber, mit „Später“ und dem Hinweis auf den Faden.](docs/konzept-visuals/P16-leo-fragt.png) Jeder Ratgeber und jedes Werkzeug trägt Brotkrumen (Ratgeber › Versicherungen › Haftpflicht); ein Tipp darauf öffnet das Registerblatt an dieser Stelle.

## Die Regel

Jeder Ratgeber ist in höchstens vier Tipps erreichbar: Register, Rubrik, Thema, Zeile. Oder mit einem Wort in der Sprungleiste. Nichts verlässt den Faden, nichts lädt neu, und das Menü hinterlässt keine Spuren im Faden.

![W9 · Oben wird geblättert, unten wird gelesen (Skizze aus Runde 3; das Register hat seit Runde 5 die vier Einträge Ratgeber · Finanztools · Service · FL Plus, siehe Prototyp).](docs/konzept-visuals/W9.png)

\newpage

# Das Glossar: Jedes Wort erklärt sich

Ein Finanzmagazin lebt von Wörtern, die nicht jeder kennt: Deckungssumme, grobe Fahrlässigkeit, Selbstbehalt, Effektivzins. Bisher musste man sie googeln oder überlesen. Im Faden ist jedes dieser Wörter ein Tipp von seiner Erklärung entfernt, so wie in der Wikipedia jeder Begriff ein Link ist.

**Was das Glossar umfasst.** Alles, was die Seite anbietet, und alles, was in den Texten erklärungsbedürftig ist: die Fachbegriffe aus Ratgebern und Leos Antworten, die Namen der Finanztools, die Sparten der Anbieter, dazu allgemeine Begriffe wie Inflation, Bonität oder Nettoeinkommen. Der Prototyp enthält 56 Einträge als Beispiel; die echte Seite wird mehrere hundert haben. Jeder Eintrag besteht aus dem Begriff, seinen Schreibweisen (Haftpflicht, Haftpflichtversicherung, Privathaftpflicht), einer Erklärung in zwei bis drei Sätzen, dem passenden Ratgeber, dem passenden Finanztool und einer interessanten Frage an Leo.

**Im Text.** Die Seite verlinkt die Begriffe selbst: In jedem Ratgeber, jeder Antwort von Leo und jedem Kasten wird das erste Vorkommen eines Begriffs grün und tippbar, gebeugte Formen und Zusammensetzungen eingeschlossen (Tarife, Haftpflichtversicherung). Überschriften, Vorspann und Bildunterschriften bleiben frei, damit der Text ruhig bleibt.

**Das Klickmenü.** Ein Tipp öffnet ein kleines Menü unter dem Wort, mit höchstens vier Zeilen:

1. **Begriffserklärung**, immer, klappt direkt im Menü auf.
2. **Passender Ratgeber**, wenn es einen gibt („Ratgeber Schlüsselverlust: Wann die Haftpflicht zahlt“).
3. **Passendes Finanztool**, wenn es eines gibt, mit dem Farbpunkt des Werkzeugs („Checkliste: Nach dem Schlüsselverlust“).
4. **Interessante KI-Frage**, mit Leos Bild: eine Frage, die man zu diesem Begriff stellen würde („Muss der Vermieter die Anlage wirklich komplett tauschen?“). Ein Tipp stellt sie, Leo antwortet mit Quelle.

Ratgeber und Tool öffnen wie gewohnt als Kapitel im Faden; das Menü schließt sich.

**Die Sitzung.** Jede aufgerufene Erklärung bleibt rechts in der Randspalte unter „Glossar · Aktuelle Sitzung“ als Zeile zum Aufklappen, die zuletzt gelesene oben und offen. Die Liste beginnt bei jedem Besuch leer; sobald man etwas öffnet, legt die Redaktion vor: Jeder Ratgeber, jeder Rechner und jeder Vergleich bringt zwei bis drei Begriffe mit, die man für ihn braucht (beim Schlüsselverlust: Schließanlage, Privathaftpflicht, grobe Fahrlässigkeit; beim Unterhaltsrechner: Düsseldorfer Tabelle, Kindesunterhalt, Selbstbehalt). Sie stehen zugeklappt in der Liste, noch bevor man den ersten grünen Begriff antippt. Die Liste scrollt in sich, sobald sie länger wird als der Platz über Leos Frage. So sammelt sich beim Lesen ein persönliches kleines Wörterbuch, mit denselben Wegen zu Ratgeber, Tool und Leo. Es lebt für die Sitzung; mit Finanzleser Plus wird es Teil des Aktenkoffers.

![P2 · Ein Tipp auf „Schließanlage“: Erklärung, Ratgeber, Checkliste, eine Frage an Leo. Rechts sammelt die Sitzung die Begriffe.](docs/konzept-visuals/P2-glossar-popover.png)

**Das ganze Glossar** liegt unter Service › Glossar als Alphabet. Ein Buchstabe zeigt die Begriffe, ein Tipp auf einen Begriff holt Leos Erklärung in den Faden und legt sie rechts in die Sitzung. Im Faden gibt es das Glossar als **Nachschlagewerk**: ein Kasten, der so hoch bleibt wie ein halber Bildschirm, auch wenn später tausende Begriffe drinstehen. Links Suche, Alphabet und die Liste, die in sich scrollt, mit Buchstaben als Zwischentiteln; rechts die Erklärung des gewählten Begriffs mit Ratgeber, Finanztool, „Leo fragen“ und „Merken“. Der Faden wird dadurch nicht länger.

**Für Suchmaschinen und KI-Suche** ist das Glossar ein Gewinn für sich: Jeder Begriff bekommt eine eigene Adresse (/glossar/schliessanlage/) mit Definition, Ratgeber und Tool, in genau der zitierfähigen Form, die generative Suchmaschinen bevorzugen (Kapitel 13). Die Begriffe im Text sind für Crawler echte Links auf diese Adressen; ein Mensch sieht das Klickmenü.

**Was wegfällt.** Das Spielelement „Gewusst?“ aus den heutigen Ratgebern ist damit überflüssig; seine Rolle übernimmt das Glossar, und das Spiel mit Begriffen wird zum Finanzwort des Tages (nächstes Kapitel).

\newpage

# Spielen und Dranbleiben

## Was die Recherche zeigt

**Wer spielt.** 37,5 Millionen Deutsche zwischen 6 und 69 spielen, das Durchschnittsalter liegt bei 39,5 Jahren. Die Gruppe 60+ ist mit 7,7 Millionen Spielenden das stärkste Wachstumssegment; von den über 65-Jährigen spielt jeder Fünfte zumindest gelegentlich. Wöchentlich spielen 33 Prozent der 50- bis 69-Jährigen und 66 Prozent der 14- bis 29-Jährigen. Das Smartphone ist die wichtigste Plattform (game-Verband 2025, Bitkom 2025, ARD/ZDF-Medienstudie 2025).

**Was Ältere spielen.** Für Deutschland gibt es keine belastbare Aufschlüsselung nach Genre und Alter. Die US-Studie der AARP (50+) zeigt: Puzzle- und Logikspiele 44 Prozent, Karten- und Kachelspiele 46 Prozent, 40 Prozent spielen täglich, aus Spaß. Das ist ein Hinweis, kein Beweis. Das Konzept behandelt „Ältere mögen Rätsel“ als Hypothese, die getestet wird.

**Welche Mechaniken belegt wirken.**

| Mechanik | Beleg | Übertragung auf Finanzleser |
|---|---|---|
| Tägliches Ritual mit Serie (Duolingo) | 58,7 Mio. tägliche Nutzer, Retention 84 %; ein Serien-Einsatz steigerte die Rückkehr nach 7 Tagen um 14 % | Finanzfrage des Tages mit Serie und Serien-Schutz |
| Teilbares Tagesergebnis (Wordle, NYT Games) | Rund 4 Millionen tägliche Spieler; über 1 Million Spiele-Abos bei der New York Times | Ergebnis als Raster teilen, jede Frage hat eine eigene Adresse |
| Vorgefüllter Fortschritt (Nunes & Drèze 2006) | 34 % statt 19 % Abschluss, wenn zwei von zehn Stempeln vorab gesetzt sind | Kassensturz startet nie bei 0 %, Sammelalbum hat schon ein Wappen |
| Wöchentlicher Brief mit Absender (Finanztip) | Über 850.000 Abonnenten, wöchentlich, Personenmarke | Leos Wochenbrief mit Themenwahl |
| Proaktive Hinweise mit Ampel (Clark) | Vertrags-Ampel, Bedarfscheck, Kündigungsalarm | Kassensturz mit Ampel, Wächter für Fristen; die Brücke zur echten Beratung bleibt der Unterschied |
| Erinnerungsdienst (remind.me) | Kostenloser Ablauf-Reminder, über Partner finanziert | Wächter zur Kfz-Frist am 30. November |

**Kreuzworträtsel oder Wordle.** Beide wurden für das Spiel mit Finanz- und Versicherungsbegriffen geprüft. Ein Kreuzworträtsel lässt sich zwar automatisch aus einer Wortliste erzeugen (offene Generatoren wie crossword-layout-generator, Anzeige mit react-crossword oder Exolve), aber die Qualität schwankt: Fachbegriffe sind lang, Gitter bleiben unverbunden oder unvollständig, und für gute Rätsel mischt man Füllwörter dazu. Die NYT-Mini wird trotz 5×5 täglich von Hand gebaut; Konstrukteure rechnen mit fünf bis sechs Stunden je Rätsel. Ein tägliches Kreuzworträtsel ohne Redaktion ist deshalb nicht verlässlich. Wordle dagegen braucht nur eine Wortliste, ist in der Referenzfassung offen verfügbar, für Ältere und Screenreader gut zugänglich und als Emoji-Raster teilbar. Zwei deutsche Eigenheiten sind vorher zu entscheiden: Umlaute als eigene Buchstaben (wie bei „Wördl“) statt als „ae“, und variable Wortlängen, weil deutsche Finanzbegriffe selten fünf Buchstaben haben. Der Tagesspiegel betreibt mit „Begriffel“ bereits ein redaktionelles Tages-Wordle, sechs Versuche, ein handverlesenes Wort. Empfehlung: täglich das Finanzwort in Wordle-Mechanik, vollautomatisch aus dem Glossar, und als zweites, wöchentliches Format ein kleines Kreuzworträtsel, technisch vorgeneriert und von der Redaktion in einer halben Stunde nachbearbeitet, für die kreuzworträtsel-affine ältere Leserschaft.

**Was Ältere im Chat brauchen.** Die Nielsen Norman Group empfiehlt: Vorschläge als Buttons statt Freitext, den Zweck in der ersten Zeile klären, drei bis sechs Einstiege anbieten, Sprache-zu-Text als Option. Abschreckend sind verschwindende Einstiege, Autoscroll während der Antwort und fehlendes Speichern. Ein Review zu Sprachassistenten bei Älteren findet hohe Bedienbarkeit, aber jugendzentriertes Design. Eine eigene Schriftgrößen-Regelung ist nicht nötig, die Browser-Vergrößerung reicht.

## Die Spiel-Schleife

![W8 · Tägliches Ritual, Punkte, Sammelalbum, Belohnung bei Finconext.](docs/konzept-visuals/W8.png)

**Bestehende Formate bleiben** und bekommen Punkte: Mythos oder Fakt, Quiz, Schätzfrage, Rubbellos, Selbsttest. „Gewusst?“ fällt weg, seine Aufgabe übernimmt das Glossar. Sie sind in Ratgebern eingebettet und werden zusätzlich als eigenständige Karten mit eigener Adresse verfügbar.

**Neue Formate:**

- **Finanzwort des Tages.** Das tägliche Ritual, im Prototyp voll spielbar: ein Begriff aus dem Glossar mit fünf bis acht Buchstaben, sechs Versuche, Umlaute als eigene Tasten. Grün ist richtig, Gelb ist drin, aber woanders. Nach zwei Fehlversuchen gibt Leo den ersten Hinweis (Rubrik und Wortart), nach vier den zweiten (ein Satz aus der Erklärung). Am Ende hüpfen die Buchstaben, Konfetti in den Finanzleser-Farben fällt, ein rosa Abzeichen „+50 Punkte“ steigt auf, der Punktestand im Register pulsiert, und Leo im Faden freut sich. Die Erklärung erscheint, der Begriff wandert ins Sitzungs-Glossar, das Ergebnis lässt sich als Raster teilen. Punkte nach Versuchen (60 bis 10), die Serie zählt Tage. Das Wort wird aus dem Datum bestimmt, ohne Redaktion; die Redaktion pflegt nur die Liste der spielbaren Begriffe.
- **Zahl des Tages.** Die bisherige Schätzfrage: einen Wert mit dem Schieberegler treffen (Grundfreibetrag, Kindergeld, Beitragsbemessungsgrenze). Zahlen, die ohnehin in Leos Wissensbasis liegen.
- **Mini-Kreuzworträtsel der Woche.** Fünf mal fünf, aus den Begriffen der Wochenartikel, vorgeneriert und redaktionell geschärft. Erscheint donnerstags mit dem Wochenbrief.
- **Wochen-Quiz.** Fünf Fragen aus den Artikeln der Woche, Rangliste freiwillig.
- **Sammelalbum.** Zwölf Themen-Wappen (Haftpflicht, Hausrat, Hund, Steuer, Rente …). Ein Wappen ist beim Start schon da.
- **Kassensturz.** Acht Fragen, Ergebnis sofort mit drei Lücken und passenden Karten. Wiederholung nach sechs Monaten, dann mit Vergleich zum letzten Mal.

![P3 · Finanzwort des Tages: sechs Versuche, deutsche Tastatur, Hinweise aus dem Glossar.](docs/konzept-visuals/P3-finanzwort.png)

**Belohnungen zahlen aufs Maklergeschäft ein.** Punkte sind nie Geld. Sie schalten frei: den persönlichen Versicherungs-Check bei Finconext (ein Beratungstermin, ab Level 2), PDF-Guides, Vorteile der Akademie. Level: Einsteiger, Kenner, Lotse.

**Für Jüngere** bleiben dieselben Formate, nur die Themen drehen sich: erste Wohnung, erster Job, Studium, Reise. Die Teilen-Funktion ist der Weg zu ihnen.

\newpage

# Halten: Wächter, Kassensturz, Wochenbrief, Aktenkoffer

Die fünf Ideen aus dem August ordnen sich in den Faden ein:

| Idee | Rolle im Faden | Ohne Konto | Mit Konto |
|---|---|---|---|
| **Weiterlesen mit Leo** | Am Ende jedes Abschnitts „Dazu wird oft gefragt“, die Antwort klappt an Ort und Stelle auf, mit WhatsApp-Weg | ja | Unterhaltung wird gemerkt |
| **Finanz-Kassensturz** | Selbsttest als Karte im Faden, Ergebnis sofort, Adresse erst danach, per E-Mail oder WhatsApp | ja | Wiederholung in sechs Monaten mit Vergleich |
| **Mein Aktenkoffer** | Ergebnisse, Checklisten, Vergleiche, Gespräche sammeln | ja, im Browser | gesichert, auf allen Geräten |
| **Der Wächter** | Regel-Wecker auf Fakten und Fristen | — | E-Mail oder WhatsApp |
| **Finanzleser-Lotse** | Fünfteilige Wochenkurse aus dem Checklisten-Bestand; zurückgestellt, nicht im Prototyp | — | Zustellung und Fortschritt |

**Der Kassensturz im Faden.** Er beginnt, wo das Ideenpapier ihn haben wollte: als ruhiges Feld am Ende passender Ratgeber („Wie gut sind Sie eigentlich aufgestellt? Acht Fragen, drei Minuten“), als Vorschlag in Leos Begrüßung, in der Sprungleiste und als Frage von Leo in der Randspalte. Der Kasten ist im Zeitungsstil gebaut: eine Kopfzeile mit dem Stand („Frage 3 von 8“), darunter eine feine Linie, die sich grün füllt, die Frage groß in Serif, die Antworten als eine Zeile mit Sparks dazwischen. Die gewählte Antwort bekommt die dunkle Pille des Registers, dann wechselt die Bühne ruhig zur nächsten Frage; das Ergebnis baut sich Zeile für Zeile auf. Die Fragen kommen einzeln, groß, im Gesprächston, per Tipp zu beantworten: angestellt oder selbstständig, wer im Haushalt lebt, Miete oder Eigentum, ob die Arbeitskraft abgesichert ist, wie fürs Alter vorgesorgt wird, welche Versicherungen es gibt, ob ein Notgroschen da ist. Die Fragen passen sich an: Wer „in Rente“ wählt, wird nicht nach Berufsunfähigkeit gefragt, sondern nach weiteren Einkünften. Zwischendurch eine Schätzfrage mit Regler (die Standardrente nach 45 Jahren), die Punkte bringt. Ein Balken zeigt den Fortschritt. Die Antworten sind Karten mit Zeichen (Koffer, Werkzeug, Sessel, Hut; Schlüssel, Haus; Schild, Sparschwein), die gewählte füllt sich dunkel, dann wechselt die Bühne ruhig zur nächsten Frage. Das Ergebnis erscheint sofort und vollständig: das eigene Profil als kursiver Vorspann, eine Zeile mit grünen und roten Punkten, rechts daneben ein Tacho mit dem Stand von 100, darunter die drei größten Lücken als Karten mit Zeichen, Nummer, einem Satz Begründung und den passenden Rechnern und Ratgebern zum Antippen; zum Schluss ein großes Feld für die Adresse mit „Per E-Mail“ und „Per WhatsApp“. Erst darunter die Frage: „Soll ich Ihnen das als PDF schicken? Dann erinnere ich Sie in sechs Monaten, mit Vorher-nachher-Vergleich.“ Ein Feld für die E-Mail, daneben „Per WhatsApp“. Das Ergebnis lässt sich teilen und in den Aktenkoffer legen.

![P17 · Der Kassensturz fragt: Stand, Fortschrittslinie, die Frage in Serif, Antworten mit Sparks.](docs/konzept-visuals/P17-kassensturz-frage.png)

![P13 · Das Ergebnis: Vorspann, Ampel, drei Lücken als Zeitungsspalten, erst darunter die Frage nach der Adresse.](docs/konzept-visuals/P13-kassensturz.png)

**Weiterlesen mit Leo im Faden.** Die Idee aus dem August, dass Leo dort antwortet, wo die Frage entsteht, passt in den Faden besser als ein Chatfenster: Am Ende jedes Ratgeberabschnitts steht eine schmale Zeile „Dazu wird oft gefragt“ mit zwei bis drei Fragen, die sich aus dem gerade Gelesenen ergeben („Zählt auch der Schlüssel meiner Mietwohnung?“, „Gilt das auch für Chipkarten und Transponder?“). Ein Tipp klappt die Antwort direkt an dieser Stelle auf, schreibend, mit Quelle darunter; der Faden springt nicht, die Lesestelle bleibt. Unter der Antwort drei kleine Aktionen: „In den Aktenkoffer“, „Antwort per WhatsApp schicken“ und „Weiterfragen“, das ein Feld für die Anschlussfrage öffnet. Nach der dritten Antwort einer Sitzung fragt Leo ruhig, ob er sich die Unterhaltung merken soll. Der WhatsApp-Weg ist derselbe wie beim Wächter: Nummer eingeben, eine Nachricht kommt an, der Leser antwortet mit JA, und die Einwilligung ist dokumentiert. Im Prototyp zeigt eine grüne Sprechblase, was ankäme.

![P14 · Weiterlesen mit Leo: die Antwort klappt im Abschnitt auf, darunter der Weg aufs Handy.](docs/konzept-visuals/P14-weiterlesen.png)

**Der Wächter** ist der stärkste Hebel, weil er an echte Termine anknüpft:

| Anlass | Frist | Leos Nachricht |
|---|---|---|
| Kfz-Versicherung wechseln | Zugang der Kündigung bis 30. November | „Am 1. November melde ich mich mit drei geprüften Angeboten.“ |
| Steuererklärung 2025 | 31. Juli 2026 ohne Berater | „Die Formulare liegen im Aktenkoffer, Steuerformulare sind die meistgeklickte Seite.“ |
| PKV-Beitragsanpassung | Schreiben meist im November | „Ihr Tarif ändert sich, so lesen Sie das Schreiben.“ |
| Grundfreibetrag, Kindergeld | Jahreswechsel (2026: 12.348 € · 259 €) | „Der Wert hat sich geändert, Ihr Rechenergebnis auch.“ |
| Riester-Zulage | zwei Jahre nach dem Beitragsjahr | „Die Zulage für 2024 verfällt Ende 2026.“ |
| Zahn-Bonusheft | jährlicher Kontrolltermin | „Der Stempel für 2026 fehlt noch.“ |

Lebensereignisse (Kind, Haus, Hund, Heirat, Ruhestand) sind die zweite Quelle für Wächter-Regeln. Wer im Kassensturz „Hund“ angibt, bekommt die Tier-Themen, nie alles.

## Leos Wochenbrief ist eine Ausgabe des Fadens

Der Newsletter wird nicht als Banner beworben, sondern Teil des Fadens. Jeden Donnerstag legt Leo die Ausgabe als Karte hinein: drei Antworten der Woche, das Finanzwort der Woche, das Mini-Kreuzworträtsel, ein Termin aus dem Wächter-Kalender. Wer eingetragen ist, bekommt dieselbe Ausgabe per E-Mail, und jeder Link darin führt zurück in den Faden, an die richtige Stelle. Für Plus-Mitglieder beginnt der Faden donnerstags mit der Ausgabe.

Eintragen geht an drei Stellen, jedes Mal mit einem Feld und ohne Formular: über den Knopf „Wochenbrief“ im Register, im Verlauf links (Ausgabe, Datum, Feld) und am Ende jeder Kartenkette, wo die Wochenbrief-Karte die drei Themen der nächsten Ausgabe zeigt. Leo erwähnt den Wochenbrief einmal in der Begrüßung, nie öfter. Die Interessen, die im Gespräch auftauchen (Hund, Kinder, Steuer), steuern, welche drei Antworten in der Ausgabe stehen.

\newpage

# Finanzleser Plus

Plus ist kostenlos. Es entsteht nicht durch ein Formular, sondern durch eine Sicherungsfrage: Wer drei Dinge im Aktenkoffer hat, wird gefragt, ob Leo sie sichern soll. Eine E-Mail-Adresse genügt, kein Passwort. Wer mag, nutzt Face ID oder Fingerabdruck (Passkey). Das ist für die ältere Zielgruppe entscheidend: nichts zu merken, nichts zu vergessen.

![W7 · Erst der Nutzen, dann die Sicherungsfrage, dann das Konto.](docs/konzept-visuals/W7.png)

**Plus enthält:** gesicherter Aktenkoffer auf allen Geräten, gespeicherte Gespräche, Wächter per E-Mail oder WhatsApp, Wochenbrief mit Themenwahl, Kassensturz-Wiederholung, Sammelalbum und Belohnungen (Versicherungs-Check bei Finconext, PDF-Guides, Akademie-Vorteile), Interessen, die Leos Vorschläge steuern.

**Daten.** Nutzerdaten liegen getrennt vom Redaktionssystem, in der EU, mit Auftragsverarbeitungsvertrag, jederzeit löschbar. Die Empfehlung im Technik-Anhang nennt einen Anbieter mit Rechenzentrum in Frankfurt.

## Mein Bereich: Aktenkoffer und Wächter

Der Bereich für angemeldete Leser ist kein eigenes Layout, sondern ein Blatt wie das Register: Der Knopf „Plus“ klappt das **Plus-Blatt** unter der Kopfzeile auf, in drei Spalten. Verwaltet wird oben, gelesen wird unten im Faden.

**Der Aktenkoffer ist eine Mappe mit Belegen.** Jeder Beleg zeigt Titel, Wert oder Stand, Datum und einen Öffnen-Pfeil: „Unterhaltsrechner 2026 · 1.096 € / Monat · 3. Sept.“, „Checkliste Schlüsselverlust · 4 von 6 erledigt“, „Gespräch: Tresorschlüssel · Leo, 3 Antworten“. Reiter trennen Ergebnisse, Checklisten, Vergleiche und Gespräche. Belege entstehen aus jedem Kasten und jeder Kette („In den Aktenkoffer“). Ohne Konto liegen sie im Browser, mit Konto tragen sie den Stempel „gesichert“. Öffnen legt den Beleg als Kapitel in den Faden, und Leo bietet an, mit dem Wert von früher zu vergleichen. Verspielte Details: die gestrichelte Lochkante am Beleg, der schräg gesetzte Stempel.

**Der Wächter ist eine Liste von Regeln „Wenn … dann …“.** „Wenn der 1. November naht, dann drei geprüfte Kfz-Angebote per WhatsApp.“ „Wenn sich die Düsseldorfer Tabelle ändert, dann das Unterhaltsergebnis neu prüfen, per E-Mail.“ Jede Regel hat einen Schalter, einen Kanal und den nächsten Termin. Darunter die **Jahresleiste**: zwölf Monate, Punkte für heute, die Fristen und den Jahreswechsel. Regeln entstehen aus jedem Kasten („Wächter setzen“) oder werden von Leo vorgeschlagen. Meldet sich ein Wächter, erscheint im Kapitel „Heute“ eine Zeile „Wächter meldet“ mit „Regel ändern“ und „Stumm“, nie ein Pop-up.

**Das Profil** zeigt Name, Anmeldeart (Passkey, kein Passwort), Interessen, Wochenbrief-Status, Punkte, Serie, Sammelalbum und die Belohnungen, darunter den Versicherungs-Check bei Finconext ab Level 2. Abgemeldet zeigt das Plus-Blatt die Sicherungsfrage mit E-Mail oder Passkey und den ungesicherten Aktenkoffer. Auf dem Handy fährt das Blatt als Vollbild mit drei Reitern ein.

![W11 · Mein Bereich: Aktenkoffer und Wächter als Plus-Blatt.](docs/konzept-visuals/W11.png)

\newpage

# Die Brücke zu Finconext

Finconext verdient an Abschlüssen. Der Faden öffnet den Weg dorthin an drei Stellen, jedes Mal aus einem Nutzen heraus:

1. **Anbieter-Karten nach beantworteter Frage.** „Passende Tarife der Finconext-Partner“ mit Sparte, Beispielpreis und dem Knopf „Angebot berechnen bei Finconext“. Der Rechner bei Finconext ist selbst ein Gespräch; der Wechsel ist ein Klick, zurück auch. Für die Partner-Sparten: Privathaftpflicht, Hausrat, Unfall, Hund, Pferd, Fahrrad, Wohngebäude, Rechtsschutz.
2. **Wächter mit Angeboten.** Am 1. November drei geprüfte Kfz-Angebote; bei einer Beitragsanpassung ein Vergleich. Eine Nachricht, die einen Termin trifft, statt eines Newsletters.
3. **Belohnung Versicherungs-Check.** Ab Level 2 ein Beratungstermin bei Finconext, freigeschaltet durch Punkte. Wer vier Wochen lang die Finanzfrage spielt, ist ein warmer Kontakt.

**Redaktion.** Der Traffic kommt für Familie und Steuer, das Maklerangebot liegt bei Sach- und Tierversicherungen. Die Redaktion baut dort aus, wo sich beides kreuzt: Kind und Haftpflicht, Trennung und Hausrat, Hund und Unterhalt für den Hund, Haus und Gebäude. Die Help-Center-Artikel der Partner (Gewässerschaden, Schlüsselverlust, Mietsachschäden) zeigen, welche Detailfragen Menschen bei Google stellen; Leo beantwortet genau diese aus den Bedingungen.

**Andere Sparten** laufen über Vergleiche mit Partnerlinks (bestehend, teils zu erneuern).

## Werbung: wo Anzeigen hindürfen und wo nie

Die Regeln kommen aus drei Quellen: Googles AdSense-Richtlinien, den Better Ads Standards (die Chrome durchsetzt) und dem deutschen Kennzeichnungsrecht (§ 5a UWG, § 6 DDG, Pressekodex Ziffer 7). Wichtig zu wissen: Eine feste Obergrenze von drei Anzeigen je Seite gibt es seit 2016 nicht mehr; stattdessen gilt „nie mehr Anzeigen als Inhalt“, und Menüs, Slider und Kopfzeilen zählen dabei nicht als Inhalt.

| Platz | Format | Regel |
|---|---|---|
| Rechte Randspalte | 300 × 600 unten im klebenden Block, unter Glossar und Leos Frage | Der Block klebt unter dem Kopf, die Anzeige bleibt bei wenig Höhe angeschnitten und wird erst mit dem Ende des Fadens hochgeschoben. Zu klären: die 30-Prozent-Regel für dauerhaft klebende Anzeigen |
| Linke Randspalte | 300 × 600 unten im klebenden Block, ab 1440 Pixel Breite | Darüber Verlauf und Inhaltsverzeichnis, immer erreichbar |
| Im Ratgeber, umflossen | 300 × 250 im Text, der Text läuft herum | Eines im ersten Abschnitt rechts, eines in den häufigen Fragen links; bei 728 Pixel Lesebreite bleiben 400 Pixel Text daneben, Zeitungssatz |
| Im Ratgeber | 728 × 90 quer, mobil 320 × 100 | Erst nach dem zweiten Abschnitt, danach 500 bis 800 Wörter Abstand; das Querformat passt in die Textspalte und stört den Lesefluss weniger als ein Kasten |
| Zwischen Kapiteln | 728 × 90 als In-Feed | Vor jedem Kapitel eines, auch vor dem ersten; wie ein Beitrag im Feed gestaltet |
| Mobil unten | Googles Anchor-Format | Gesamtdichte der Seite unter 30 Prozent |
| Direkt unter Leos Antwort | keine | Googles Richtlinie „Ads in Private Communications“ (seit August 2024) trifft Chats; ob ein redaktioneller Faden darunterfällt, ist nicht geklärt. Bis dahin: Abstand halten |
| Registerblatt, Plus-Blatt | keine | Navigationsfläche ohne Inhalt, Zufallsklick-Regel |
| Intro und Startseite | keine | Zu wenig Text im Verhältnis zur Anzeige |

**Kennzeichnung.** AdSense-Flächen tragen nur „Anzeige“ oder „Werbung“, nie „Empfehlung“. Vergleiche mit Partnerlinks tragen „Anzeige · Vergleich mit Partnerlinks“ oben im Kasten, sichtbar vor dem Klick: Das OLG München hat im Oktober 2025 entschieden, dass ein Sternchen unterhalb des Teasers nicht reicht. Finconext-Kästen tragen „Anzeige in eigener Sache“ und heben sich mit der Magenta-Kante sichtbar von der Redaktion ab, auch wenn der Betreiber werben darf. Für personalisierte Anzeigen braucht es eine zertifizierte Einwilligungslösung nach IAB TCF v2.3 (verbindlich seit 1. März 2026).

**Was im Prototyp schon steht.** Die Plätze sind mit Beispielanzeigen fiktiver Marken belegt (Kontora Bank, Steuerfuchs, Pfotenschutz, Nordlicht, baufix), in den echten Maßen 728 × 90, 300 × 250, 300 × 600, 160 × 600 und 320 × 100, damit man sieht, wie die Seite mit Werbung wirkt und nicht nur mit grauen Flächen. Das Querformat läuft vor jedem Kapitel und im Ratgeber nach dem zweiten Abschnitt, auf dem Handy wird es automatisch gegen das kleine Querformat getauscht. Zwei 300 × 250 stehen im Ratgeber im Text, der Text läuft um sie herum. In den Randspalten sitzen die großen Hochformate unten im mitlaufenden Block, unter Verlauf beziehungsweise Glossar und Leos Frage.

![P11 · Ratgeber in 728 Pixel Lesebreite: Rectangle im Text, links der Verlauf mit 160 × 600, rechts Glossar, Leos Frage und 300 × 600.](docs/konzept-visuals/P11-728-rails.png) Alle Plätze tragen die adblocker-neutralen Klassennamen der heutigen Seite. Anzeigen laden erst, wenn das Kapitel ins Bild kommt.

![W12 · Werbeplätze im Zeitungslayout: wo Anzeigen hindürfen und wo nie.](docs/konzept-visuals/W12.png)

\newpage

# Für wen: ältere und junge Nutzer

**Ältere, technikferne Menschen** sind die Hauptzielgruppe. Das Konzept setzt deshalb auf:

- Vorschlag-Chips als Hauptweg, Tippen statt Schreiben; drei bis sechs Einstiege, nie mehr.
- Eine Eingabe, die immer sichtbar bleibt: unten in der Mitte, mit einem progressiven Blur nur in ihrer Spalte, hinter dem der Inhalt weich ausblendet, statt hart überlagert zu werden. Der Faden springt nie ans Ende: Neues erscheint mit seinem Anfang, und wer gerade liest, wird nicht weggescrollt.
- Fachwörter erklären sich auf Tipp, ohne die Seite zu verlassen; die Erklärungen bleiben rechts liegen.
- Mikrofon- und Vorlesen-Taste (Vorlesen mit Bordmitteln des Browsers, ohne zusätzlichen Dienst).
- Schrift mindestens 16 Pixel, Zeilenhöhe 1,5, hoher Kontrast; die Vergrößerung des Browsers funktioniert.
- Keine versteckten Gesten: alles auch per Taste. „Zurück“ heißt immer zurück ins Gespräch.
- Das klassische Magazin-Menü bleibt oben sichtbar. Wer nicht chatten will, blättert wie bisher; der Faden hilft, ohne sich aufzudrängen.
- Anmeldung ohne Passwort.

**Jüngere** finden dieselben Formate mit anderen Themen und über das Teilen: das Raster der Finanzfrage, der Link zu einem Spiel, der Vergleich für die erste Wohnung.

**Barrierefreiheit** ist ab dem 28. Juni 2025 durch das Barrierefreiheitsstärkungsgesetz geregelt. Ob ein Magazin ohne Abschlussstrecke darunterfällt, ist nicht eindeutig; mit Vergleichsrechnern und Kontaktwegen zu Versicherungen rückt die Seite in den erfassten Bereich. Das Konzept setzt deshalb WCAG 2.1 AA von Anfang an: Tastaturbedienung, sichtbarer Fokus, Ansage neuer Karten für Screenreader, Alternativen zu rein grafischen Elementen. Eine rechtliche Einzelfallprüfung wird empfohlen.

\newpage

# Suchmaschinen und KI-Suche

**Warum jede Karte eine Adresse behält.** Google rendert JavaScript, aber verzögert und mit Budget; die Empfehlung ist unverändert, inhaltstragende Elemente serverseitig auszuliefern. Endlos-Scroll ohne eigene Adressen wird nur teilweise indexiert. Die Lösung „eigene Adresse je Einheit, vollständiger Inhalt im HTML“ ist die dokumentierte Best Practice. Das Konzept erfüllt sie strukturell: Unter jeder Adresse liefert der Server den Faden mit der vollständigen Kette, als semantischer Artikel mit Überschriften, Häufigen Fragen und Fazit. Suchmaschinen und Menschen bekommen denselben Inhalt; die Menschen zusätzlich Leo. Auch die Übersichtskarten behalten die Adressen der heutigen Übersichtsseiten.

**Was für die KI-Suche zählt.** Die Studie zu „Generative Engine Optimization“ (Princeton/AllenAI, 2024) zeigt in einem Benchmark mit 10.000 Anfragen, dass Statistiken (+41 %), Zitate und Quellenangaben die Sichtbarkeit einer Quelle in generativen Antworten am stärksten erhöhen. Ahrefs fand, dass nur 12 Prozent der von ChatGPT, Gemini und Copilot zitierten Adressen in Googles Top 10 stehen; bei Googles eigenen AI Overviews stammen 76 Prozent aus den Top 10. Die Redaktion schreibt deshalb in zitierfähigen Absätzen: eine klare Antwort, eine Zahl mit Quelle, ein Zitat aus dem Bedingungswerk. Das ist ohnehin Leos Stil.

**Strukturierte Daten.** Googles FAQ-Anzeige in den Suchergebnissen läuft am 7. Mai 2026 aus, HowTo ist bereits weg. FAQ-Auszeichnung bleibt trotzdem sinnvoll, weil KI-Systeme sie lesen; für Rechner ist die Auszeichnung als Anwendung relevant. Die Datei `llms.txt` ist kein Standard (etwa 10 Prozent Verbreitung, kein großer Anbieter verbindlich); sie wird angeboten, aber nicht als tragende Maßnahme behandelt.

**Kontrolle.** Vor jeder Ausbaustufe wird geprüft, dass Suchmaschinen weiterhin die vollständige Seite sehen: ohne JavaScript, mit denselben Meta-Angaben, mit unveränderten Weiterleitungen. Die Prüfwerkzeuge dafür existieren aus der SEO-Reparatur.

\newpage

# Ausbaustufen

| Stufe | Was entsteht | Nutzen | Zeit |
|---|---|---|---|
| **0 · Konzept und Prototyp** | Dieses Dokument, acht Skizzen, Klick-Prototyp; Feinschliff der Karten in Figma | Gemeinsames Bild, Entscheidung | erledigt / 3–4 Tage |
| **1 · Der Faden** | Faden im Zeitungsstil mit Kapiteln und Eingabe, Startseite mit Lichtfäden, Register mit vier Blättern, Sprungleiste, Ratgeber als ausgerollte Kette mit Inhaltsverzeichnis, Kästen für Rechner und Vergleich, Glossar mit Klickmenü und Sitzungsleiste, Wochenbrief-Karte, Werbeplätze; jeder Inhalt und jeder Begriff mit eigener Adresse | Die Seite fühlt sich wie ein Gespräch an, liest sich wie eine Zeitung, die Orientierung bleibt, ohne SEO-Risiko | 12–16 Tage |
| **2 · Leo wirft ein, Spiele zählen** | Leos Einwürfe (Statistik, Anbieter, Spiel, Checkliste), Leos Frage in der Randspalte, Finanzwort des Tages mit Serie und Teilen, Mini-Kreuzworträtsel der Woche, Spiele mit eigener Adresse, Kassensturz, Weiterlesen mit Leo | Wiederkehr, Reichweite, erste Leads über Anbieter-Karten | 10–12 Tage |
| **3 · Finanzleser Plus** | Konto ohne Passwort, gesicherter Aktenkoffer, Wächter per E-Mail und WhatsApp, Wochenbrief, Mein Bereich | Bindung, Termine, warme Kontakte für Finconext | 12–15 Tage |
| **4 · Ausbau** | Werbung auf den Karten-Seiten, Lotse-Kurse, Menü-Neubewertung, engere Verzahnung mit Leos Wissensbasis | Erlöse, Akademie-Trichter | fortlaufend |

**Einordnung ins Phase-2-Angebot (100 Stunden bis Ende September).** Realistisch sind Stufe 1 im Kern (Faden mit Kapiteln, Startseite, Register mit Blättern, Sprungleiste, Kette für Ratgeber, Rechner-Kasten, Glossar im Text) und der Anfang von Stufe 2 (Leos Einwürfe, Finanzwort des Tages). Der Login-Bereich aus dem Angebot wird als Stufe 3 in der hier beschriebenen Form umgesetzt: als Sicherung nach dem Nutzen, ohne Passwort, mit Daten außerhalb des Redaktionssystems. Werbung ist auf den Karten-Seiten sofort möglich, im Faden nicht. Die dafür nötigen Vertragsschritte (Datenschutz, WhatsApp-Verifizierung) laufen parallel und brauchen keine Entwicklungszeit.

\newpage

# Offene Punkte und Entscheidungen

| Punkt | Wer | Was zu klären ist |
|---|---|---|
| **Leos Wissensbasis und Antwortformat** | Finconext (Leo-Team) | Leo soll neben Text auch Karten-Empfehlungen liefern. Bis dahin ermittelt die Website die passenden Karten selbst. |
| **WhatsApp Business** | Finconext | Unternehmensverifizierung bei Meta, Absendernummer, Freigabe der Nachrichtenvorlagen. Kosten je Nachricht in Deutschland: Service-Hinweise etwa 5 Cent, Werbung 11 bis 14 Cent. |
| **Datenschutz für Plus** | Finconext / Datenschutz | Auftragsverarbeitungsvertrag mit dem Konto-Anbieter (EU-Region), Datenschutzerklärung, Löschkonzept. |
| **Werbung** | Finconext | Entscheidung: Anzeigen nur auf Karten-Seiten. Für personalisierte Anzeigen zertifizierte Einwilligungslösung (TCF v2.3). |
| **Partner-Sparten und Beispielpreise** | Finconext | Welche Partner und Sparten sollen in Anbieter-Karten erscheinen, welche Einstiegspreise dürfen genannt werden. |
| **Belohnungen** | Finconext | Versicherungs-Check als Beratungstermin: Ablauf, Kapazität, Übergabe. |
| **Barrierefreiheit** | Rechtsberatung | Einordnung nach BFSG; unabhängig davon WCAG 2.1 AA als Standard. |
| **Glossar als Kette** | Finconext / Redaktion | Reicht das Glossar im Service-Blatt (Alphabet, Begriff öffnet Leos Erklärung), oder soll es zusätzlich als Kette A bis Z im Faden liegen? Der Prototyp zeigt beides. |
| **Glossar-Pflege** | Redaktion | Erste Fassung der Erklärungen aus den Ratgebern ableiten (Leo kann Entwürfe schreiben, die Redaktion prüft); Zuordnung Begriff → Ratgeber, Tool und Frage. |
| **Finanzwort-Liste** | Redaktion | Welche Begriffe sind spielbar (fünf bis acht Buchstaben, geläufig genug), Umlaute als eigene Buchstaben. |
| **Kopfzeile beim Scrollen** | Design | Entscheidung Runde 7: Kopf bleibt oben in fester Höhe über dem progressiven Blur, das Register bleibt sichtbar; keine Verkleinerung. Auf dem Handy Burger. |
| **Intro-Assets** | Design | Für „Die Zeitung“ genügen Zeichen und Flieger als SVG; die Zeitungsseiten sind HTML im Stil der Grafiken. |

\newpage

# Quellen

**Nutzung und Spiele**

1. game-Verband, Jahresreport der deutschen Games-Branche 2025. https://www.game.de/guides/jahresreport-der-deutschen-games-branche-2025/01-spielerinnen-und-spieler-in-deutschland/
2. Bitkom, Gaming in Deutschland 2025. https://www.bitkom.org/Presse/Presseinformation/Gaming-Deutschland-2025
3. ARD/ZDF-Medienstudie 2025, Media Perspektiven. https://www.media-perspektiven.de/fileadmin/user_upload/media-perspektiven/pdf/2025/MP_34_2025_ARD_ZDF-Medienstudie_Lebensalter_oder_Generation_was_bestimmt_die_Mediennutzung_Kohortenanalysen.pdf
4. mpfs, JIM-Studie 2025. https://mpfs.de/app/uploads/2025/11/JIM_2025_PDF_barrierearm.pdf
5. AARP, Video Games: Attitudes and Habits of Adults Age 50-Plus (2023). https://www.aarp.org/pri/topics/technology/internet-media-devices/electronic-gaming-research-adults-50plus/
6. Duolingo Blog, How Streaks keep Duolingo learners committed (2024). https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
7. Pulse2, Duolingo Daily Active Users Reach 58.7 Million (2026). https://pulse2.com/duolingo-daily-active-users-reach-58-7-million-as-retention-hits-record-84-and-social-accounts-top-1-billion-organic-impressions/amp/
8. Press Gazette, How games help power The New York Times subscription model (2024). https://pressgazette.co.uk/north-america/new-york-times-games-puzzles-wordle-subscriptions/
9. Axios, NYT says Wordle acquisition added tens of millions of new users (2022). https://www.axios.com/new-york-times-earnings-wordle-acquisition-users-0cb11458-5b27-493b-a14b-d0d96eb82f7a.html
10. Udonis, How Many People Play Wordle Daily (2026). https://www.blog.udonis.co/mobile-marketing/mobile-games/wordle
11. Nunes & Drèze, The Endowed Progress Effect, Journal of Consumer Research 2006 (Zusammenfassung). https://learningloop.io/plays/psychology/endowed-progress-effect
12. Finanztip, Presse. https://www.finanztip.de/presse/
13. Clark, Die CLARK App. https://www.clark.de/clark-app/
14. remind.me, Kfz-Versicherung wechseln. https://www.remind.me/kfzversicherung/ratgeber/wechseln-sie-jetzt-ihre-kfz-versicherung
15. Nielsen Norman Group, 10 Guidelines for Designing Your Site's AI Chatbots (2025). https://www.nngroup.com/articles/ai-chatbots-design-guidelines/
16. PMC, Age-Sensitive Usability in Conversational AI Agents: A Systematic Review (2025). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12761613/

**Fristen und Werte**

17. AUTO BILD, Kfz-Versicherung kündigen (2025). https://www.autobild.de/artikel/kfz-versicherung-kuendigen-1304373.html
18. steuertipps.de, Abgabefrist Steuererklärung 2025 (2026). https://www.steuertipps.de/finanzamt-formalitaeten/abgabefrist-fuer-die-steuererklaerung
19. Beamtenservice, Beitragserhöhung PKV 2026. https://beamtenservice.de/beitragserhoehung-pkv/
20. Bundesfinanzministerium, Das ändert sich 2026. https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/das-aendert-sich-2026.html
21. Deutsche Rentenversicherung, Riester-Zulagen beantragen (2023). https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2023/231124-frist-riester-zulagen.html
22. VIACTIV, Zahnarzt-Bonusheft. https://www.viactiv.de/leistungen/zaehne/zahnvorsorge/zahnarzt-bonusheft

**Gesprächs-Oberflächen**

23. CNN Business, Lemonade likes to talk up its AI (2021). https://www.cnn.com/2021/05/27/tech/lemonade-ai-insurance
24. Medium, Love At First Chat, With Lemonade's AI Chatbot Maya. https://medium.com/marketing-in-the-age-of-digital/love-at-first-chat-with-lemonades-ai-chatbot-maya-7b4a105824bd
25. Unusual, Perplexity Platform Guide. https://www.unusual.ai/blog/perplexity-platform-guide-design-for-citation-forward-answers
26. AI UX Playground, Follow-up Chips. https://aiuxplayground.com/pattern/follow-up-chips/
27. Vercel, Introducing AI SDK 3.0 with Generative UI. https://vercel.com/blog/ai-sdk-3-generative-ui
28. Versicherungsmagazin, Getsafe übergibt Geschäft an Verivox (2022). https://www.versicherungsmagazin.de/rubriken/branche/digitaler-versicherungsmakler-get-safe-uebergibt-geschaeft-an-verivox-2212080.html

**Suchmaschinen und KI-Suche**

29. Google Search Central, Understand JavaScript SEO Basics. https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
30. Google Search Central Blog, Changes to HowTo and FAQ rich results (2023). https://developers.google.com/search/blog/2023/08/howto-faq-changes
31. Google Search Central, FAQPage structured data (Hinweis zum Auslaufen Mai 2026). https://developers.google.com/search/docs/appearance/structured-data/faqpage
32. Google Search Central, SoftwareApplication structured data. https://developers.google.com/search/docs/appearance/structured-data/software-app
33. Aggarwal et al., GEO: Generative Engine Optimization, KDD 2024. https://arxiv.org/abs/2311.09735
34. Ahrefs, Only 12% of AI Cited URLs Rank in Google's Top 10. https://ahrefs.com/blog/ai-search-overlap/
35. Semrush, We Studied 200,000 AI Overviews. https://www.semrush.com/blog/ai-overviews-study/
36. llmstxt.org und PPC Land, llms.txt adoption stalls. https://llmstxt.org/ · https://ppc.land/llms-txt-adoption-stalls-as-major-ai-platforms-ignore-proposed-standard/
37. SEOClarity, Pagination vs Infinite Scroll. https://www.seoclarity.net/blog/pagination-vs-infinite-scroll

**Werbung und Recht**

38. PPC Land, Google updates policies on Ads in Private Messaging (2024). https://ppc.land/google-updates-policies-on-ads-in-private-messaging-and-personalized-advertising/
39. Google AdSense Help, Ad placement policies. https://support.google.com/adsense/answer/1346295
40. Google AdSense Help, Consent management requirements EEA/UK/CH. https://support.google.com/adsense/answer/13554116
41. TrustArc, IAB TCF v2.2 & Google CMP Requirements. https://trustarc.com/resource/latest-iab-tcf-google-cmp-requirements/
42. eMarketer, Google testing ads in chatbots with AI startups (2025). https://www.emarketer.com/content/google-testing-ads-chatbots-with-ai-startups
43. § 1 BFSG und WCAG-Checkliste. https://bfsg-gesetz.de/1-bfsg/ · https://bfsg-gesetz.de/wcag/
44. IHK Region Stuttgart, BFSG tritt im Juni 2025 in Kraft. https://www.ihk.de/stuttgart/fuer-unternehmen/recht-und-steuern/it-recht/barrierefreie-webseiten-6200594

**Finconext (öffentliche Sicht)**

45. finconext.de: Startseite, Sitemap, Über Finconext, Impressum. https://www.finconext.de/ · https://www.finconext.de/sitemap.xml · https://www.finconext.de/ueber-finconext
46. Help-Center-Subdomains (Auswahl): https://ammerlaender-versicherung.finconext.de/hc/de · https://haftpflichtkasse.finconext.de/hc/de · https://deurag.finconext.de/hc/de · https://hansemerkur.finconext.de/hc/de · https://vhv-versicherung.finconext.de/hc/de
47. berater.finconext.de (Suchindex-Snippet). https://berater.finconext.de/

**Werbung: Regeln und Recht**

51. Google AdSense, Ad placement policies. https://support.google.com/adsense/answer/1346295?hl=de
52. Google Publisher Policies, More ads than content. https://support.google.com/publisherpolicies/answer/11169917
53. Google AdSense, In-article ads und In-feed ads. https://support.google.com/adsense/answer/9189562 · https://support.google.com/adsense/answer/9189037
54. Coalition for Better Ads, Standards für Desktop und Mobil. https://www.betterads.org/mobile-large-sticky-ad/ · https://www.betterads.org/mobile-ad-density-higher-than-30/
55. § 6 DDG. https://www.gesetze-im-internet.de/ddg/__6.html
56. Presserat, Trennungsgrundsatz Ziffer 7. https://www.presserat.de/presse-nachrichten-details/trennungsgrundsatz-nach-ziffer-7-h%C3%A4ufig-missachtet.html
57. Wettbewerbszentrale, OLG München zu Teasern mit Affiliate-Links (2025). https://www.wettbewerbszentrale.de/olg-muenchen-teaser-muessen-als-werbung-erkennbar-oder-gekennzeichnet-sein/
58. MarTech, AdSense hebt 3-Anzeigen-Grenze auf (2016). https://martech.org/google-removes-adsense-3-ads-per-page-limit-focuses-content-ad-balance/

**Scroll-Intros**

59. OpenAI, GPT-6 Astra (Live-Analyse der Seite). https://openai.com/index/gpt-6-astra/
60. Anders Åberg, Reverse-Engineering der iPhone-X-Seite. https://ideasof.andersaberg.com/development/reverse-engineering-apple-x-landing-page
61. CSS-Tricks, Scrolling animations like Apple product pages. https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
62. GSAP, ScrollTrigger-Dokumentation. https://gsap.com/docs/v3/Plugins/ScrollTrigger/
63. MDN, Scroll-driven animations. https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
64. Nielsen Norman Group zu Scroll-Jacking, zusammengefasst. https://dontfuckwithscroll.com/
65. web.dev, Motion und Barrierefreiheit. https://web.dev/learn/accessibility/motion
66. Flubber (SVG-Morph). https://github.com/veltman/flubber
67. Spline, Preise und Scroll-Interaktion. https://spline.design/pricing

**Wortspiele: Kreuzworträtsel und Wordle**

68. MichaelWehar, Crossword-Layout-Generator (Gitter aus Wortliste). https://github.com/MichaelWehar/Crossword-Layout-Generator
69. JaredReisinger, react-crossword. https://github.com/JaredReisinger/react-crossword
70. Exolve, Kreuzworträtsel in reinem JavaScript. https://www.exolve.org/
71. Crosshare, Konstruktor mit Autofill (Open Source). https://github.com/crosshare-org/crosshare
72. Technobezz, NYT Mini: täglich von Hand konstruiert. https://www.technobezz.com/news/nyt-mini-crossword-fba314257b15185c-hints-clues-and-answers
73. CommuniCrossings, Constructing Crosswords: Process (Zeitaufwand). https://communicrossings.com/constructing-crosswords-process
74. Baeldung, Generating Crossword Puzzles (Wortlängen-Verteilung). https://www.baeldung.com/cs/generate-crossword-puzzle
75. cwackerfuss, react-wordle (offene Referenz). https://github.com/cwackerfuss/react-wordle
76. Wördl, deutsches Wordle mit Umlauten. https://xn--wrdl-5qa.de/ueber
77. Tagesspiegel, Begriffel. https://begriffel.tagesspiegel.de/
78. Rung, Begriff aus gestuften Hinweisen. https://dailyrung.com/
79. PPC Land, NYT Games: 11,2 Mrd. Spielaufrufe 2025. https://ppc.land/new-york-times-gives-games-subscribers-5-to-6-new-puzzles-a-week/
80. Forbes, NYT Games Bonus-Rätsel (2026). https://www.forbes.com/sites/erikkain/2026/09/02/nyt-games-bonus-puzzles-wordle-in-1-connections-3x3/
81. UX Magazine, The Psychology of Hot Streak Game Design. https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame
82. Amuse Labs, PuzzleMe: barrierefreie Kreuzworträtsel. https://amuselabs.com/docs/puzzles/crossword/magic-fill/
83. Twipe, How publishers use gamification and puzzles. https://www.twipemobile.com/how-publishers-use-gamification-and-puzzles-in-newspapers-to-drive-engagement/

**Technik-Kandidaten (Details im Technik-Anhang)**

48. Supabase: Pricing, Regions, DPA, Passkeys. https://supabase.com/pricing · https://supabase.com/docs/guides/platform/regions · https://supabase.com/legal/dpa
49. Meta, WhatsApp Business Platform Pricing. https://developers.facebook.com/docs/whatsapp/pricing
50. MDN, SpeechSynthesis. https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
