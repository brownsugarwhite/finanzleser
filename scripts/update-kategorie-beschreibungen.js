#!/usr/bin/env node

/**
 * Setzt für alle 24 im MegaNav genutzten Kategorien (4 Haupt + 20 Sub)
 * eine kurze redaktionelle Beschreibung im WordPress-CMS.
 *
 * Anzeige: unter dem Sparks-Titel auf der Kategorieseite.
 * Länge: 140-180 Zeichen, max 2 Sätze, Sie-Anrede.
 *
 * Usage:
 *   node scripts/update-kategorie-beschreibungen.js --dry-run
 *   node scripts/update-kategorie-beschreibungen.js --slug <s>
 *   node scripts/update-kategorie-beschreibungen.js --force
 */

const { execSync } = require("child_process");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};
const DRY = flag("--dry-run");
const ONLY_SLUG = val("--slug");
const FORCE = flag("--force");

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function wpSafe(cmd) {
  try { return wp(cmd); } catch (e) { return null; }
}

// ─── 24 Beschreibungen ───────────────────────────────────────────
const DESCRIPTIONS = {
  // Hauptkategorien
  "steuern": "Steuerrecht verständlich erklärt: Steuererklärung, Steuerarten und Sonderregelungen für Arbeitnehmer, Selbstständige und Familien – mit aktuellen Werten für 2026.",
  "finanzen": "Geldanlage, Kredite, Konten und Energiekosten kompakt aufbereitet – mit Vergleichen, Rechnern und Hintergrundwissen für fundierte Finanzentscheidungen.",
  "versicherungen": "Vom Krankenschutz über Berufsunfähigkeit bis zur privaten Altersvorsorge: Welche Versicherungen wirklich nötig sind und worauf Sie beim Abschluss achten sollten.",
  "recht": "Arbeitsrecht, Familienrecht und Mietrecht im Alltag: Was Ihnen zusteht, welche Pflichten Sie haben und wie Sie Konflikte rechtssicher lösen.",

  // Sub-Steuern
  "steuerarten": "Einkommensteuer, Umsatzsteuer, Gewerbesteuer und Co.: Die wichtigsten Steuerarten in Deutschland mit aktuellen Sätzen und Beispielrechnungen für 2026.",
  "steuererklaerung": "Schritt für Schritt zur eigenen Steuererklärung: Welche Anlagen Sie brauchen, welche Kosten absetzbar sind und wie Sie die Rückzahlung optimieren.",
  "steuerpflichtige": "Sonderregelungen für Selbstständige, Rentner, Studenten und Familien: Wer wann steuerpflichtig wird und welche Freibeträge und Vergünstigungen gelten.",

  // Sub-Finanzen
  "energiekosten": "Strom- und Gaspreise vergleichen, Förderungen nutzen und langfristig sparen: Aktuelle Tarife, Wechseltipps und alle Pflichten als Verbraucher.",
  "geldanlagen": "Aktien, Fonds, ETFs, Tages- und Festgeld: Anlageklassen verständlich erklärt – inklusive Strategien, Steuern und Risikobewertung für jeden Anlagetyp.",
  "konto-karten": "Girokonto, Tagesgeldkonto, Kredit- und EC-Karten im Vergleich: Welche Konditionen sich lohnen und wie Sie unnötige Gebühren dauerhaft vermeiden.",
  "kredite-bauen": "Baufinanzierung, Ratenkredite und Bausparen ohne Fallstricke: Aktuelle Zinsen, KfW-Förderung und Tipps für die optimale Finanzierungsstrategie.",
  "weitere-themen": "Weitere Finanzthemen rund um Vermögensaufbau, Vorsorge, Steuern und alltägliche Geldfragen, die thematisch in keine der anderen Hauptkategorien passen.",

  // Sub-Versicherungen
  "altersvorsorge": "Riester, Rürup, betriebliche Altersversorgung und private Rentenversicherung: So bauen Sie eine zusätzliche Rente neben der gesetzlichen Vorsorge auf.",
  "berufsunfaehigkeit": "Eine BU-Versicherung schützt vor dem finanziellen Aus, wenn Sie nicht mehr arbeiten können. Tarife, Bedingungen und Tipps zum optimalen Schutz.",
  "krankenversicherung": "Gesetzliche und private Krankenversicherung im direkten Vergleich: Beiträge, Leistungen und wie Sie zwischen GKV und PKV die richtige Wahl treffen.",
  "pflegeversicherung": "Pflegegrade, Pflegegeld und private Zusatzversicherungen: Wer im Pflegefall welche Leistungen bekommt und wie Sie die finanzielle Lücke schließen.",
  "rentenversicherung": "Gesetzliche Rente, Erwerbsminderung und Hinterbliebenenleistungen: So funktioniert die deutsche Rentenversicherung und das erwartet Sie im Alter.",
  "sachversicherungen": "Hausrat, Wohngebäude, Haftpflicht und Co.: Welche Sachversicherungen wirklich Pflicht sind und wo sich der Schutz für Sie tatsächlich lohnt.",
  "sozialversicherung": "Renten-, Kranken-, Pflege-, Arbeitslosen- und Unfallversicherung bilden das Fundament der sozialen Absicherung in Deutschland – Beiträge und Leistungen kompakt.",
  "tierversicherungen": "OP-, Kranken- und Haftpflichtversicherungen für Hunde, Katzen und Pferde: Welcher Schutz für welches Tier sinnvoll ist und was die Tarife kosten.",
  "unfallversicherung": "Die private Unfallversicherung schützt Sie auch in der Freizeit. Welche Leistungen wichtig sind und wie Sie Beitrag und Invaliditätssumme richtig wählen.",

  // Sub-Recht
  "arbeitsrecht": "Kündigung, Abfindung, Arbeitsvertrag und Urlaubsanspruch: Ihre Rechte und Pflichten als Arbeitnehmer – mit aktuellen Urteilen und Praxistipps.",
  "ehe-familie": "Ehe, Scheidung, Unterhalt und Erbrecht: Was Familien rechtlich wissen müssen und wie Sie wichtige Lebensentscheidungen rechtssicher treffen.",
  "mietrecht": "Mietvertrag, Nebenkostenabrechnung, Kündigung und Mieterhöhung: Ihre Rechte als Mieter oder Vermieter und wie Sie typische Streitfälle vermeiden.",
};

