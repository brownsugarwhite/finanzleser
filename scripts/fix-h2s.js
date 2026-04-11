#!/usr/bin/env node

/**
 * Ersetzt die schlechten generierten H2s (erste Sätze aus dem Fließtext)
 * durch kurze, beschreibende H2s im Stil: "Thema: Kurzbeschreibung"
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const articles = require("./articles-converted.json");
const OUTPUT = path.join(__dirname, "articles-converted.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024
  }).trim();
}

// Alle 156 neuen H2s — kurz, beschreibend, SEO-relevant
const NEW_H2S = {
  "Abfindungen": "Abfindungen: Anspruch, Berechnung und Steueroptimierung",
  "Abgeltungssteuer": "Abgeltungssteuer: Kapitalerträge und Freibeträge 2026",
  "Abschreibungen": "Abschreibungen: Methoden, Nutzungsdauer und Steuervorteile",
  "Aktien": "Aktien: Grundlagen, Strategien und steuerliche Behandlung",
  "Altersteilzeit": "Altersteilzeit: Modelle, Voraussetzungen und Rentenansprüche",
  "Altersvorsorgeaufwendungen": "Altersvorsorgeaufwendungen: Absetzbare Beiträge und Höchstbeträge",
  "Arbeitgeberzuschuss Private Krankenversicherung": "Arbeitgeberzuschuss PKV: Anspruch, Höhe und Beantragung",
  "Arbeitnehmer-Sparzulage": "Arbeitnehmer-Sparzulage: Förderung, Voraussetzungen und Anlageformen",
  "Arbeitskleidung": "Arbeitskleidung: Steuerlich absetzbare Berufskleidung und Regelungen",
  "Arbeitslosengeld": "Arbeitslosengeld: Anspruch, Berechnung und Bezugsdauer",
  "Arbeitsmittel": "Arbeitsmittel: Berufliche Ausgaben steuerlich absetzen",
  "Arbeitszimmer": "Arbeitszimmer: Steuerabzug, Voraussetzungen und Homeoffice-Pauschale",
  "Ausbildungskosten": "Ausbildungskosten: Steuerliche Absetzung von Erst- und Zweitausbildung",
  "Auslandskrankenversicherung": "Auslandskrankenversicherung: Schutz, Leistungen und Tarifvergleich",
  "Außergewöhnliche Belastungen": "Außergewöhnliche Belastungen: Absetzbare Kosten und Eigenbelastung",
  "Basisrente": "Basisrente: Steuervorteile und Altersvorsorge für Selbstständige",
  "Basistarif in der PKV": "Basistarif PKV: Leistungsumfang und Zugangsvoraussetzungen",
  "Baufinanzierung": "Baufinanzierung: Zinsen, Eigenkapital und Finanzierungsstrategien",
  "Bauherrenhaftpflichtversicherung": "Bauherrenhaftpflicht: Haftungsrisiken beim Hausbau absichern",
  "Bausparvertrag": "Bausparvertrag: Funktionsweise, Förderung und Tarifvergleich",
  "Beitragsanpassung PKV": "Beitragsanpassung PKV: Gründe, Rechte und Sparmöglichkeiten",
  "Beitragsbemessungsgrenzen": "Beitragsbemessungsgrenzen: Aktuelle Werte und Auswirkungen 2026",
  "Berliner Testament": "Berliner Testament: Erbfolge, Pflichtteil und steuerliche Folgen",
  "Berufshaftpflichtversicherung": "Berufshaftpflicht: Schutz für Selbstständige und Freiberufler",
  "Berufsunfähigkeitsversicherung": "Berufsunfähigkeitsversicherung: Absicherung, Kosten und Tarifwahl",
  "Betreuungsverfügung": "Betreuungsverfügung: Rechtliche Vorsorge für den Ernstfall",
  "Betriebliche Altersversorgung": "Betriebliche Altersversorgung: Durchführungswege und Steuervorteile",
  "Betriebliche Krankenversicherung": "Betriebliche Krankenversicherung: Leistungen und steuerliche Behandlung",
  "Betriebshaftpflichtversicherung": "Betriebshaftpflicht: Unternehmensrisiken richtig absichern",
  "Bußgeldkatalog": "Bußgeldkatalog 2026: Strafen, Punkte und aktuelle Änderungen",
  "Bürgergeld": "Bürgergeld: Anspruchsvoraussetzungen, Antrag und Leistungshöhe",
  "Bürgerversicherung": "Bürgerversicherung: Konzept, Vorteile und Kritik im Überblick",
  "Cyberversicherung": "Cyberversicherung: Schutz vor digitalen Risiken und Datenverlust",
  "Dienstreisen": "Dienstreisen: Reisekosten, Verpflegungspauschalen und Steuerabzug",
  "Dienstwagen": "Dienstwagen: Versteuerung, Ein-Prozent-Regel und Fahrtenbuch",
  "Dienstwohnung": "Dienstwohnung: Geldwerter Vorteil und steuerliche Behandlung",
  "Direktbank vs. Filialbank": "Direktbank vs. Filialbank: Konditionen, Service und Kosten im Vergleich",
  "Direktversicherung": "Direktversicherung: Betriebliche Altersvorsorge mit Steuerersparnis",
  "Doppelte Haushaltsführung": "Doppelte Haushaltsführung: Voraussetzungen und absetzbare Kosten",
  "Drohnenhaftpflichtversicherung": "Drohnenhaftpflicht: Versicherungspflicht, Kosten und Deckungsumfang",
  "Düsseldorfer Tabelle": "Düsseldorfer Tabelle 2026: Aktuelle Unterhaltssätze und Berechnung",
  "ETC – Exchange Traded Commodities": "ETC: Rohstoff-Investments für Privatanleger erklärt",
  "ETF – Exchange Traded Funds": "ETF: Indexfonds als Baustein für den Vermögensaufbau",
  "E-Bike Versicherung": "E-Bike-Versicherung: Diebstahl, Unfall und Kaskoversicherung",
  "E-Scooter Versicherung": "E-Scooter-Versicherung: Pflicht, Kosten und Deckungsumfang",
  "Ehegattensplitting": "Ehegattensplitting: Steuervorteil für Ehepaare berechnen",
  "Ehegattenunterhalt": "Ehegattenunterhalt: Anspruch, Berechnung und steuerliche Absetzung",
  "Einlagensicherung": "Einlagensicherung: Schutz für Ihr Bankguthaben in Deutschland",
  "Elterngeld": "Elterngeld: Anspruch, Berechnung und ElterngeldPlus 2026",
  "Elternunterhalt": "Elternunterhalt: Wann Kinder für pflegebedürftige Eltern zahlen",
  "Elternzeit": "Elternzeit: Dauer, Aufteilung und Antragstellung",
  "Entlastungsbetrag Alleinerziehende": "Entlastungsbetrag: Steuerklasse II und Freibeträge für Alleinerziehende",
  "Erbrecht": "Erbrecht: Erbfolge, Testament und Pflichtteilsansprüche",
  "Erbschaftsteuer": "Erbschaftsteuer: Freibeträge, Steuerklassen und Steuersätze",
  "Erwerbsminderungsrente": "Erwerbsminderungsrente: Anspruch, Antrag und Rentenhöhe",
  "Fahrradversicherung": "Fahrradversicherung: Diebstahl- und Unfallschutz im Vergleich",
  "Familienversicherung": "Familienversicherung: Beitragsfreie Mitversicherung in der GKV",
  "Ferienwohnung": "Ferienwohnung: Mieteinnahmen, Steuern und Werbungskosten",
  "Geldanlage auf Festgeld": "Festgeld: Zinsen, Laufzeiten und Einlagensicherung im Vergleich",
  "Fonds": "Fonds: Anlagestrategien, Kosten und Fondsarten im Überblick",
  "Fondsgebundene Lebensversicherung": "Fondsgebundene Lebensversicherung: Rendite und Altersvorsorge",
  "Freiwillige gesetzliche Krankenversicherung": "Freiwillige GKV: Beiträge, Voraussetzungen und Alternativen",
  "Freiwillige gesetzliche Rentenversicherung": "Freiwillige Rentenversicherung: Beiträge und Rentenansprüche",
  "Gaspreise vergleichen": "Gaspreise 2026: Tarife vergleichen und Anbieter wechseln",
  "Geringfügige Beschäftigung": "Geringfügige Beschäftigung: Verdienstgrenzen und Versicherungspflicht",
  "Gesetzliche Krankenversicherung": "Gesetzliche Krankenversicherung: Leistungen, Beiträge und Kassenwahl",
  "Gesetzliche Rentenversicherung": "Gesetzliche Rente: Beiträge, Rentenansprüche und Altersvorsorge",
  "Gesetzliche Unfallversicherung": "Gesetzliche Unfallversicherung: Leistungen und Versicherungsschutz",
  "Gewerbesteuer": "Gewerbesteuer: Freibetrag, Hebesatz und Steuererklärung",
  "Girokonto": "Girokonto: Kontogebühren, Leistungen und Anbieterwahl",
  "Grunderwerbsteuer": "Grunderwerbsteuer: Steuersätze nach Bundesland und Freibeträge",
  "Grundschuld": "Grundschuld: Eintragung, Löschung und Bedeutung für den Kredit",
  "Grundsicherung": "Grundsicherung: Anspruch, Vermögensgrenzen und Antragstellung",
  "Hausbesitzerhaftpflicht und Grundbesitzerhaftpflicht": "Haus- und Grundbesitzerhaftpflicht: Schutz für Immobilieneigentümer",
  "Hinzuverdienst in der Rente": "Hinzuverdienst Rente: Verdienstgrenzen, Regeln und Steuerfolgen",
  "Hunde OP Versicherung": "Hunde-OP-Versicherung: Kosten, Leistungen und Tarifvergleich",
  "Immobilien als Geldanlage": "Anlageimmobilien: Rendite, Finanzierung und Steuervorteile",
  "Investition in Gold": "Goldanlage: Strategien, Kosten und steuerliche Behandlung",
  "Investition in Sachwerte": "Sachwerte: Immobilien, Rohstoffe und Edelmetalle als Anlage",
  "Jahressteuerbescheinigung": "Jahressteuerbescheinigung: Bedeutung und Eintrag in der Steuererklärung",
  "KfW Studienkredit": "KfW-Studienkredit: Konditionen, Antrag und Rückzahlung",
  "Kinderbetreuungskosten": "Kinderbetreuungskosten: Steuerliche Absetzung und Höchstbeträge",
  "Kinderkrankengeld": "Kinderkrankengeld: Anspruch, Dauer und Antragstellung 2026",
  "Kinderzuschlag": "Kinderzuschlag: Einkommensgrenzen, Berechnung und Antrag",
  "Kirchensteuer": "Kirchensteuer: Berechnung, Sonderausgabenabzug und Austritt",
  "Körperschaftsteuer": "Körperschaftsteuer: Steuersatz und Pflichten für Kapitalgesellschaften",
  "Krankengeld": "Krankengeld: Berechnung, Anspruchsdauer und Antragstellung",
  "Krankentagegeldversicherung": "Krankentagegeld: Einkommenssicherung bei längerer Krankheit",
  "Krankenversicherung Leistungen": "Krankenversicherung: Kassenleistungen und Zusatzleistungen im Überblick",
  "Krankenversicherung Rentner": "Krankenversicherung Rentner: Beiträge und KVdR-Zugang",
  "Krankenversicherung Studenten": "Studentische Krankenversicherung: Optionen, Kosten und Pflichtversicherung",
  "Krankenversicherungsbeiträge": "Krankenversicherungsbeiträge 2026: Berechnung und Sparmöglichkeiten",
  "Krankenversicherungspflicht": "Krankenversicherungspflicht: Wer muss sich wie versichern?",
  "Kredite": "Kredite: Kreditarten, Zinsen und Tipps zur Finanzierung",
  "Kreditkarte": "Kreditkarte: Gebühren, Leistungen und Anbietervergleich",
  "Kryptowährung": "Kryptowährung: Grundlagen, Risiken und steuerliche Behandlung",
  "Kurzarbeitergeld": "Kurzarbeitergeld: Anspruch, Berechnung und Antragstellung",
  "Kündigung Krankenversicherung": "Krankenversicherung kündigen: Fristen und Sonderkündigungsrecht",
  "Lebensversicherung": "Lebensversicherung: Kapital- und Risikolebensversicherung im Vergleich",
  "Lohnsteuer": "Lohnsteuer: Berechnung, Steuerklassen und Freibeträge",
  "Lohnsteuerermäßigung": "Lohnsteuerermäßigung: Freibetrag beantragen und Netto erhöhen",
  "Lohnsteuertabelle": "Lohnsteuertabelle: Steuerklassen und monatliche Abzüge berechnen",
  "Mutterschaftsgeld": "Mutterschaftsgeld: Anspruch, Höhe und Beantragung",
  "Nachhaltige Geldanlagen": "Nachhaltige Geldanlagen: ESG-Kriterien und grüne Investments",
  "Patientenverfügung": "Patientenverfügung: Medizinische Wünsche rechtssicher festlegen",
  "Pflegebedürftigkeit": "Pflegebedürftigkeit: Anzeichen, Pflegegrad und Leistungsansprüche",
  "Pflegedienste": "Pflegedienste: Ambulante Pflege finden, vergleichen und finanzieren",
  "Pflegegrad beantragen": "Pflegegrad beantragen: Antrag, Begutachtung und Einstufung",
  "Pflegezusatzversicherung": "Pflegezusatzversicherung: Versorgungslücke schließen und vorsorgen",
  "Pflichtversicherung Rente": "Rentenversicherungspflicht: Wer ist pflichtversichert?",
  "Private Haftpflichtversicherung": "Private Haftpflicht: Deckungssumme, Leistungen und Tarifvergleich",
  "Private Krankenversicherung": "Private Krankenversicherung: Kosten, Leistungen und Wechseloptionen",
  "Private Pflege-Pflichtversicherung": "Private Pflege-Pflichtversicherung: Leistungen und Beiträge in der PKV",
  "Rechtsschutzversicherung": "Rechtsschutzversicherung: Leistungsbausteine und Kostenübernahme",
  "Rentenarten": "Rentenarten: Alters-, Erwerbsminderungs- und Hinterbliebenenrente",
  "Rentenbeitrag": "Rentenbeitrag: Beitragssatz, Bemessungsgrenze und Berechnung",
  "Renteninformation": "Renteninformation: Rentenbescheid verstehen und Lücken erkennen",
  "Rentenversicherungsbeitrag": "Rentenversicherungsbeitrag 2026: Sätze und Auswirkungen aufs Gehalt",
  "Risikolebensversicherung": "Risikolebensversicherung: Todesfallschutz für Familie und Kredit",
  "Schenkungssteuer": "Schenkungssteuer: Freibeträge, Steuerklassen und Steuersätze",
  "Sonderausgaben": "Sonderausgaben: Absetzbare Aufwendungen und Höchstbeträge",
  "Sozialhilfe": "Sozialhilfe: Anspruch, Leistungsarten und Antragstellung",
  "Sozialversicherungsbeiträge": "Sozialversicherungsbeiträge 2026: Beitragssätze im Überblick",
  "Splittingtabelle": "Splittingtabelle: Steuerberechnung für zusammenveranlagte Ehepaare",
  "Standardtarif in der PKV": "Standardtarif PKV: Leistungen, Beiträge und Zugangsvoraussetzungen",
  "Sterbegeldversicherung": "Sterbegeldversicherung: Bestattungskosten absichern und vorsorgen",
  "Steuerbescheid": "Steuerbescheid: Prüfung, Einspruchsfrist und Korrekturmöglichkeiten",
  "Steuerformulare": "Steuerformulare: Wichtige Anlagen und Ausfüllhilfen",
  "Steuerfreibetrag": "Steuerfreibeträge 2026: Grundfreibetrag und weitere Freibeträge",
  "Steuerfreie Einnahmen": "Steuerfreie Einnahmen: Welche Einkünfte nicht versteuert werden",
  "Steuerklassen": "Steuerklassen: Übersicht, Wahl und optimale Kombination",
  "Steuern für Selbstständige": "Steuern für Selbstständige: Einkommensteuer, Umsatzsteuer und Gewerbesteuer",
  "Steuertabelle": "Steuertabelle: Grund- und Splittingtabelle 2026 erklärt",
  "Geldanlage auf Tagesgeld": "Tagesgeld: Zinsen, Verfügbarkeit und Anbieter im Vergleich",
  "Testament": "Testament: Formvorschriften, Erbfolge und Gestaltungsmöglichkeiten",
  "Umsatzsteuer und Mehrwertsteuer": "Umsatzsteuer und Mehrwertsteuer: Sätze, Vorsteuerabzug und Regelungen",
  "Umsatzsteuererklärung": "Umsatzsteuererklärung: Fristen, Vorsteuer und häufige Fehler",
  "Umsatzsteuervoranmeldung": "Umsatzsteuervoranmeldung: Abgabefristen und ELSTER-Einreichung",
  "Umzugskosten": "Umzugskosten: Pauschale nutzen und Werbungskosten absetzen",
  "Unfallversicherung": "Unfallversicherung: Gesetzlicher und privater Schutz im Vergleich",
  "Unterhaltsvorschuss": "Unterhaltsvorschuss: Staatliche Hilfe für Alleinerziehende",
  "Übergangsgeld": "Übergangsgeld: Leistungshöhe bei Reha und beruflicher Umschulung",
  "Verdienstgrenzen Familienversicherung": "Familienversicherung: Einkommensgrenzen und Voraussetzungen",
  "Vermögenswirksame Leistungen": "Vermögenswirksame Leistungen: Arbeitgeberzuschuss und Sparzulage",
  "Vorsorgeaufwendungen": "Vorsorgeaufwendungen: Versicherungsbeiträge steuerlich absetzen",
  "Wahltarife gesetzliche Krankenkasse": "Wahltarife GKV: Selbstbehalt, Prämien und Zusatzleistungen",
  "Wechsel private Krankenversicherung": "PKV-Wechsel: Tarifwechsel, Anbieterwechsel und Altersrückstellungen",
  "Werbungskosten": "Werbungskosten: Absetzbare Berufsausgaben und Pauschbetrag",
  "Wertpapierdepot": "Wertpapierdepot: Eröffnung, Gebühren und Anbietervergleich",
  "Wohngebäudeversicherung": "Wohngebäudeversicherung: Schutz vor Feuer, Wasser und Sturm",
  "Wohngeld": "Wohngeld: Anspruch, Berechnung und Antragstellung",
  "Wohnmobil-Versicherung": "Wohnmobil-Versicherung: Haftpflicht, Kasko und Saisonkennzeichen",
  "Wohnungskündigung": "Wohnungskündigung: Fristen, Formvorschriften und Kautionsrückgabe",
  "Zahnzusatzversicherung": "Zahnzusatzversicherung: Leistungen für Zahnersatz und Prophylaxe",
  "Zinseszinseffekt": "Zinseszinseffekt: Exponentielles Wachstum für Ihre Geldanlage",
  "Zusatzbeitrag Krankenkasse": "Zusatzbeitrag 2026: Krankenkassen vergleichen und Beiträge sparen",
};

console.log(`🔧 Ersetze ${Object.keys(NEW_H2S).length} H2s...\n`);

let updated = 0;

for (const article of articles) {
  const newH2 = NEW_H2S[article.title];
  if (!newH2) continue;

  // Check if current H2 is already good
  const h2Match = article.content.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (!h2Match) continue;
  const currentH2 = h2Match[1];

  // Skip if already short and has colon/dash
  if (currentH2.length < 65 && (currentH2.includes(':') || currentH2.includes('–'))) continue;

  // Replace first H2 in content
  article.content = article.content.replace(
    /<h2([^>]*)>[^<]+<\/h2>/,
    `<h2$1>${newH2}</h2>`
  );
  article.firstH2 = newH2;

  // Update in WordPress
  const postId = wp(`post list --post_type=post --name="${article.slug}" --format=ids`).trim();
  if (postId) {
    const tmpFile = `/tmp/wp-h2fix-${article.slug}.html`;
    fs.writeFileSync(tmpFile, article.content);
    wp(`post update ${postId} "${tmpFile}"`);
    fs.unlinkSync(tmpFile);
  }

  console.log(`✅ ${article.slug} → ${newH2}`);
  updated++;
}

fs.writeFileSync(OUTPUT, JSON.stringify(articles, null, 2));
console.log(`\n✨ ${updated} H2s ersetzt`);
