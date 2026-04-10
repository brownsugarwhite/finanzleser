#!/usr/bin/env node

/**
 * WordPress Checklisten CPT Seed Script
 * Erstellt alle Checklisten als CPT-Posts via WP-CLI
 * Lädt PDFs hoch und setzt ACF-Felder identisch zu bestehenden Posts
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PDF_DIR = path.join(__dirname, "..", "assets", "checklisten");

// WP-CLI Konfiguration (Local by Flywheel)
const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  const full = `"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`;
  return execSync(full, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
}

// Alle 202 Checklisten mit korrigierten Titeln und SEO-Beschreibungen
const checklisten = [
  // === Bereits in WordPress (werden übersprungen) ===
  { slug: "abfindungen", title: "Abfindungen", filename: "Checkliste_Abfindungen.pdf", desc: "Checkliste für Abfindungen: Steuerliche Behandlung prüfen, Fünftelregelung nutzen und die optimale Auszahlungsstrategie für Ihre Abfindung planen." },
  { slug: "abgeltungssteuer", title: "Abgeltungssteuer", filename: "Checkliste_Abgeltungssteuer.pdf", desc: "Checkliste zur Abgeltungssteuer: Freibeträge ausschöpfen, Freistellungsaufträge einrichten und Kapitalerträge korrekt in der Steuererklärung angeben." },
  { slug: "abschreibungen", title: "Abschreibungen", filename: "Checkliste_Abschreibungen.pdf", desc: "Checkliste für Abschreibungen: Abschreibungsmethoden verstehen, Nutzungsdauer ermitteln und steuerliche Vorteile durch korrekte Absetzung nutzen." },
  { slug: "aktien", title: "Aktien", filename: "Checkliste_Aktien.pdf", desc: "Checkliste für den Aktienkauf: Risikoprofil bestimmen, Depot eröffnen und eine langfristige Anlagestrategie für Ihr Aktienportfolio entwickeln." },
  { slug: "altersteilzeit", title: "Altersteilzeit", filename: "Checkliste_Altersteilzeit.pdf", desc: "Checkliste zur Altersteilzeit: Voraussetzungen prüfen, Block- oder Teilzeitmodell wählen und die finanziellen Auswirkungen auf Rente und Gehalt berechnen." },
  { slug: "altersvorsorgeaufwendungen", title: "Altersvorsorgeaufwendungen", filename: "Checkliste_Altersvorsorgeaufwendungen.pdf", desc: "Checkliste für Altersvorsorgeaufwendungen: Absetzbare Beiträge ermitteln, Höchstbeträge ausschöpfen und die steuerliche Förderung optimal nutzen." },
  { slug: "festgeld", title: "Geldanlage auf Festgeld", filename: "Checkliste_Festgeld.pdf", desc: "Checkliste für die Festgeldanlage: Laufzeiten und Zinsen vergleichen, Einlagensicherung prüfen und die optimale Anlagedauer für Ihre Ziele bestimmen." },
  { slug: "fonds", title: "Fonds", filename: "Checkliste_Fonds.pdf", desc: "Checkliste für Fondsanlage: Fondstypen verstehen, Kosten und Gebühren vergleichen und die passende Anlagestrategie für Ihr Portfolio wählen." },
  { slug: "immobilien", title: "Immobilien als Geldanlage", filename: "Checkliste_Immobilien.pdf", desc: "Checkliste für Immobilien als Geldanlage: Standort analysieren, Rendite berechnen und Finanzierungsmöglichkeiten für Ihre Kapitalanlage prüfen." },
  { slug: "kredite", title: "Kredite", filename: "Checkliste_Kredite.pdf", desc: "Checkliste für Kredite: Kreditangebote vergleichen, effektiven Jahreszins prüfen und die passende Finanzierung für Ihr Vorhaben finden." },
  { slug: "tagesgeld", title: "Geldanlage auf Tagesgeld", filename: "Checkliste_Tagesgeld.pdf", desc: "Checkliste für die Tagesgeldanlage: Zinsen vergleichen, Einlagensicherung prüfen und die flexible Geldanlage optimal für Ihre Sparziele nutzen." },

  // === Neue Checklisten ===
  { slug: "arbeitgeberzuschuss-private-krankenversicherung", title: "Arbeitgeberzuschuss Private Krankenversicherung", filename: "Checkliste_Arbeitgeberzuschuss_Private_Krankenversi.pdf", desc: "Checkliste zum Arbeitgeberzuschuss für die PKV: Anspruchsvoraussetzungen prüfen, Zuschusshöhe berechnen und den Antrag beim Arbeitgeber korrekt stellen." },
  { slug: "arbeitnehmer-sparzulage", title: "Arbeitnehmer-Sparzulage", filename: "Checkliste_Arbeitnehmer_Sparzulage.pdf", desc: "Checkliste zur Arbeitnehmer-Sparzulage: Einkommensgrenzen prüfen, förderfähige Anlageformen wählen und die staatliche Zulage rechtzeitig beantragen." },
  { slug: "arbeitskleidung", title: "Arbeitskleidung", filename: "Checkliste_Arbeitskleidung.pdf", desc: "Checkliste für Arbeitskleidung: Steuerlich absetzbare Berufskleidung erkennen, Belege sammeln und die Kosten korrekt in der Steuererklärung geltend machen." },
  { slug: "arbeitslosengeld", title: "Arbeitslosengeld", filename: "Checkliste_Arbeitslosengeld.pdf", desc: "Checkliste zum Arbeitslosengeld: Anspruchsvoraussetzungen prüfen, Antrag rechtzeitig stellen und die Leistungshöhe sowie Bezugsdauer ermitteln." },
  { slug: "arbeitsmittel", title: "Arbeitsmittel", filename: "Checkliste_Arbeitsmittel.pdf", desc: "Checkliste für Arbeitsmittel: Absetzbare Berufsgegenstände identifizieren, Sofortabschreibung nutzen und die Kosten korrekt als Werbungskosten angeben." },
  { slug: "arbeitszimmer", title: "Arbeitszimmer", filename: "Checkliste_Arbeitszimmer.pdf", desc: "Checkliste für das häusliche Arbeitszimmer: Abzugsvoraussetzungen prüfen, anteilige Kosten berechnen und die Homeoffice-Pauschale optimal nutzen." },
  { slug: "ausbildungskosten", title: "Ausbildungskosten", filename: "Checkliste_Ausbildungskosten.pdf", desc: "Checkliste für Ausbildungskosten: Erst- und Zweitausbildung unterscheiden, absetzbare Kosten erfassen und die steuerliche Geltendmachung richtig vornehmen." },
  { slug: "auslandskrankenversicherung", title: "Auslandskrankenversicherung", filename: "Checkliste_Auslandskrankenversicherung.pdf", desc: "Checkliste zur Auslandskrankenversicherung: Reiseziel und Dauer berücksichtigen, Leistungsumfang vergleichen und den passenden Tarif für Ihre Reise wählen." },
  { slug: "aussergewoehnliche-belastungen", title: "Außergewöhnliche Belastungen", filename: "Checkliste_Außergewöhnliche_Belastungen.pdf", desc: "Checkliste für außergewöhnliche Belastungen: Anerkannte Aufwendungen kennen, zumutbare Eigenbelastung berechnen und die Kosten steuerlich absetzen." },
  { slug: "bafoeg", title: "BAföG", filename: "Checkliste_Bafög.pdf", desc: "Checkliste zum BAföG: Förderungsvoraussetzungen prüfen, erforderliche Unterlagen zusammenstellen und den Antrag fristgerecht beim Amt einreichen." },
  { slug: "basisrente", title: "Basisrente", filename: "Checkliste_Basisrente.pdf", desc: "Checkliste zur Basisrente (Rürup): Steuervorteile berechnen, Anbieter vergleichen und die Basisrente als Baustein Ihrer Altersvorsorge prüfen." },
  { slug: "basistarif-in-der-pkv", title: "Basistarif in der PKV", filename: "Checkliste_Basistarif_in_der_PKV.pdf", desc: "Checkliste zum Basistarif in der PKV: Zugangsvoraussetzungen prüfen, Leistungsumfang verstehen und den Wechsel in den Basistarif vorbereiten." },
  { slug: "baufinanzierung", title: "Baufinanzierung", filename: "Checkliste_Baufinanzierung.pdf", desc: "Checkliste zur Baufinanzierung: Eigenkapital ermitteln, Kreditangebote vergleichen und die optimale Finanzierungsstrategie für Ihre Immobilie planen." },
  { slug: "bauherrenhaftpflichtversicherung", title: "Bauherrenhaftpflichtversicherung", filename: "Checkliste_Bauherrenhaftpflichtversicherung.pdf", desc: "Checkliste zur Bauherrenhaftpflichtversicherung: Haftungsrisiken beim Hausbau absichern, Deckungssummen prüfen und den passenden Versicherungsschutz wählen." },
  { slug: "bausparvertrag", title: "Bausparvertrag", filename: "Checkliste_Bausparvertrag.pdf", desc: "Checkliste zum Bausparvertrag: Bausparsumme festlegen, Tarife vergleichen und die staatliche Förderung durch Wohnungsbauprämie und Arbeitnehmersparzulage nutzen." },
  { slug: "beitragsanpassung-pkv", title: "Beitragsanpassung PKV", filename: "Checkliste_Beitragsanpassung_PKV.pdf", desc: "Checkliste zur Beitragsanpassung in der PKV: Erhöhung nachvollziehen, Handlungsoptionen prüfen und durch Tarifwechsel oder Selbstbehalt Beiträge senken." },
  { slug: "beitragsbemessungsgrenzen", title: "Beitragsbemessungsgrenzen", filename: "Checkliste_Beitragsbemessungsgrenzen.pdf", desc: "Checkliste zu Beitragsbemessungsgrenzen: Aktuelle Werte kennen, Auswirkungen auf Sozialversicherungsbeiträge verstehen und Ihre Abgaben korrekt berechnen." },
  { slug: "berliner-testament", title: "Berliner Testament", filename: "Checkliste_Berliner_Testament.pdf", desc: "Checkliste zum Berliner Testament: Erbfolge und Pflichtteil verstehen, steuerliche Auswirkungen prüfen und das gemeinschaftliche Testament rechtssicher aufsetzen." },
  { slug: "berufshaftpflichtversicherung", title: "Berufshaftpflichtversicherung", filename: "Checkliste_Berufshaftpflichtversicherung.pdf", desc: "Checkliste zur Berufshaftpflichtversicherung: Berufsrisiken einschätzen, Deckungssummen festlegen und den passenden Schutz für Ihre berufliche Tätigkeit finden." },
  { slug: "berufsunfaehigkeitsversicherung", title: "Berufsunfähigkeitsversicherung", filename: "Checkliste_Berufsunfähigkeitsversicherung.pdf", desc: "Checkliste zur Berufsunfähigkeitsversicherung: Versicherungsbedarf ermitteln, Gesundheitsfragen vorbereiten und Tarife hinsichtlich Leistung und Preis vergleichen." },
  { slug: "betreuungsverfuegung", title: "Betreuungsverfügung", filename: "Checkliste_Betreuungsverfügung.pdf", desc: "Checkliste zur Betreuungsverfügung: Vertrauensperson benennen, Wünsche zur Betreuung festlegen und die Verfügung rechtswirksam beim Betreuungsgericht hinterlegen." },
  { slug: "betriebliche-altersversorgung", title: "Betriebliche Altersversorgung", filename: "Checkliste_Betriebliche_Altersversorgung.pdf", desc: "Checkliste zur betrieblichen Altersversorgung: Durchführungswege vergleichen, Arbeitgeberzuschuss prüfen und die bAV als Baustein der Altersvorsorge nutzen." },
  { slug: "betriebliche-krankenversicherung", title: "Betriebliche Krankenversicherung", filename: "Checkliste_Betriebliche_Krankenversicherung.pdf", desc: "Checkliste zur betrieblichen Krankenversicherung: Leistungsbausteine verstehen, steuerliche Behandlung klären und den Zusatzschutz als Arbeitnehmer optimal nutzen." },
  { slug: "betriebshaftpflichtversicherung", title: "Betriebshaftpflichtversicherung", filename: "Checkliste_Betriebshaftpflichtversicherung.pdf", desc: "Checkliste zur Betriebshaftpflichtversicherung: Unternehmensrisiken analysieren, Deckungsumfang festlegen und den passenden Versicherungsschutz für Ihren Betrieb wählen." },
  { slug: "bussgeldkatalog", title: "Bußgeldkatalog", filename: "Checkliste_Bußgeldkatalog.pdf", desc: "Checkliste zum Bußgeldkatalog: Aktuelle Bußgelder kennen, Punkte in Flensburg verstehen und Ihre Rechte bei Verkehrsverstößen richtig wahrnehmen." },
  { slug: "buergergeld", title: "Bürgergeld", filename: "Checkliste_Bürgergeld.pdf", desc: "Checkliste zum Bürgergeld: Anspruchsvoraussetzungen prüfen, erforderliche Unterlagen vorbereiten und den Antrag beim Jobcenter korrekt einreichen." },
  { slug: "buergerversicherung", title: "Bürgerversicherung", filename: "Checkliste_Bürgerversicherung.pdf", desc: "Checkliste zur Bürgerversicherung: Konzept und Unterschiede zum bestehenden System verstehen, Auswirkungen auf Ihre Versicherungssituation einschätzen." },
  { slug: "cyberversicherung", title: "Cyberversicherung", filename: "Checkliste_Cyberversicherung.pdf", desc: "Checkliste zur Cyberversicherung: Digitale Risiken bewerten, Deckungsumfang prüfen und den passenden Schutz gegen Cyberangriffe und Datenverlust wählen." },
  { slug: "dienstreisen", title: "Dienstreisen", filename: "Checkliste_Dienstreisen.pdf", desc: "Checkliste für Dienstreisen: Reisekosten korrekt abrechnen, Verpflegungsmehraufwand geltend machen und Übernachtungskosten steuerlich optimal absetzen." },
  { slug: "dienstwagen", title: "Dienstwagen", filename: "Checkliste_Dienstwagen.pdf", desc: "Checkliste zum Dienstwagen: Ein-Prozent-Regel oder Fahrtenbuch wählen, geldwerten Vorteil berechnen und die steuerlich günstigste Variante ermitteln." },
  { slug: "dienstwohnung", title: "Dienstwohnung", filename: "Checkliste_Dienstwohnung.pdf", desc: "Checkliste zur Dienstwohnung: Geldwerten Vorteil berechnen, Sachbezugswerte prüfen und die steuerliche Behandlung der Mitarbeiterwohnung richtig abwickeln." },
  { slug: "direktbank-vs-filialbank", title: "Direktbank vs. Filialbank", filename: "Checkliste_Direktbank_vs__Filialbank.pdf", desc: "Checkliste Direktbank vs. Filialbank: Konditionen vergleichen, Service-Leistungen abwägen und die passende Bankverbindung für Ihre Bedürfnisse finden." },
  { slug: "direktversicherung", title: "Direktversicherung", filename: "Checkliste_Direktversicherung.pdf", desc: "Checkliste zur Direktversicherung: Steuervorteile der Entgeltumwandlung nutzen, Arbeitgeberzuschuss sichern und die Direktversicherung als Altersvorsorge prüfen." },
  { slug: "doppelte-haushaltsfuehrung", title: "Doppelte Haushaltsführung", filename: "Checkliste_Doppelte_Haushaltsführung.pdf", desc: "Checkliste zur doppelten Haushaltsführung: Voraussetzungen prüfen, absetzbare Kosten erfassen und die Zweitwohnung steuerlich korrekt geltend machen." },
  { slug: "drohnenhaftpflichtversicherung", title: "Drohnenhaftpflichtversicherung", filename: "Checkliste_Drohnenhaftpflichtversicherung.pdf", desc: "Checkliste zur Drohnenhaftpflichtversicherung: Gesetzliche Pflicht kennen, Deckungssummen vergleichen und den Versicherungsschutz für Ihre Drohne sicherstellen." },
  { slug: "duesseldorfer-tabelle", title: "Düsseldorfer Tabelle", filename: "Checkliste_Düsseldorfer_Tabelle.pdf", desc: "Checkliste zur Düsseldorfer Tabelle: Aktuelle Unterhaltssätze kennen, Einkommensgruppe bestimmen und den Kindesunterhalt korrekt berechnen." },
  { slug: "etc-exchange-traded-commodities", title: "ETC – Exchange Traded Commodities", filename: "Checkliste_ETC___Exchange_Traded_Commodities.pdf", desc: "Checkliste zu ETCs: Funktionsweise von Rohstoff-Wertpapieren verstehen, Kosten vergleichen und ETCs als Beimischung für Ihr Portfolio bewerten." },
  { slug: "etf-exchange-traded-funds", title: "ETF – Exchange Traded Funds", filename: "Checkliste_ETF___Exchange_Traded_Funds.pdf", desc: "Checkliste zu ETFs: Indexfonds verstehen, Kosten und Tracking-Differenz vergleichen und die passende ETF-Strategie für Ihren Vermögensaufbau wählen." },
  { slug: "e-bike-versicherung", title: "E-Bike Versicherung", filename: "Checkliste_E_Bike_Versicherung.pdf", desc: "Checkliste zur E-Bike-Versicherung: Diebstahl- und Unfallrisiken absichern, Leistungsumfang vergleichen und den passenden Versicherungsschutz für Ihr E-Bike wählen." },
  { slug: "e-scooter-versicherung", title: "E-Scooter Versicherung", filename: "Checkliste_E_Scooter_Versicherung.pdf", desc: "Checkliste zur E-Scooter-Versicherung: Gesetzliche Haftpflichtpflicht kennen, Versicherungsplakette beantragen und zusätzlichen Kaskoschutz prüfen." },
  { slug: "ehegattensplitting", title: "Ehegattensplitting", filename: "Checkliste_Ehegattensplitting.pdf", desc: "Checkliste zum Ehegattensplitting: Steuervorteil berechnen, Zusammenveranlagung prüfen und die optimale Steuerklassenkombination für Ehepaare wählen." },
  { slug: "ehegattenunterhalt", title: "Ehegattenunterhalt", filename: "Checkliste_Ehegattenunterhalt.pdf", desc: "Checkliste zum Ehegattenunterhalt: Anspruchsvoraussetzungen prüfen, Unterhaltshöhe berechnen und die steuerliche Absetzbarkeit des Unterhalts nutzen." },
  { slug: "einkommensteuer", title: "Einkommensteuer", filename: "Checkliste_Einkommensteuer.pdf", desc: "Checkliste zur Einkommensteuer: Steuerpflicht verstehen, Freibeträge nutzen und die Einkommensteuererklärung vollständig und fristgerecht abgeben." },
  { slug: "einlagensicherung", title: "Einlagensicherung", filename: "Checkliste_Einlagensicherung.pdf", desc: "Checkliste zur Einlagensicherung: Schutzumfang kennen, Sicherungssysteme verstehen und Ihre Einlagen bei deutschen und europäischen Banken richtig absichern." },
  { slug: "elster", title: "ELSTER", filename: "Checkliste_Elster.pdf", desc: "Checkliste zu ELSTER: Registrierung durchführen, Steuererklärung elektronisch einreichen und die wichtigsten Funktionen der ELSTER-Plattform nutzen." },
  { slug: "elterngeld", title: "Elterngeld", filename: "Checkliste_Elterngeld.pdf", desc: "Checkliste zum Elterngeld: Anspruchsvoraussetzungen prüfen, Elterngeld und ElterngeldPlus vergleichen und den Antrag fristgerecht bei der Elterngeldstelle einreichen." },
  { slug: "elternunterhalt", title: "Elternunterhalt", filename: "Checkliste_Elternunterhalt.pdf", desc: "Checkliste zum Elternunterhalt: Unterhaltspflicht prüfen, Einkommensgrenzen kennen und die finanzielle Belastung durch Elternunterhalt korrekt berechnen." },
  { slug: "elternzeit", title: "Elternzeit", filename: "Checkliste_Elternzeit.pdf", desc: "Checkliste zur Elternzeit: Fristen einhalten, Aufteilung zwischen Eltern planen und den Antrag rechtzeitig beim Arbeitgeber einreichen." },
  { slug: "entlastungsbetrag-alleinerziehende", title: "Entlastungsbetrag Alleinerziehende", filename: "Checkliste_Entlastungsbetrag_Alleinerziehende.pdf", desc: "Checkliste zum Entlastungsbetrag für Alleinerziehende: Anspruchsvoraussetzungen prüfen, Steuerklasse II beantragen und den Freibetrag korrekt geltend machen." },
  { slug: "erbrecht", title: "Erbrecht", filename: "Checkliste_Erbrecht.pdf", desc: "Checkliste zum Erbrecht: Gesetzliche Erbfolge verstehen, Pflichtteilsansprüche kennen und die Nachlassplanung rechtzeitig und rechtssicher gestalten." },
  { slug: "erbschaftsteuer", title: "Erbschaftsteuer", filename: "Checkliste_Erbschaftsteuer.pdf", desc: "Checkliste zur Erbschaftsteuer: Freibeträge kennen, Steuerklassen verstehen und den Nachlass steuerlich optimal planen." },
  { slug: "erwerbsminderungsrente", title: "Erwerbsminderungsrente", filename: "Checkliste_Erwerbsminderungsrente.pdf", desc: "Checkliste zur Erwerbsminderungsrente: Anspruchsvoraussetzungen prüfen, Antrag korrekt stellen und die Rentenhöhe bei voller oder teilweiser Erwerbsminderung ermitteln." },
  { slug: "fahrgemeinschaft", title: "Fahrgemeinschaft", filename: "Checkliste_Fahrgemeinschaft.pdf", desc: "Checkliste zur Fahrgemeinschaft: Steuerliche Absetzbarkeit klären, Kostenteilung vereinbaren und die Pendlerpauschale trotz Mitfahrgelegenheit nutzen." },
  { slug: "fahrradversicherung", title: "Fahrradversicherung", filename: "Checkliste_Fahrradversicherung.pdf", desc: "Checkliste zur Fahrradversicherung: Diebstahl- und Vandalismusschutz vergleichen, Selbstbeteiligung prüfen und den passenden Tarif für Ihr Fahrrad wählen." },
  { slug: "familienversicherung", title: "Familienversicherung", filename: "Checkliste_Familienversicherung.pdf", desc: "Checkliste zur Familienversicherung: Beitragsfreie Mitversicherung prüfen, Einkommensgrenzen beachten und die kostenlose Absicherung in der GKV nutzen." },
  { slug: "ferienwohnung", title: "Ferienwohnung", filename: "Checkliste_Ferienwohnung.pdf", desc: "Checkliste zur Ferienwohnung: Mieteinnahmen versteuern, Werbungskosten absetzen und die steuerlichen Besonderheiten der Ferienvermietung beachten." },
  { slug: "fondsgebundene-lebensversicherung", title: "Fondsgebundene Lebensversicherung", filename: "Checkliste_Fondsgebundene_Lebensversicherung.pdf", desc: "Checkliste zur fondsgebundenen Lebensversicherung: Anlageoptionen vergleichen, Kosten prüfen und die Kombination aus Versicherung und Kapitalanlage bewerten." },
  { slug: "freiwillige-gesetzliche-krankenversicherung", title: "Freiwillige gesetzliche Krankenversicherung", filename: "Checkliste_Freiwillige_gesetzliche_Krankenversicher.pdf", desc: "Checkliste zur freiwilligen GKV: Beitragsbemessung verstehen, Zusatzbeiträge vergleichen und die freiwillige Versicherung als Alternative zur PKV prüfen." },
  { slug: "freiwillige-gesetzliche-rentenversicherung", title: "Freiwillige gesetzliche Rentenversicherung", filename: "Checkliste_Freiwillige_gesetzliche_Rentenversicheru.pdf", desc: "Checkliste zur freiwilligen Rentenversicherung: Beitragshöhe festlegen, Rentenpunkte aufbauen und freiwillige Beiträge zur Verbesserung Ihrer Rentenansprüche nutzen." },
  { slug: "gaspreise-vergleichen", title: "Gaspreise vergleichen", filename: "Checkliste_Gaspreise_vergleichen.pdf", desc: "Checkliste zum Gaspreisvergleich: Aktuellen Verbrauch ermitteln, Tarife vergleichen und durch einen Anbieterwechsel Ihre Energiekosten senken." },
  { slug: "gehaltsumwandlung", title: "Gehaltsumwandlung", filename: "Checkliste_Gehaltsumwandlung.pdf", desc: "Checkliste zur Gehaltsumwandlung: Steuer- und Sozialversicherungsvorteile berechnen, Durchführungsweg wählen und die Entgeltumwandlung beim Arbeitgeber beantragen." },
  { slug: "geringfuegige-beschaeftigung", title: "Geringfügige Beschäftigung", filename: "Checkliste_Geringfügige_Beschäftigung.pdf", desc: "Checkliste zur geringfügigen Beschäftigung: Verdienstgrenze beachten, Sozialversicherungspflicht prüfen und die steuerlichen Regelungen für Minijobs kennen." },
  { slug: "gesetzliche-krankenversicherung", title: "Gesetzliche Krankenversicherung", filename: "Checkliste_Gesetzliche_Krankenversicherung.pdf", desc: "Checkliste zur gesetzlichen Krankenversicherung: Beitragssätze vergleichen, Zusatzleistungen prüfen und die passende Krankenkasse für Ihre Bedürfnisse wählen." },
  { slug: "gesetzliche-rentenversicherung", title: "Gesetzliche Rentenversicherung", filename: "Checkliste_Gesetzliche_Rentenversicherung.pdf", desc: "Checkliste zur gesetzlichen Rentenversicherung: Rentenansprüche prüfen, Versicherungsverlauf klären und Ihre voraussichtliche Rente berechnen." },
  { slug: "gesetzliche-unfallversicherung", title: "Gesetzliche Unfallversicherung", filename: "Checkliste_Gesetzliche_Unfallversicherung.pdf", desc: "Checkliste zur gesetzlichen Unfallversicherung: Versicherungsschutz am Arbeitsplatz verstehen, Leistungen kennen und Arbeitsunfälle korrekt melden." },
  { slug: "gewerbesteuer", title: "Gewerbesteuer", filename: "Checkliste_Gewerbesteuer.pdf", desc: "Checkliste zur Gewerbesteuer: Freibetrag nutzen, Hebesatz Ihrer Gemeinde kennen und die Gewerbesteuererklärung korrekt erstellen." },
  { slug: "girokonto", title: "Girokonto", filename: "Checkliste_Girokonto.pdf", desc: "Checkliste zum Girokonto: Kontogebühren vergleichen, Zusatzleistungen prüfen und das passende Girokonto für Ihren Zahlungsverkehr finden." },
  { slug: "grunderwerbsteuer", title: "Grunderwerbsteuer", filename: "Checkliste_Grunderwerbsteuer.pdf", desc: "Checkliste zur Grunderwerbsteuer: Steuersatz Ihres Bundeslandes kennen, Berechnungsgrundlage verstehen und mögliche Befreiungen beim Immobilienkauf prüfen." },
  { slug: "grundschuld", title: "Grundschuld", filename: "Checkliste_Grundschuld.pdf", desc: "Checkliste zur Grundschuld: Eintragung im Grundbuch verstehen, Unterschied zur Hypothek kennen und die Löschung nach Kredittilgung veranlassen." },
  { slug: "grundsicherung", title: "Grundsicherung", filename: "Checkliste_Grundsicherung.pdf", desc: "Checkliste zur Grundsicherung im Alter: Anspruchsvoraussetzungen prüfen, Einkommens- und Vermögensgrenzen kennen und den Antrag beim Sozialamt stellen." },
  { slug: "grundsteuer", title: "Grundsteuer", filename: "Checkliste_Grundsteuer.pdf", desc: "Checkliste zur Grundsteuer: Grundsteuerwert ermitteln, Messbetrag und Hebesatz verstehen und die Grundsteuererklärung fristgerecht abgeben." },
  { slug: "hausbesitzerhaftpflicht-und-grundbesitzerhaftpflicht", title: "Hausbesitzerhaftpflicht und Grundbesitzerhaftpflicht", filename: "Checkliste_Hausbesitzerhaftpflicht_und_Grundbesitze.pdf", desc: "Checkliste zur Haus- und Grundbesitzerhaftpflicht: Haftungsrisiken als Eigentümer absichern, Deckungssummen prüfen und den Versicherungsschutz für Ihr Grundstück wählen." },
  { slug: "haushaltsnahe-dienstleistungen", title: "Haushaltsnahe Dienstleistungen", filename: "Checkliste_Haushaltsnahe_Dienstleistungen.pdf", desc: "Checkliste für haushaltsnahe Dienstleistungen: Absetzbare Tätigkeiten kennen, Höchstbeträge beachten und die Steuerermäßigung korrekt in der Steuererklärung nutzen." },
  { slug: "hausratversicherung", title: "Hausratversicherung", filename: "Checkliste_Hausratversicherung.pdf", desc: "Checkliste zur Hausratversicherung: Versicherungssumme ermitteln, Leistungsumfang vergleichen und den passenden Schutz für Ihren Hausrat wählen." },
  { slug: "hinzuverdienst-in-der-rente", title: "Hinzuverdienst in der Rente", filename: "Checkliste_Hinzuverdienst_in_der_Rente.pdf", desc: "Checkliste zum Hinzuverdienst in der Rente: Verdienstgrenzen kennen, Auswirkungen auf die Rente berechnen und den Hinzuverdienst steuerlich optimal gestalten." },
  { slug: "hunde-op-versicherung", title: "Hunde-OP-Versicherung", filename: "Checkliste_Hunde_OP_Versicherung.pdf", desc: "Checkliste zur Hunde-OP-Versicherung: Leistungsumfang vergleichen, Wartezeiten beachten und den passenden OP-Schutz für Ihren Hund wählen." },
  { slug: "hundehaftpflichtversicherung", title: "Hundehaftpflichtversicherung", filename: "Checkliste_Hundehaftpflichtversicherung.pdf", desc: "Checkliste zur Hundehaftpflichtversicherung: Gesetzliche Pflicht prüfen, Deckungssummen vergleichen und den passenden Haftpflichtschutz für Ihren Hund wählen." },
  { slug: "hundeversicherungen", title: "Hundeversicherungen", filename: "Checkliste_Hundeversicherungen.pdf", desc: "Checkliste zu Hundeversicherungen: Haftpflicht, OP- und Krankenversicherung vergleichen und den optimalen Versicherungsschutz für Ihren Hund zusammenstellen." },
  { slug: "inflation", title: "Inflation", filename: "Checkliste_Inflation.pdf", desc: "Checkliste zur Inflation: Kaufkraftverlust verstehen, Anlagestrategien gegen Inflation prüfen und Ihr Vermögen vor Wertverlust schützen." },
  { slug: "investition-in-gold", title: "Investition in Gold", filename: "Checkliste_Investition_in_Gold.pdf", desc: "Checkliste zur Goldanlage: Anlageformen vergleichen, steuerliche Behandlung kennen und Gold als Beimischung für Ihr Portfolio bewerten." },
  { slug: "investition-in-sachwerte", title: "Investition in Sachwerte", filename: "Checkliste_Investition_in_Sachwerte.pdf", desc: "Checkliste zur Sachwertanlage: Immobilien, Rohstoffe und Sammlerwerte vergleichen, Risiken einschätzen und Sachwerte als Inflationsschutz nutzen." },
  { slug: "jahressteuerbescheinigung", title: "Jahressteuerbescheinigung", filename: "Checkliste_Jahressteuerbescheinigung.pdf", desc: "Checkliste zur Jahressteuerbescheinigung: Dokument von der Bank anfordern, Angaben prüfen und die Bescheinigung korrekt in der Steuererklärung verwenden." },
  { slug: "kfw-foerderung", title: "KfW-Förderung", filename: "Checkliste_KfW_Förderung.pdf", desc: "Checkliste zur KfW-Förderung: Förderprogramme kennen, Antragsvoraussetzungen prüfen und die zinsgünstigen Darlehen für Bau oder Sanierung nutzen." },
  { slug: "kfw-studienkredit", title: "KfW-Studienkredit", filename: "Checkliste_KfW_Studienkredit.pdf", desc: "Checkliste zum KfW-Studienkredit: Fördervoraussetzungen prüfen, Konditionen verstehen und die Studienfinanzierung über den KfW-Kredit beantragen." },
  { slug: "kfz-versicherung", title: "Kfz-Versicherung", filename: "Checkliste_Kfz_Versicherung.pdf", desc: "Checkliste zur Kfz-Versicherung: Haftpflicht, Teil- und Vollkasko vergleichen, Schadenfreiheitsklasse prüfen und den günstigsten Tarif für Ihr Fahrzeug finden." },
  { slug: "kinderbetreuungskosten", title: "Kinderbetreuungskosten", filename: "Checkliste_Kinderbetreuungskosten.pdf", desc: "Checkliste zu Kinderbetreuungskosten: Absetzbare Betreuungsformen kennen, Höchstbeträge beachten und die Kosten als Sonderausgaben steuerlich geltend machen." },
  { slug: "kindergeld", title: "Kindergeld", filename: "Checkliste_Kindergeld.pdf", desc: "Checkliste zum Kindergeld: Anspruchsvoraussetzungen prüfen, Antrag bei der Familienkasse stellen und die Günstigerprüfung mit dem Kinderfreibetrag beachten." },
  { slug: "kinderkrankengeld", title: "Kinderkrankengeld", filename: "Checkliste_Kinderkrankengeld.pdf", desc: "Checkliste zum Kinderkrankengeld: Anspruchstage kennen, ärztliche Bescheinigung vorlegen und den Antrag bei der Krankenkasse fristgerecht einreichen." },
  { slug: "kinderzuschlag", title: "Kinderzuschlag", filename: "Checkliste_Kinderzuschlag.pdf", desc: "Checkliste zum Kinderzuschlag: Einkommensgrenzen prüfen, Antrag bei der Familienkasse stellen und die zusätzliche Familienleistung für Geringverdiener nutzen." },
  { slug: "kindesunterhalt", title: "Kindesunterhalt", filename: "Checkliste_Kindesunterhalt.pdf", desc: "Checkliste zum Kindesunterhalt: Unterhaltshöhe nach Düsseldorfer Tabelle berechnen, Zahlungspflichten kennen und den Unterhalt rechtssicher vereinbaren." },
  { slug: "kirchensteuer", title: "Kirchensteuer", filename: "Checkliste_Kirchensteuer.pdf", desc: "Checkliste zur Kirchensteuer: Steuersatz kennen, Sonderausgabenabzug nutzen und die Auswirkungen eines Kirchenaustritts auf Ihre Steuerlast verstehen." },
  { slug: "koerperschaftsteuer", title: "Körperschaftsteuer", filename: "Checkliste_Körperschaftsteuer.pdf", desc: "Checkliste zur Körperschaftsteuer: Steuerpflicht für Kapitalgesellschaften verstehen, Steuersatz kennen und die Körperschaftsteuererklärung korrekt erstellen." },
  { slug: "krankengeld", title: "Krankengeld", filename: "Checkliste_Krankengeld.pdf", desc: "Checkliste zum Krankengeld: Anspruchsvoraussetzungen prüfen, Höhe des Krankengeldes berechnen und den Übergang von Lohnfortzahlung zu Krankengeld verstehen." },
  { slug: "krankentagegeldversicherung", title: "Krankentagegeldversicherung", filename: "Checkliste_Krankentagegeldversicherung.pdf", desc: "Checkliste zur Krankentagegeldversicherung: Einkommensabsicherung bei Krankheit planen, Karenzzeiten prüfen und den passenden Tagessatz festlegen." },
  { slug: "krankenversicherung-leistungen", title: "Krankenversicherung Leistungen", filename: "Checkliste_Krankenversicherung_Leistungen.pdf", desc: "Checkliste zu Krankenversicherungsleistungen: Kassenleistungen kennen, Zusatzleistungen vergleichen und Ihren Versicherungsschutz optimal ausschöpfen." },
  { slug: "krankenversicherung-rentner", title: "Krankenversicherung Rentner", filename: "Checkliste_Krankenversicherung_Rentner.pdf", desc: "Checkliste zur Krankenversicherung für Rentner: KVdR-Zugang prüfen, Beitragspflicht verstehen und die günstigste Versicherungsoption im Ruhestand wählen." },
  { slug: "krankenversicherung-studenten", title: "Krankenversicherung Studenten", filename: "Checkliste_Krankenversicherung_Studenten.pdf", desc: "Checkliste zur Krankenversicherung für Studenten: Familienversicherung prüfen, studentische Tarife vergleichen und die Versicherungspflicht im Studium kennen." },
  { slug: "krankenversicherungsbeitraege", title: "Krankenversicherungsbeiträge", filename: "Checkliste_Krankenversicherungsbeiträge.pdf", desc: "Checkliste zu Krankenversicherungsbeiträgen: Beitragssätze verstehen, Arbeitgeber- und Arbeitnehmeranteil kennen und Sparmöglichkeiten bei der Krankenkasse nutzen." },
  { slug: "krankenversicherungspflicht", title: "Krankenversicherungspflicht", filename: "Checkliste_Krankenversicherungspflicht.pdf", desc: "Checkliste zur Krankenversicherungspflicht: Versicherungspflicht prüfen, Befreiungsmöglichkeiten kennen und die passende Versicherungsform wählen." },
  { slug: "kreditkarte", title: "Kreditkarte", filename: "Checkliste_Kreditkarte.pdf", desc: "Checkliste zur Kreditkarte: Jahresgebühren vergleichen, Zusatzleistungen prüfen und die passende Kreditkarte für Ihre Zahlungsgewohnheiten finden." },
  { slug: "kryptowaehrung", title: "Kryptowährung", filename: "Checkliste_Kryptowährung.pdf", desc: "Checkliste zu Kryptowährungen: Funktionsweise verstehen, steuerliche Behandlung kennen und Risiken bei der Investition in digitale Währungen einschätzen." },
  { slug: "kurzarbeitergeld", title: "Kurzarbeitergeld", filename: "Checkliste_Kurzarbeitergeld.pdf", desc: "Checkliste zum Kurzarbeitergeld: Anspruchsvoraussetzungen prüfen, Leistungshöhe berechnen und die steuerlichen Auswirkungen des Kurzarbeitergeldes verstehen." },
  { slug: "kurzzeitpflege", title: "Kurzzeitpflege", filename: "Checkliste_Kurzzeitpflege.pdf", desc: "Checkliste zur Kurzzeitpflege: Anspruch auf Leistungen prüfen, Pflegeeinrichtung finden und die Kostenübernahme durch die Pflegekasse beantragen." },
  { slug: "kuendigung", title: "Kündigung", filename: "Checkliste_Kündigung.pdf", desc: "Checkliste zur Kündigung: Kündigungsfristen einhalten, Abfindungsanspruch prüfen und die wichtigsten Schritte nach Erhalt einer Kündigung kennen." },
  { slug: "kuendigung-krankenversicherung", title: "Kündigung Krankenversicherung", filename: "Checkliste_Kündigung_Krankenversicherung.pdf", desc: "Checkliste zur Kündigung der Krankenversicherung: Kündigungsfristen beachten, Sonderkündigungsrecht prüfen und den Wechsel der Krankenkasse vorbereiten." },
  { slug: "kuenstlersozialkasse", title: "Künstlersozialkasse", filename: "Checkliste_Künstlersozialkasse.pdf", desc: "Checkliste zur Künstlersozialkasse: Aufnahmevoraussetzungen prüfen, Beitragspflicht verstehen und die Sozialversicherung für Künstler und Publizisten nutzen." },
  { slug: "lebensversicherung", title: "Lebensversicherung", filename: "Checkliste_Lebensversicherung.pdf", desc: "Checkliste zur Lebensversicherung: Kapital- und Risikolebensversicherung vergleichen, Kosten prüfen und den passenden Todesfallschutz für Ihre Familie wählen." },
  { slug: "lohnsteuer", title: "Lohnsteuer", filename: "Checkliste_Lohnsteuer.pdf", desc: "Checkliste zur Lohnsteuer: Steuerklasse verstehen, Freibeträge eintragen lassen und die monatliche Lohnsteuerbelastung korrekt nachvollziehen." },
  { slug: "lohnsteuerermäßigung", title: "Lohnsteuerermäßigung", filename: "Checkliste_Lohnsteuerermäßigung.pdf", desc: "Checkliste zur Lohnsteuerermäßigung: Freibeträge beantragen, Werbungskosten vorab geltend machen und so die monatliche Steuerlast bereits während des Jahres senken." },
  { slug: "lohnsteuertabelle", title: "Lohnsteuertabelle", filename: "Checkliste_Lohnsteuertabelle.pdf", desc: "Checkliste zur Lohnsteuertabelle: Steuerklassen verstehen, monatliche Abzüge nachvollziehen und die Lohnsteuertabelle für Ihre Gehaltsplanung nutzen." },
  { slug: "minijob", title: "Minijob", filename: "Checkliste_Minijob.pdf", desc: "Checkliste zum Minijob: Verdienstgrenze beachten, Sozialversicherungsbeiträge kennen und die steuerlichen Regelungen für geringfügige Beschäftigung verstehen." },
  { slug: "mutterschaftsgeld", title: "Mutterschaftsgeld", filename: "Checkliste_Mutterschaftsgeld.pdf", desc: "Checkliste zum Mutterschaftsgeld: Anspruchsvoraussetzungen prüfen, Leistungshöhe berechnen und den Antrag bei Krankenkasse und Arbeitgeber stellen." },
  { slug: "nachhaltige-geldanlagen", title: "Nachhaltige Geldanlagen", filename: "Checkliste_Nachhaltige_Geldanlagen.pdf", desc: "Checkliste zu nachhaltigen Geldanlagen: ESG-Kriterien verstehen, nachhaltige Fonds und ETFs vergleichen und verantwortungsvoll investieren." },
  { slug: "pkv-beitrag", title: "PKV-Beitrag", filename: "Checkliste_PKV_Beitrag.pdf", desc: "Checkliste zum PKV-Beitrag: Beitragszusammensetzung verstehen, Altersrückstellungen kennen und Möglichkeiten zur Beitragssenkung in der privaten Krankenversicherung nutzen." },
  { slug: "patientenverfuegung", title: "Patientenverfügung", filename: "Checkliste_Patientenverfügung.pdf", desc: "Checkliste zur Patientenverfügung: Behandlungswünsche festlegen, rechtliche Anforderungen beachten und die Verfügung für den Ernstfall sicher hinterlegen." },
  { slug: "pendlerpauschale", title: "Pendlerpauschale", filename: "Checkliste_Pendlerpauschale.pdf", desc: "Checkliste zur Pendlerpauschale: Entfernungskilometer berechnen, Arbeitstage dokumentieren und die Fahrtkosten korrekt in der Steuererklärung absetzen." },
  { slug: "pfaendung", title: "Pfändung", filename: "Checkliste_Pfändung.pdf", desc: "Checkliste zur Pfändung: Pfändungsfreigrenzen kennen, Pfändungsschutzkonto einrichten und Ihre Rechte bei Lohn- und Kontopfändung wahrnehmen." },
  { slug: "pferdeversicherungen", title: "Pferdeversicherungen", filename: "Checkliste_Pferdeversicherungen.pdf", desc: "Checkliste zu Pferdeversicherungen: Haftpflicht, OP- und Krankenversicherung für Pferde vergleichen und den optimalen Versicherungsschutz zusammenstellen." },
  { slug: "pflegebeduerftigkeit", title: "Pflegebedürftigkeit", filename: "Checkliste_Pflegebedürftigkeit.pdf", desc: "Checkliste zur Pflegebedürftigkeit: Anzeichen erkennen, Pflegegrad beantragen und die Leistungen der Pflegeversicherung für Ihre Situation ermitteln." },
  { slug: "pflegedienste", title: "Pflegedienste", filename: "Checkliste_Pflegedienste.pdf", desc: "Checkliste zu Pflegediensten: Ambulante Pflegeleistungen vergleichen, Qualitätskriterien prüfen und den passenden Pflegedienst für Ihre Angehörigen finden." },
  { slug: "pflegegrad-beantragen", title: "Pflegegrad beantragen", filename: "Checkliste_Pflegegrad_beantragen.pdf", desc: "Checkliste zum Pflegegrad-Antrag: Unterlagen vorbereiten, MDK-Begutachtung kennen und den Antrag bei der Pflegekasse korrekt stellen." },
  { slug: "pflegegrade", title: "Pflegegrade", filename: "Checkliste_Pflegegrade.pdf", desc: "Checkliste zu Pflegegraden: Die fünf Pflegegrade verstehen, Leistungsansprüche kennen und den passenden Pflegegrad für Ihre Pflegesituation ermitteln." },
  { slug: "pflegeversicherung", title: "Pflegeversicherung", filename: "Checkliste_Pflegeversicherung.pdf", desc: "Checkliste zur Pflegeversicherung: Beitragspflicht verstehen, Leistungen kennen und die gesetzliche Pflegeversicherung für den Pflegefall richtig nutzen." },
  { slug: "pflegezusatzversicherung", title: "Pflegezusatzversicherung", filename: "Checkliste_Pflegezusatzversicherung.pdf", desc: "Checkliste zur Pflegezusatzversicherung: Versorgungslücke berechnen, Pflegetagegeld und Pflegekostenversicherung vergleichen und frühzeitig vorsorgen." },
  { slug: "pflichtversicherung-rente", title: "Pflichtversicherung Rente", filename: "Checkliste_Pflichtversicherung_Rente.pdf", desc: "Checkliste zur Rentenversicherungspflicht: Pflichtversicherte Personengruppen kennen, Beitragshöhe verstehen und Ihre Pflichtbeiträge zur Rentenversicherung prüfen." },
  { slug: "photovoltaik-foerderung", title: "Photovoltaik-Förderung", filename: "Checkliste_Photovoltaik_Förderung.pdf", desc: "Checkliste zur Photovoltaik-Förderung: Förderprogramme kennen, steuerliche Vorteile nutzen und die Finanzierung Ihrer Solaranlage optimal planen." },
  { slug: "private-haftpflichtversicherung", title: "Private Haftpflichtversicherung", filename: "Checkliste_Private_Haftpflichtversicherung.pdf", desc: "Checkliste zur privaten Haftpflichtversicherung: Deckungssumme festlegen, Leistungsumfang vergleichen und den wichtigsten Versicherungsschutz für den Alltag sichern." },
  { slug: "private-krankenversicherung", title: "Private Krankenversicherung", filename: "Checkliste_Private_Krankenversicherung.pdf", desc: "Checkliste zur privaten Krankenversicherung: Zugangsvoraussetzungen prüfen, Tarife vergleichen und die Vor- und Nachteile gegenüber der GKV abwägen." },
  { slug: "private-pflege-pflichtversicherung", title: "Private Pflege-Pflichtversicherung", filename: "Checkliste_Private_Pflege_Pflichtversicherung.pdf", desc: "Checkliste zur privaten Pflege-Pflichtversicherung: Leistungsumfang verstehen, Beiträge kennen und den Pflegeschutz in der PKV richtig einordnen." },
  { slug: "rechtsschutzversicherung", title: "Rechtsschutzversicherung", filename: "Checkliste_Rechtsschutzversicherung.pdf", desc: "Checkliste zur Rechtsschutzversicherung: Leistungsbausteine wählen, Wartezeiten beachten und den passenden Rechtsschutz für Beruf, Verkehr und Privatleben finden." },
  { slug: "reisekosten", title: "Reisekosten", filename: "Checkliste_Reisekosten.pdf", desc: "Checkliste zu Reisekosten: Fahrt-, Übernachtungs- und Verpflegungskosten dokumentieren und die steuerliche Erstattung korrekt abrechnen." },
  { slug: "reiseversicherungen", title: "Reiseversicherungen", filename: "Checkliste_Reiseversicherungen.pdf", desc: "Checkliste zu Reiseversicherungen: Auslandskranken-, Reiserücktritts- und Gepäckversicherung vergleichen und den passenden Schutz für Ihre Reise wählen." },
  { slug: "rentenarten", title: "Rentenarten", filename: "Checkliste_Rentenarten.pdf", desc: "Checkliste zu Rentenarten: Alters-, Erwerbsminderungs- und Hinterbliebenenrente verstehen und Ihre individuellen Rentenansprüche kennen." },
  { slug: "rentenbeitrag", title: "Rentenbeitrag", filename: "Checkliste_Rentenbeitrag.pdf", desc: "Checkliste zum Rentenbeitrag: Beitragssatz und Beitragsbemessungsgrenze kennen, Arbeitgeber- und Arbeitnehmeranteil verstehen und Ihre Beitragslast berechnen." },
  { slug: "rentenbesteuerung", title: "Rentenbesteuerung", filename: "Checkliste_Rentenbesteuerung.pdf", desc: "Checkliste zur Rentenbesteuerung: Besteuerungsanteil ermitteln, Rentenfreibetrag kennen und die Steuererklärung als Rentner korrekt ausfüllen." },
  { slug: "rentenerhoehung", title: "Rentenerhöhung", filename: "Checkliste_Rentenerhöhung.pdf", desc: "Checkliste zur Rentenerhöhung: Anpassungsmechanismus verstehen, Auswirkungen auf Steuern und Sozialabgaben prüfen und die jährliche Rentenanpassung nachvollziehen." },
  { slug: "renteninformation", title: "Renteninformation", filename: "Checkliste_Renteninformation.pdf", desc: "Checkliste zur Renteninformation: Jährliche Mitteilung richtig lesen, Rentenansprüche verstehen und mögliche Versorgungslücken frühzeitig erkennen." },
  { slug: "rentenversicherung", title: "Rentenversicherung", filename: "Checkliste_Rentenversicherung.pdf", desc: "Checkliste zur Rentenversicherung: Pflicht- und freiwillige Beiträge verstehen, Rentenansprüche aufbauen und die Rentenversicherung als Säule Ihrer Altersvorsorge nutzen." },
  { slug: "rentenversicherungsbeitrag", title: "Rentenversicherungsbeitrag", filename: "Checkliste_Rentenversicherungsbeitrag.pdf", desc: "Checkliste zum Rentenversicherungsbeitrag: Aktuellen Beitragssatz kennen, Beitragsbemessungsgrenze verstehen und die Auswirkungen auf Ihr Nettogehalt berechnen." },
  { slug: "riester-rente", title: "Riester-Rente", filename: "Checkliste_Riester_Rente.pdf", desc: "Checkliste zur Riester-Rente: Zulageberechtigung prüfen, Eigenbeitrag berechnen und die staatliche Förderung für Ihre Altersvorsorge optimal nutzen." },
  { slug: "risikolebensversicherung", title: "Risikolebensversicherung", filename: "Checkliste_Risikolebensversicherung.pdf", desc: "Checkliste zur Risikolebensversicherung: Versicherungssumme festlegen, Laufzeit bestimmen und den passenden Todesfallschutz für Ihre Familie sichern." },
  { slug: "robo-advisor", title: "Robo-Advisor", filename: "Checkliste_Robo_Advisor.pdf", desc: "Checkliste zu Robo-Advisors: Digitale Vermögensverwaltung verstehen, Anlagestrategien vergleichen und den passenden Robo-Advisor für Ihr Portfolio wählen." },
  { slug: "rundfunkbeitrag", title: "Rundfunkbeitrag", filename: "Checkliste_Rundfunkbeitrag.pdf", desc: "Checkliste zum Rundfunkbeitrag: Beitragspflicht kennen, Befreiungsmöglichkeiten prüfen und den Rundfunkbeitrag korrekt an- oder abmelden." },
  { slug: "ruerup-rente", title: "Rürup-Rente", filename: "Checkliste_Rürup_Rente.pdf", desc: "Checkliste zur Rürup-Rente: Steuervorteile berechnen, Anbieter vergleichen und die Basisrente als steuerlich geförderte Altersvorsorge für Selbstständige nutzen." },
  { slug: "schenkungssteuer", title: "Schenkungssteuer", filename: "Checkliste_Schenkungssteuer.pdf", desc: "Checkliste zur Schenkungssteuer: Freibeträge kennen, Steuerklassen verstehen und Schenkungen steuerlich optimal planen." },
  { slug: "solidaritaetszuschlag", title: "Solidaritätszuschlag", filename: "Checkliste_Solidaritätszuschlag.pdf", desc: "Checkliste zum Solidaritätszuschlag: Aktuelle Freigrenzen kennen, Berechnung verstehen und prüfen, ob Sie vom Solidaritätszuschlag befreit sind." },
  { slug: "sonderausgaben", title: "Sonderausgaben", filename: "Checkliste_Sonderausgaben.pdf", desc: "Checkliste zu Sonderausgaben: Absetzbare Aufwendungen kennen, Höchstbeträge beachten und Vorsorgeaufwendungen, Spenden und Kirchensteuer steuerlich geltend machen." },
  { slug: "sozialhilfe", title: "Sozialhilfe", filename: "Checkliste_Sozialhilfe.pdf", desc: "Checkliste zur Sozialhilfe: Anspruchsvoraussetzungen prüfen, Leistungsarten kennen und den Antrag beim Sozialamt korrekt stellen." },
  { slug: "sozialversicherung", title: "Sozialversicherung", filename: "Checkliste_Sozialversicherung.pdf", desc: "Checkliste zur Sozialversicherung: Fünf Säulen verstehen, Beitragspflicht kennen und Ihren Sozialversicherungsschutz vollständig überblicken." },
  { slug: "sozialversicherungsbeitraege", title: "Sozialversicherungsbeiträge", filename: "Checkliste_Sozialversicherungsbeiträge.pdf", desc: "Checkliste zu Sozialversicherungsbeiträgen: Aktuelle Beitragssätze kennen, Arbeitgeber- und Arbeitnehmeranteile verstehen und Ihre Gesamtbelastung berechnen." },
  { slug: "spenden", title: "Spenden", filename: "Checkliste_Spenden.pdf", desc: "Checkliste zu Spenden: Spendenquittungen sammeln, Höchstbeträge beachten und Ihre Spenden als Sonderausgaben in der Steuererklärung absetzen." },
  { slug: "splittingtabelle", title: "Splittingtabelle", filename: "Checkliste_Splittingtabelle.pdf", desc: "Checkliste zur Splittingtabelle: Zusammenveranlagung verstehen, Steuervorteil berechnen und die Splittingtabelle für Ihre Steuerplanung als Ehepaar nutzen." },
  { slug: "standardtarif-in-der-pkv", title: "Standardtarif in der PKV", filename: "Checkliste_Standardtarif_in_der_PKV.pdf", desc: "Checkliste zum Standardtarif in der PKV: Zugangsvoraussetzungen kennen, Leistungsumfang verstehen und den Standardtarif als günstigere PKV-Alternative prüfen." },
  { slug: "sterbegeldversicherung", title: "Sterbegeldversicherung", filename: "Checkliste_Sterbegeldversicherung.pdf", desc: "Checkliste zur Sterbegeldversicherung: Bestattungskosten absichern, Versicherungssumme festlegen und Angebote für die Sterbevorsorge vergleichen." },
  { slug: "steuerberater", title: "Steuerberater", filename: "Checkliste_Steuerberater.pdf", desc: "Checkliste zum Steuerberater: Den richtigen Berater finden, Kosten nach Steuerberatervergütungsverordnung kennen und die Zusammenarbeit effizient gestalten." },
  { slug: "steuerbescheid", title: "Steuerbescheid", filename: "Checkliste_Steuerbescheid.pdf", desc: "Checkliste zum Steuerbescheid: Bescheid sorgfältig prüfen, Einspruchsfrist beachten und bei Fehlern rechtzeitig Einspruch beim Finanzamt einlegen." },
  { slug: "steuererklaerung", title: "Steuererklärung", filename: "Checkliste_Steuererklärung.pdf", desc: "Checkliste zur Steuererklärung: Unterlagen sammeln, Abgabefristen beachten und die Steuererklärung vollständig und fristgerecht beim Finanzamt einreichen." },
  { slug: "steuerformulare", title: "Steuerformulare", filename: "Checkliste_Steuerformulare.pdf", desc: "Checkliste zu Steuerformularen: Wichtige Formulare und Anlagen kennen, die richtigen Vordrucke für Ihre Situation wählen und korrekt ausfüllen." },
  { slug: "steuerfreibetrag", title: "Steuerfreibetrag", filename: "Checkliste_Steuerfreibetrag.pdf", desc: "Checkliste zu Steuerfreibeträgen: Grundfreibetrag und weitere Freibeträge kennen, Anträge stellen und Ihre Steuerlast durch optimale Nutzung der Freibeträge senken." },
  { slug: "steuerfreie-einnahmen", title: "Steuerfreie Einnahmen", filename: "Checkliste_Steuerfreie_Einnahmen.pdf", desc: "Checkliste zu steuerfreien Einnahmen: Steuerbefreite Einkünfte kennen, Freigrenzen beachten und steuerfrei zufließende Leistungen korrekt in der Erklärung behandeln." },
  { slug: "steuerklassen", title: "Steuerklassen", filename: "Checkliste_Steuerklassen.pdf", desc: "Checkliste zu Steuerklassen: Alle sechs Steuerklassen verstehen, die optimale Kombination für Ehepaare wählen und den Steuerklassenwechsel beantragen." },
  { slug: "steuern-fuer-selbststaendige", title: "Steuern für Selbstständige", filename: "Checkliste_Steuern_für_Selbstständige.pdf", desc: "Checkliste zu Steuern für Selbstständige: Einkommensteuer, Umsatzsteuer und Gewerbesteuer verstehen, Vorauszahlungen planen und Betriebsausgaben korrekt absetzen." },
  { slug: "steuertabelle", title: "Steuertabelle", filename: "Checkliste_Steuertabelle.pdf", desc: "Checkliste zur Steuertabelle: Grund- und Splittingtabelle verstehen, Ihren Steuersatz ermitteln und die Tabelle für Ihre Steuerplanung nutzen." },
  { slug: "strompreise-vergleichen", title: "Strompreise vergleichen", filename: "Checkliste_Strompreise vergleichen.pdf", desc: "Checkliste zum Strompreisvergleich: Aktuellen Verbrauch ermitteln, Tarife vergleichen und durch einen Anbieterwechsel Ihre Stromkosten senken." },
  { slug: "testament", title: "Testament", filename: "Checkliste_Testament.pdf", desc: "Checkliste zum Testament: Erbfolge regeln, Formvorschriften beachten und Ihren letzten Willen rechtssicher und eindeutig verfassen." },
  { slug: "tierversicherungen", title: "Tierversicherungen", filename: "Checkliste_Tierversicherungen.pdf", desc: "Checkliste zu Tierversicherungen: Haftpflicht, OP- und Krankenversicherung für Haustiere vergleichen und den passenden Versicherungsschutz für Ihr Tier wählen." },
  { slug: "umsatzsteuer-und-mehrwertsteuer", title: "Umsatzsteuer und Mehrwertsteuer", filename: "Checkliste_Umsatzsteuer_und_Mehrwertsteuer.pdf", desc: "Checkliste zu Umsatzsteuer und Mehrwertsteuer: Regelsteuersatz und ermäßigten Satz kennen, Vorsteuerabzug nutzen und die Umsatzsteuer korrekt berechnen." },
  { slug: "umsatzsteuererklaerung", title: "Umsatzsteuererklärung", filename: "Checkliste_Umsatzsteuererklärung.pdf", desc: "Checkliste zur Umsatzsteuererklärung: Jahreserklärung fristgerecht einreichen, Vorsteuer korrekt geltend machen und häufige Fehler bei der Umsatzsteuer vermeiden." },
  { slug: "umsatzsteuervoranmeldung", title: "Umsatzsteuervoranmeldung", filename: "Checkliste_Umsatzsteuervoranmeldung.pdf", desc: "Checkliste zur Umsatzsteuervoranmeldung: Abgabefristen beachten, Voranmeldung über ELSTER einreichen und die laufende Umsatzsteuerpflicht korrekt erfüllen." },
  { slug: "umzugskosten", title: "Umzugskosten", filename: "Checkliste_Umzugskosten.pdf", desc: "Checkliste zu Umzugskosten: Beruflich bedingte Umzugskosten ermitteln, Umzugskostenpauschale nutzen und die Kosten als Werbungskosten steuerlich absetzen." },
  { slug: "unfallversicherung", title: "Unfallversicherung", filename: "Checkliste_Unfallversicherung.pdf", desc: "Checkliste zur Unfallversicherung: Gesetzlichen und privaten Unfallschutz vergleichen, Leistungsumfang prüfen und die passende Absicherung für Unfallfolgen wählen." },
  { slug: "unterhaltsvorschuss", title: "Unterhaltsvorschuss", filename: "Checkliste_Unterhaltsvorschuss.pdf", desc: "Checkliste zum Unterhaltsvorschuss: Anspruchsvoraussetzungen prüfen, Leistungshöhe kennen und den Antrag beim Jugendamt als Alleinerziehende stellen." },
  { slug: "uebergangsgeld", title: "Übergangsgeld", filename: "Checkliste_Übergangsgeld.pdf", desc: "Checkliste zum Übergangsgeld: Anspruchsvoraussetzungen bei Reha-Maßnahmen prüfen, Leistungshöhe berechnen und den Antrag beim Rehabilitationsträger stellen." },
  { slug: "verdienstgrenzen-familienversicherung", title: "Verdienstgrenzen Familienversicherung", filename: "Checkliste_Verdienstgrenzen_Familienversicherung.pdf", desc: "Checkliste zu Verdienstgrenzen der Familienversicherung: Einkommensgrenzen kennen, Auswirkungen von Minijobs prüfen und die beitragsfreie Mitversicherung sichern." },
  { slug: "vermoegenswirksame-leistungen", title: "Vermögenswirksame Leistungen", filename: "Checkliste_Vermögenswirksame_Leistungen.pdf", desc: "Checkliste zu vermögenswirksamen Leistungen: Arbeitgeberzuschuss nutzen, förderfähige Anlageformen wählen und die Arbeitnehmersparzulage beantragen." },
  { slug: "vorsorgeaufwendungen", title: "Vorsorgeaufwendungen", filename: "Checkliste_Vorsorgeaufwendungen.pdf", desc: "Checkliste zu Vorsorgeaufwendungen: Absetzbare Versicherungsbeiträge kennen, Höchstbeträge beachten und Vorsorgeaufwendungen steuerlich optimal geltend machen." },
  { slug: "vorsorgevollmacht", title: "Vorsorgevollmacht", filename: "Checkliste_Vorsorgevollmacht.pdf", desc: "Checkliste zur Vorsorgevollmacht: Vertrauensperson bestimmen, Befugnisse festlegen und die Vollmacht für den Ernstfall rechtssicher erstellen und hinterlegen." },
  { slug: "wahltarife-gesetzliche-krankenkasse", title: "Wahltarife gesetzliche Krankenkasse", filename: "Checkliste_Wahltarife_gesetzliche_Krankenkasse.pdf", desc: "Checkliste zu Wahltarifen der GKV: Selbstbehalt-, Prämienprogramme und Zusatzleistungen vergleichen und den passenden Wahltarif für Ihre Bedürfnisse wählen." },
  { slug: "wechsel-private-krankenversicherung", title: "Wechsel private Krankenversicherung", filename: "Checkliste_Wechsel_private_Krankenversicherung.pdf", desc: "Checkliste zum PKV-Wechsel: Tarifwechsel und Anbieterwechsel unterscheiden, Altersrückstellungen prüfen und den Wechsel der privaten Krankenversicherung vorbereiten." },
  { slug: "werbungskosten", title: "Werbungskosten", filename: "Checkliste_Werbungskosten.pdf", desc: "Checkliste zu Werbungskosten: Absetzbare berufliche Ausgaben kennen, Pauschbetrag prüfen und Werbungskosten vollständig in der Steuererklärung geltend machen." },
  { slug: "wertpapierdepot", title: "Wertpapierdepot", filename: "Checkliste_Wertpapierdepot.pdf", desc: "Checkliste zum Wertpapierdepot: Depotgebühren vergleichen, Orderkosten prüfen und das passende Depot für Ihren Wertpapierhandel eröffnen." },
  { slug: "witwenrente", title: "Witwenrente", filename: "Checkliste_Witwenrente.pdf", desc: "Checkliste zur Witwenrente: Anspruchsvoraussetzungen prüfen, große und kleine Witwenrente unterscheiden und den Antrag bei der Rentenversicherung stellen." },
  { slug: "wohngebaeudeversicherung", title: "Wohngebäudeversicherung", filename: "Checkliste_Wohngebäudeversicherung.pdf", desc: "Checkliste zur Wohngebäudeversicherung: Versicherungssumme ermitteln, Elementarschutz prüfen und den passenden Gebäudeschutz für Ihre Immobilie wählen." },
  { slug: "wohngeld", title: "Wohngeld", filename: "Checkliste_Wohngeld.pdf", desc: "Checkliste zum Wohngeld: Einkommensgrenzen prüfen, Antrag bei der Wohngeldstelle stellen und den Mietzuschuss für Ihre Wohnsituation berechnen." },
  { slug: "wohnmobil-versicherung", title: "Wohnmobil-Versicherung", filename: "Checkliste_Wohnmobil_Versicherung.pdf", desc: "Checkliste zur Wohnmobil-Versicherung: Haftpflicht und Kasko vergleichen, Saisonkennzeichen berücksichtigen und den passenden Schutz für Ihr Wohnmobil finden." },
  { slug: "wohnungskuendigung", title: "Wohnungskündigung", filename: "Checkliste_Wohnungskündigung.pdf", desc: "Checkliste zur Wohnungskündigung: Kündigungsfristen einhalten, Schönheitsreparaturen klären und den Auszug sowie die Kautionsrückgabe korrekt abwickeln." },
  { slug: "zahnzusatzversicherung", title: "Zahnzusatzversicherung", filename: "Checkliste_Zahnzusatzversicherung.pdf", desc: "Checkliste zur Zahnzusatzversicherung: Leistungen für Zahnersatz, Prophylaxe und Kieferorthopädie vergleichen und den passenden Zusatzschutz wählen." },
  { slug: "zinsbindungsfrist", title: "Zinsbindungsfrist", filename: "Checkliste_Zinsbindungsfrist.pdf", desc: "Checkliste zur Zinsbindungsfrist: Optimale Laufzeit wählen, Anschlussfinanzierung planen und die Auswirkungen der Zinsbindung auf Ihre Baufinanzierung verstehen." },
  { slug: "zinseszinseffekt", title: "Zinseszinseffekt", filename: "Checkliste_Zinseszinseffekt.pdf", desc: "Checkliste zum Zinseszinseffekt: Exponentielles Wachstum verstehen, Anlagedauer optimieren und den Zinseszins für Ihren langfristigen Vermögensaufbau nutzen." },
  { slug: "zusatzbeitrag-krankenkasse", title: "Zusatzbeitrag Krankenkasse", filename: "Checkliste_Zusatzbeitrag_Krankenkasse.pdf", desc: "Checkliste zum Zusatzbeitrag der Krankenkasse: Aktuelle Beitragssätze vergleichen, Sonderkündigungsrecht nutzen und durch einen Kassenwechsel Beiträge sparen." },
  { slug: "kfz-steuer", title: "Kfz-Steuer", filename: "Checkliste_kfz_Steuer.pdf", desc: "Checkliste zur Kfz-Steuer: Berechnungsgrundlagen kennen, Steuerhöhe für Ihr Fahrzeug ermitteln und mögliche Vergünstigungen für umweltfreundliche Fahrzeuge prüfen." },
];

// Bestehende Slugs die übersprungen werden
const EXISTING_SLUGS = new Set([
  "abfindungen", "abgeltungssteuer", "abschreibungen", "aktien",
  "altersteilzeit", "altersvorsorgeaufwendungen", "festgeld",
  "fonds", "immobilien", "kredite", "tagesgeld"
]);

async function main() {
  const newChecklisten = checklisten.filter(c => !EXISTING_SLUGS.has(c.slug));
  console.log(`\n🚀 Erstelle ${newChecklisten.length} neue Checklisten (${EXISTING_SLUGS.size} bereits vorhanden)...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const cl of newChecklisten) {
    const pdfPath = path.join(PDF_DIR, cl.filename);

    // Prüfe ob PDF existiert
    if (!fs.existsSync(pdfPath)) {
      console.log(`⚠️  ${cl.slug}: PDF nicht gefunden (${cl.filename})`);
      errors++;
      continue;
    }

    // Prüfe ob Slug bereits in WP existiert
    try {
      const existing = wp(`post list --post_type=checkliste --name="${cl.slug}" --format=ids`);
      if (existing.trim()) {
        console.log(`⏭️  ${cl.slug}: bereits vorhanden (ID ${existing.trim()})`);
        skipped++;
        continue;
      }
    } catch (e) {
      // Kein Post gefunden, weiter
    }

    try {
      // 1. PDF hochladen
      const uploadResult = wp(`media import "${pdfPath}" --title="${cl.filename.replace('.pdf', '')}" --porcelain`);
      const attachmentId = uploadResult.trim();

      // 2. CPT-Post erstellen
      const postId = wp(`post create --post_type=checkliste --post_title="${cl.title.replace(/"/g, '\\"')}" --post_name="${cl.slug}" --post_status=publish --porcelain`);

      // 3. ACF-Felder setzen
      wp(`post meta update ${postId.trim()} checkliste_pdf ${attachmentId}`);
      wp(`post meta update ${postId.trim()} _checkliste_pdf field_checkliste_pdf`);
      wp(`post meta update ${postId.trim()} checkliste_beschreibung "${cl.desc.replace(/"/g, '\\"')}"`);
      wp(`post meta update ${postId.trim()} _checkliste_beschreibung field_69b9702a1ccd8`);

      console.log(`✅ ${cl.slug} (Post ${postId.trim()}, PDF ${attachmentId})`);
      created++;
    } catch (err) {
      console.log(`❌ ${cl.slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✨ Fertig! ${created} erstellt, ${skipped} übersprungen, ${errors} Fehler\n`);

  // Gesamtzahl prüfen
  try {
    const total = wp(`post list --post_type=checkliste --format=ids`);
    const count = total.trim().split(/\s+/).length;
    console.log(`📊 Gesamt in WordPress: ${count} Checklisten\n`);
  } catch (e) {}
}

main();