// ─── Run ────────────────────────────────────────────────────────────

const slugs = Object.keys(DESCRIPTIONS).filter((s) => !ONLY_SLUG || s === ONLY_SLUG);

console.log(`\n📝 Kategorie-Beschreibungen Update`);
console.log(`   Modus:        ${DRY ? "DRY-RUN" : "LIVE"}${FORCE ? " (force)" : ""}`);
console.log(`   Zu verarbeiten: ${slugs.length}/${Object.keys(DESCRIPTIONS).length}\n`);

let ok = 0, skip = 0, errors = 0, lengthIssues = 0;

for (const slug of slugs) {
  const desc = DESCRIPTIONS[slug];

  // Längen-Check
  if (desc.length < 140 || desc.length > 200) {
    console.log(`  ⚠ ${slug}: Länge ${desc.length} außerhalb 140-200`);
    lengthIssues++;
  }

  try {
    // term-ID per slug holen
    const termJson = wpSafe(`term list category --slug=${slug} --fields=term_id,description --format=json`);
    if (!termJson) {
      console.log(`❌ ${slug}: Kategorie nicht gefunden`);
      errors++;
      continue;
    }
    const terms = JSON.parse(termJson);
    if (terms.length === 0) {
      console.log(`❌ ${slug}: Kategorie nicht gefunden`);
      errors++;
      continue;
    }
    const term = terms[0];
    const id = term.term_id;
    const current = term.description || "";

    if (current === desc) {
      console.log(`  = ${slug} (ID ${id}, ${desc.length} Z.): bereits aktuell`);
      skip++;
      continue;
    }
    if (current && !FORCE) {
      console.log(`  ⚠ ${slug} (ID ${id}): bestehend, --force zum Überschreiben`);
      skip++;
      continue;
    }

    if (DRY) {
      console.log(`[DRY] ${slug} (ID ${id}, ${desc.length} Z.): "${desc.slice(0, 60)}..."`);
      ok++;
    } else {
      const escaped = desc.replace(/"/g, '\\"').replace(/\$/g, "\\$");
      wp(`term update category ${id} --description="${escaped}"`);
      console.log(`✅ ${slug} (ID ${id}, ${desc.length} Z.)`);
      ok++;
    }
  } catch (e) {
    console.log(`❌ ${slug}: ${e.message.split("\n")[0]}`);
    errors++;
  }
}

console.log(`\n✨ Fertig: ${ok} ok, ${skip} übersprungen, ${errors} Fehler`);
if (lengthIssues > 0) console.log(`   ⚠ ${lengthIssues} Beschreibungen außerhalb 140-200 Zeichen`);
