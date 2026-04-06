/**
 * update-rechner-descriptions.js
 *
 * Updates the excerpt (description) for all 51 financial calculators
 * in WordPress via the REST API.
 *
 * Usage:
 *   WP_USER=admin WP_PASS=password node scripts/update-rechner-descriptions.js
 *
 * Defaults: WP_USER=admin, WP_PASS=password
 * Base URL: http://finanzleser.local
 */

const BASE_URL = "http://finanzleser.local";
const WP_USER = process.env.WP_USER || "admin";
const WP_PASS = process.env.WP_PASS || "password";

const AUTH_HEADER =
  "Basic " + Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");

// ---------------------------------------------------------------------------
// Descriptions for all 51 calculators
// ---------------------------------------------------------------------------

const calculators = [
  // ── STEUER & LOHN (12) ──────────────────────────────────────────────────
  {
    slug: "brutto-netto",
    title: "Brutto-Netto-Rechner",
    description: `Berechnen Sie Ihr Nettogehalt nach Abzug von Lohnsteuer und Sozialabgaben. Ideal für Gehaltsverhandlungen, Jobwechsel und die monatliche Finanzplanung.`,
  },
  {
    slug: "mehrwertsteuer",
    title: "Mehrwertsteuer-Rechner",
    description: `Mehrwertsteuer schnell berechnen: Netto zu Brutto oder Brutto zu Netto mit 19 % oder 7 % USt. Perfekt für Selbstständige, Freiberufler und die Rechnungsstellung.`,
  },
  {
    slug: "einkommensteuer",
    title: "Einkommensteuer-Rechner",
    description: `Ermitteln Sie Ihre Einkommensteuer nach Grund- oder Splittingtarif inkl. Soli und Kirchensteuer. Für Selbstständige, Freiberufler und Angestellte mit Nebeneinkünften.`,
  },
  {
    slug: "kirchensteuer",
    title: "Kirchensteuer-Rechner",
    description: `Berechnen Sie Ihre Kirchensteuer (8 % oder 9 %) auf Basis der Einkommensteuer. Erfahren Sie Ihre monatliche Belastung und die Wirkung als Sonderausgabe.`,
  },
  {
    slug: "kfz-steuer",
    title: "KFZ-Steuer-Rechner",
    description: `Berechnen Sie die jährliche Kfz-Steuer anhand von Hubraum, CO₂-Ausstoß und Antriebsart. Ideal beim Autokauf für den Vergleich laufender Fahrzeugkosten.`,
  },
  {
    slug: "erbschaftsteuer",
    title: "Erbschaftsteuer-Rechner",
    description: `Ermitteln Sie die Erbschaft- oder Schenkungsteuer unter Berücksichtigung von Freibeträgen und Verwandtschaftsgrad. Wichtig für Nachlassplanung und Vermögensübertragung.`,
  },
  {
    slug: "kalteprogression",
    title: "Kalte Progression-Rechner",
    description: `Berechnen Sie, wie viel einer Gehaltserhöhung durch Steuerprogression und Inflation verloren geht. Zeigt den realen Nettoeffekt von Lohnerhöhungen.`,
  },
  {
    slug: "steuererstattung",
    title: "Steuererstattung-Rechner",
    description: `Schätzen Sie Ihre Steuererstattung vorab: Werbungskosten, Sonderausgaben und Pauschbeträge einrechnen und die voraussichtliche Rückzahlung vom Finanzamt ermitteln.`,
  },
  {
    slug: "steuerklassen",
    title: "Steuerklassen-Rechner",
    description: `Finden Sie die optimale Steuerklassenkombination für Ehepaare: III/V, IV/IV oder Faktor. Vergleichen Sie Nettoeinkommen und Auswirkungen auf Elterngeld & Co.`,
  },
  {
    slug: "pendlerpauschale",
    title: "Pendlerpauschale-Rechner",
    description: `Berechnen Sie Ihre Entfernungspauschale und die Steuerersparnis durch den Arbeitsweg. Ermitteln Sie die absetzbaren Fahrtkosten für die Steuererklärung.`,
  },
  {
    slug: "stundenlohn",
    title: "Stundenlohn-Rechner",
    description: `Ermitteln Sie Ihren tatsächlichen Stundenlohn aus dem Monats- oder Jahresgehalt. Nützlich für Jobvergleiche, Gehaltsverhandlungen und den Mindestlohn-Check.`,
  },
  {
    slug: "abfindung",
    title: "Abfindungs-Rechner",
    description: `Berechnen Sie die Steuer auf Ihre Abfindung mit und ohne Fünftelregelung. Erfahren Sie, wie viel netto von der Abfindung nach Steuern übrig bleibt.`,
  },

  // ── SOZIALES & ARBEIT (21) ──────────────────────────────────────────────
  {
    slug: "kindergeld",
    title: "Kindergeld-Rechner",
    description: `Berechnen Sie Ihren Kindergeldanspruch und vergleichen Sie mit dem Kinderfreibetrag. Ermitteln Sie die optimale Variante für Ihre Familie.`,
  },
  {
    slug: "elterngeld",
    title: "Elterngeld-Rechner",
    description: `Ermitteln Sie Ihr voraussichtliches Elterngeld: Basiselterngeld, ElterngeldPlus oder Partnerschaftsbonus. Für die finanzielle Planung rund um die Elternzeit.`,
  },
  {
    slug: "elternzeit",
    title: "Elternzeit-Rechner",
    description: `Planen Sie Ihre Elternzeit mit Fristen, Aufteilung und Teilzeitoptionen. Der Rechner zeigt Anmeldefristen und berücksichtigt Mutterschutzzeiten.`,
  },
  {
    slug: "mutterschutz",
    title: "Mutterschutz-Rechner",
    description: `Berechnen Sie Ihre Mutterschutzfristen und das Mutterschaftsgeld. Ermitteln Sie Beginn und Ende der Schutzfrist sowie den Arbeitgeberzuschuss.`,
  },
  {
    slug: "wohngeld",
    title: "Wohngeld-Rechner",
    description: `Prüfen Sie Ihren Wohngeldanspruch und berechnen Sie den monatlichen Mietzuschuss. Für Haushalte mit geringem Einkommen, Rentner und Studierende.`,
  },
  {
    slug: "buergergeld",
    title: "Bürgergeld-Rechner",
    description: `Ermitteln Sie Ihren Bürgergeld-Anspruch mit Regelsatz, Unterkunftskosten und Freibeträgen. Erste Orientierung vor der Antragstellung beim Jobcenter.`,
  },
  {
    slug: "grundsicherung",
    title: "Grundsicherung-Rechner",
    description: `Berechnen Sie Ihren Anspruch auf Grundsicherung im Alter oder bei Erwerbsminderung. Für Rentner mit niedrigen Bezügen und erwerbsgeminderte Personen.`,
  },
  {
    slug: "alg1",
    title: "Arbeitslosengeld I-Rechner",
    description: `Berechnen Sie Höhe und Bezugsdauer Ihres Arbeitslosengeldes I. Ermitteln Sie den monatlichen ALG-I-Anspruch basierend auf Ihrem letzten Gehalt.`,
  },
  {
    slug: "kurzarbeitsgeld",
    title: "Kurzarbeitsgeld-Rechner",
    description: `Ermitteln Sie Ihr Kurzarbeitergeld bei reduzierter Arbeitszeit. Berechnen Sie den Verdienstausgleich inkl. erhöhter Sätze bei längerer Kurzarbeit.`,
  },
  {
    slug: "krankengeld",
    title: "Krankengeld-Rechner",
    description: `Berechnen Sie Ihr Krankengeld bei längerer Arbeitsunfähigkeit. Erfahren Sie, wie viel die Krankenkasse nach Ablauf der Lohnfortzahlung zahlt.`,
  },
  {
    slug: "kinderkrankengeld",
    title: "Kinderkrankengeld-Rechner",
    description: `Ermitteln Sie Ihren Anspruch auf Kinderkrankengeld: Anspruchstage, Höhe und Voraussetzungen. Für gesetzlich versicherte Eltern mit Kindern unter 12 Jahren.`,
  },
  {
    slug: "pfaendung",
    title: "Pfändung-Rechner",
    description: `Berechnen Sie den pfändbaren und pfändungsfreien Anteil Ihres Einkommens nach aktueller Pfändungstabelle. Für Schuldner, Gläubiger und P-Konto-Inhaber.`,
  },
  {
    slug: "urlaubsanspruch",
    title: "Urlaubsanspruch-Rechner",
    description: `Berechnen Sie Ihren gesetzlichen Urlaubsanspruch – auch anteilig bei Eintritt, Austritt oder Teilzeit. Inkl. Zusatzurlaub bei Schwerbehinderung.`,
  },
  {
    slug: "minijob",
    title: "Minijob & Midijob-Rechner",
    description: `Berechnen Sie Abgaben und Nettoverdienst bei Minijob oder Midijob. Finden Sie die optimale Verdienstgrenze und vermeiden Sie unerwartete Abgaben.`,
  },
  {
    slug: "mindestlohn",
    title: "Mindestlohn-Rechner",
    description: `Prüfen Sie, ob Ihr Stundenlohn dem gesetzlichen Mindestlohn entspricht. Berechnen Sie das Mindestentgelt für verschiedene Arbeitszeitmodelle.`,
  },
  {
    slug: "gleitzone",
    title: "Gleitzone-Rechner",
    description: `Berechnen Sie die reduzierten Sozialversicherungsbeiträge im Übergangsbereich (556–2.000 Euro). Ideal für Teilzeitkräfte und Berufseinsteiger.`,
  },
  {
    slug: "teilzeit",
    title: "Teilzeit-Rechner",
    description: `Berechnen Sie Ihr Nettoeinkommen bei Teilzeit und vergleichen Sie verschiedene Arbeitszeitmodelle. Zeigt den realen Einkommenseffekt einer Stundenreduzierung.`,
  },
  {
    slug: "hinzuverdienst",
    title: "Hinzuverdienst-Rechner",
    description: `Ermitteln Sie, wie viel Sie neben Rente, Bürgergeld oder ALG I dazuverdienen dürfen. Berechnen Sie Freibeträge und Anrechnungen auf Ihre Leistung.`,
  },
  {
    slug: "gruendungszuschuss",
    title: "Gründungszuschuss-Rechner",
    description: `Berechnen Sie Höhe und Dauer des Gründungszuschusses bei Existenzgründung aus der Arbeitslosigkeit. Ermitteln Sie die monatliche Förderung und Gesamtsumme.`,
  },
  {
    slug: "uebergangsgeld",
    title: "Übergangsgeld-Rechner",
    description: `Ermitteln Sie Ihr Übergangsgeld während Reha oder Umschulung. Berechnen Sie die Leistungshöhe der Rentenversicherung oder Berufsgenossenschaft.`,
  },
  {
    slug: "verletztengeld",
    title: "Verletztengeld-Rechner",
    description: `Berechnen Sie Ihr Verletztengeld nach einem Arbeitsunfall oder bei Berufskrankheit. Ermitteln Sie die Leistungshöhe der Berufsgenossenschaft.`,
  },
  {
    slug: "gerichtskosten",
    title: "Gerichtskosten-Rechner",
    description: `Berechnen Sie Gerichts- und Anwaltskosten anhand des Streitwerts nach GKG und RVG. Schätzen Sie Ihr Prozesskostenrisiko vor dem Rechtsstreit ein.`,
  },

  // ── RENTE & ALTERSVORSORGE (8) ──────────────────────────────────────────
  {
    slug: "rente",
    title: "Renten-Rechner",
    description: `Ermitteln Sie Ihre voraussichtliche gesetzliche Rente und erkennen Sie Ihre Versorgungslücke. Wichtig für die Planung der privaten Altersvorsorge.`,
  },
  {
    slug: "rentenabschlag",
    title: "Rentenabschlag-Rechner",
    description: `Berechnen Sie die Rentenkürzung bei vorzeitigem Renteneintritt. Erfahren Sie den Abschlag in Euro und ob sich Sonderzahlungen zum Ausgleich lohnen.`,
  },
  {
    slug: "rentenbeginn",
    title: "Rentenbeginn-Rechner",
    description: `Ermitteln Sie Ihren frühestmöglichen und regulären Rentenbeginn nach Geburtsjahr und Versicherungszeiten. Für alle Rentenarten mit und ohne Abschlag.`,
  },
  {
    slug: "rentenbesteuerung",
    title: "Rentenbesteuerung-Rechner",
    description: `Berechnen Sie die Steuer auf Ihre Rente: Besteuerungsanteil, Rentenfreibetrag und Steuerlast. Erfahren Sie, ob Sie als Rentner eine Steuererklärung abgeben müssen.`,
  },
  {
    slug: "rentenschaetzer",
    title: "Rentenschätzer",
    description: `Schnelle Rentenprognose mit wenigen Angaben: Alter, Einkommen und Berufsjahre eingeben und sofort Ihre voraussichtliche gesetzliche Rente erfahren.`,
  },
  {
    slug: "flexrente",
    title: "Flexrenten-Rechner",
    description: `Berechnen Sie Teilrente und Hinzuverdienst mit der Flexirente. Ermitteln Sie das optimale Verhältnis für einen gleitenden Übergang in den Ruhestand.`,
  },
  {
    slug: "altersteilzeit",
    title: "Altersteilzeit-Rechner",
    description: `Berechnen Sie Einkommen und Rentenansprüche in der Altersteilzeit. Vergleichen Sie Block- und Gleichverteilungsmodell für den Übergang in den Ruhestand.`,
  },
  {
    slug: "witwenrente",
    title: "Witwenrente-Rechner",
    description: `Ermitteln Sie Ihren Anspruch auf Witwenrente: große oder kleine Hinterbliebenenrente inkl. Einkommensanrechnung und Freibeträgen.`,
  },

  // ── KREDIT & FINANZEN (11) ──────────────────────────────────────────────
  {
    slug: "kredit",
    title: "Kreditrechner",
    description: `Berechnen Sie Monatsrate, Gesamtkosten und Tilgungsplan für Ihren Ratenkredit. Vergleichen Sie verschiedene Kreditangebote anhand des Effektivzinses.`,
  },
  {
    slug: "zinseszins",
    title: "Zinseszins-Rechner",
    description: `Nutzen Sie den Zinseszinseffekt: Berechnen Sie, wie Ihr Kapital mit Sparrate und Rendite über die Jahre wächst. Ideal für die Planung von Sparplan und Altersvorsorge.`,
  },
  {
    slug: "inflation",
    title: "Inflationsrechner",
    description: `Berechnen Sie den Kaufkraftverlust durch Inflation über die Zeit. Erfahren Sie, wie viel Ihr Geld in 10, 20 oder 30 Jahren noch wert ist.`,
  },
  {
    slug: "tilgung",
    title: "Tilgungsrechner",
    description: `Erstellen Sie einen Tilgungsplan für Ihre Baufinanzierung mit Restschuld, Zinsbindung und Sondertilgung. Für die fundierte Planung Ihrer Immobilienfinanzierung.`,
  },
  {
    slug: "annuitaet",
    title: "Annuitätenrechner",
    description: `Berechnen Sie die gleichbleibende Monatsrate für Ihr Annuitätendarlehen inkl. Zins- und Tilgungsanteil. Ideal für Baufinanzierung und Ratenkredite.`,
  },
  {
    slug: "leasing",
    title: "Leasing-Rechner",
    description: `Berechnen Sie Leasingrate, Leasingfaktor und Gesamtkosten. Vergleichen Sie Leasing mit Finanzierung oder Barkauf – für Auto und andere Anschaffungen.`,
  },
  {
    slug: "haushaltsrechner",
    title: "Haushalts-Rechner",
    description: `Erfassen Sie Einnahmen und Ausgaben und ermitteln Sie Ihr frei verfügbares Budget. Die Grundlage für Sparplan, Kreditantrag und Finanzplanung.`,
  },
  {
    slug: "paypal",
    title: "PayPal-Gebühren-Rechner",
    description: `Berechnen Sie PayPal-Gebühren für Verkäufer und den Nettobetrag nach Transaktionskosten. Für Online-Händler, Freelancer und die korrekte Preiskalkulation.`,
  },
  {
    slug: "bafoeg",
    title: "BAföG-Rechner",
    description: `Ermitteln Sie Ihren BAföG-Anspruch auf Basis des Elterneinkommens. Berechnen Sie die monatliche Förderung für Studierende und Schüler vor der Antragstellung.`,
  },
];

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_HEADER,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Updating ${calculators.length} calculator descriptions …\n`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User:     ${WP_USER}\n`);

  let success = 0;
  let failed = 0;

  for (const calc of calculators) {
    try {
      // 1. Find the post by slug
      const posts = await apiFetch(
        `/wp-json/wp/v2/rechner?slug=${encodeURIComponent(calc.slug)}`
      );

      if (!posts || posts.length === 0) {
        console.log(`⚠  SKIP  ${calc.slug} — not found in WordPress`);
        failed++;
        continue;
      }

      const postId = posts[0].id;

      // 2. Update the excerpt and ACF beschreibung field
      await apiFetch(`/wp-json/wp/v2/rechner/${postId}`, {
        method: "POST",
        body: JSON.stringify({
          excerpt: calc.description,
          meta: {
            rechner_beschreibung: calc.description,
          },
        }),
      });

      console.log(`✓  OK    ${calc.slug} (ID ${postId})`);
      success++;
    } catch (err) {
      console.log(`✗  FAIL  ${calc.slug} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} updated, ${failed} failed/skipped.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
