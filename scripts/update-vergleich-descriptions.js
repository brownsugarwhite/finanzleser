/**
 * update-vergleich-descriptions.js
 *
 * Schreibt für jeden Vergleich (CPT „vergleich") einen kurzen, SEO-orientierten
 * Beschreibungstext (2 Sätze) in das WordPress-Excerpt. Der Text wird im Frontend
 * unter der Tool-Überschrift angezeigt (via /api/tool-title → REST-Excerpt).
 *
 * Ziel ist STAGING (dort liegen die aktuellen Inhalte, die das Frontend liest).
 *
 * Usage:
 *   WP_URL=https://staging.finanzleser.de \
 *   WP_USER="<user>" WP_APP_PASSWORD="<app-password>" \
 *   node scripts/update-vergleich-descriptions.js
 *
 * Das App-Password ist das WordPress-Application-Password des Staging-Users
 * (Profil → Anwendungspasswörter). Leerzeichen im App-Password sind ok.
 */

const BASE_URL = (process.env.WP_URL || "https://staging.finanzleser.de").replace(/\/$/, "");
const WP_USER = process.env.WP_USER || "";
const WP_PASS = process.env.WP_APP_PASSWORD || process.env.WP_PASS || "";

if (!WP_USER || !WP_PASS) {
  console.error("Fehlt: WP_USER und WP_APP_PASSWORD (Staging-App-Password) als Env setzen.");
  process.exit(1);
}

const AUTH_HEADER =
  "Basic " + Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");

// ---------------------------------------------------------------------------
// Beschreibungen je Vergleich (Slug → ~2 Sätze, sachlich, SEO-abgestimmt)
// ---------------------------------------------------------------------------

const vergleiche = [
  {
    slug: "private-haftpflichtversicherung-vergleich",
    description: `Vergleichen Sie private Haftpflichtversicherungen und finden Sie den passenden Schutz vor den finanziellen Folgen selbst verursachter Schäden. Achten Sie auf hohe Deckungssummen, Best-Leistungs-Garantie und faire Beiträge für Singles, Paare und Familien.`,
  },
  {
    slug: "festgeldvergleich",
    description: `Vergleichen Sie aktuelle Festgeld-Zinsen verschiedener Banken und sichern Sie sich über die gewählte Laufzeit eine planbare, garantierte Rendite. Finden Sie das beste Angebot mit attraktivem Zinssatz und europäischer Einlagensicherung.`,
  },
  {
    slug: "tagesgeldvergleich",
    description: `Vergleichen Sie Tagesgeldkonten und finden Sie die höchsten Zinsen bei voller Flexibilität und täglicher Verfügbarkeit Ihres Guthabens. Ideal, um Rücklagen sicher und verzinst zu parken – inklusive Einlagensicherung.`,
  },
  {
    slug: "autokredit-vergleich",
    description: `Vergleichen Sie Autokredite und finanzieren Sie Ihr neues oder gebrauchtes Fahrzeug zu günstigen Effektivzinsen. Finden Sie die passende Rate und sparen Sie als Barzahler oft beim Kaufpreis im Autohaus.`,
  },
  {
    slug: "ratenkredit-vergleich",
    description: `Vergleichen Sie Ratenkredite verschiedener Banken und sichern Sie sich niedrige Zinsen für Anschaffung, Umschuldung oder Ausgleich des Dispos. Finden Sie die passende Laufzeit und Monatsrate für Ihr Budget.`,
  },
  {
    slug: "bausparen-vergleich",
    description: `Vergleichen Sie Bauspartarife und sichern Sie sich schon heute günstige Zinsen für die spätere Baufinanzierung oder Modernisierung. Finden Sie den passenden Tarif für Vermögensaufbau und staatliche Förderung.`,
  },
  {
    slug: "baufinanzierung-vergleich",
    description: `Vergleichen Sie Baufinanzierungen und sichern Sie sich günstige Zinsen für den Kauf oder Bau Ihrer Immobilie. Finden Sie die optimale Kombination aus Zinsbindung, Tilgung und Monatsrate für Ihr Vorhaben.`,
  },
  {
    slug: "private-krankenversicherung-vergleich",
    description: `Vergleichen Sie private Krankenversicherungen und finden Sie den passenden Tarif mit umfangreichen Leistungen und stabilem Beitrag. Ideal für Selbstständige, Beamte und gut verdienende Angestellte über der Versicherungspflichtgrenze.`,
  },
  {
    slug: "gaspreisvergleich",
    description: `Vergleichen Sie Gasanbieter und Tarife in Ihrer Region und senken Sie Ihre jährlichen Heizkosten spürbar. Wechseln Sie schnell und unkompliziert zum günstigsten Gasversorger mit fairer Preisgarantie.`,
  },
  {
    slug: "strompreisvergleich",
    description: `Vergleichen Sie Stromanbieter und Tarife in Ihrer Region und sichern Sie sich die niedrigsten Strompreise. Wechseln Sie bequem zum günstigsten Versorger – auf Wunsch mit Ökostrom und Preisgarantie.`,
  },
  {
    slug: "risikolebensversicherung-vergleich",
    description: `Vergleichen Sie Risikolebensversicherungen und sichern Sie Ihre Familie für den Todesfall finanziell ab. Finden Sie hohe Versicherungssummen zu günstigen Beiträgen – besonders wichtig für Familien und Immobilienkredite.`,
  },
  {
    slug: "reisekrankenversicherung-vergleich",
    description: `Vergleichen Sie Auslandsreise-Krankenversicherungen und reisen Sie weltweit mit zuverlässigem Schutz vor hohen Behandlungs- und Rücktransportkosten. Finden Sie günstige Jahres- und Einmaltarife für Familien und Vielreisende.`,
  },
  {
    slug: "fahrradversicherung-vergleich",
    description: `Vergleichen Sie Fahrrad- und E-Bike-Versicherungen und schützen Sie Ihr Rad vor Diebstahl, Vandalismus und Reparaturkosten. Finden Sie den passenden Tarif mit Schutz auch für teure Pedelecs und Zubehör.`,
  },
  {
    slug: "haus-und-grundbesitzerhaftpflicht-vergleich",
    description: `Vergleichen Sie Haus- und Grundbesitzerhaftpflichtversicherungen und sichern Sie sich als Eigentümer gegen Schadenersatzansprüche Dritter ab. Unverzichtbar für vermietete Immobilien und unbebaute Grundstücke.`,
  },
  {
    slug: "unfallversicherung-vergleich",
    description: `Vergleichen Sie private Unfallversicherungen und sichern Sie sich rund um die Uhr gegen die finanziellen Folgen von Unfällen in Beruf und Freizeit ab. Finden Sie passende Invaliditätssummen und Leistungen für die ganze Familie.`,
  },
  {
    slug: "gebaeudeversicherung-vergleich",
    description: `Vergleichen Sie Wohngebäudeversicherungen und schützen Sie Ihr Haus vor den Kosten durch Feuer, Sturm, Hagel und Leitungswasser. Finden Sie den passenden Tarif mit sinnvollen Zusatzbausteinen wie Elementarschadenschutz.`,
  },
  {
    slug: "rechtsschutzversicherung-vergleich",
    description: `Vergleichen Sie Rechtsschutzversicherungen und sichern Sie sich gegen hohe Anwalts-, Gerichts- und Gutachterkosten ab. Finden Sie den passenden Schutz für Privat, Beruf, Verkehr und Wohnen mit kurzen Wartezeiten.`,
  },
  {
    slug: "hausratversicherung-vergleich",
    description: `Vergleichen Sie Hausratversicherungen und schützen Sie Ihr Inventar vor Schäden durch Einbruch, Feuer, Leitungswasser und Sturm. Finden Sie den passenden Tarif mit ausreichender Versicherungssumme und sinnvollen Zusatzleistungen.`,
  },
  {
    slug: "kfz-versicherung-vergleich",
    description: `Vergleichen Sie Kfz-Versicherungen und sparen Sie bei Haftpflicht, Teil- und Vollkasko für Ihr Fahrzeug. Finden Sie den günstigsten Tarif mit den passenden Leistungen und wechseln Sie einfach zum besseren Angebot.`,
  },
  {
    slug: "rentenversicherung-vergleich",
    description: `Vergleichen Sie private Rentenversicherungen und schließen Sie Ihre Versorgungslücke für einen finanziell sicheren Ruhestand. Finden Sie den passenden Tarif mit attraktiver Rendite, Flexibilität und steuerlichen Vorteilen.`,
  },
  {
    slug: "lebensversicherung-vergleich",
    description: `Vergleichen Sie Lebensversicherungen und verbinden Sie Hinterbliebenenschutz mit langfristigem Vermögensaufbau. Finden Sie den passenden Tarif für Ihre Absicherung und Altersvorsorge zu fairen Konditionen.`,
  },
  {
    slug: "photovoltaik-versicherung-vergleich",
    description: `Vergleichen Sie Photovoltaikversicherungen und schützen Sie Ihre Solaranlage vor Schäden durch Sturm, Hagel, Feuer und Diebstahl. Finden Sie den passenden Tarif inklusive Ertragsausfall-Schutz für eine sichere Investition.`,
  },
  {
    slug: "bussgeldrechner-vergleich",
    description: `Prüfen Sie Bußgelder, Punkte und Fahrverbote schnell anhand des aktuellen Bußgeldkatalogs. Verschaffen Sie sich einen Überblick über drohende Konsequenzen bei Verkehrsverstößen wie zu schnellem Fahren oder Abstandsverstößen.`,
  },
];

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_HEADER,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  console.log(`Updating ${vergleiche.length} Vergleich-Beschreibungen …`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User:     ${WP_USER}\n`);

  let success = 0;
  let failed = 0;

  for (const v of vergleiche) {
    try {
      const posts = await apiFetch(
        `/wp-json/wp/v2/vergleich?slug=${encodeURIComponent(v.slug)}`
      );
      if (!posts || posts.length === 0) {
        console.log(`⚠  SKIP  ${v.slug} — nicht gefunden`);
        failed++;
        continue;
      }
      const postId = posts[0].id;
      const updated = await apiFetch(`/wp-json/wp/v2/vergleich/${postId}`, {
        method: "POST",
        body: JSON.stringify({ excerpt: v.description }),
      });
      const got = (updated?.excerpt?.rendered || "").replace(/<[^>]+>/g, "").trim();
      if (!got) {
        console.log(`⚠  WARN  ${v.slug} (ID ${postId}) — Excerpt blieb leer (CPT unterstützt evtl. kein Excerpt?)`);
      } else {
        console.log(`✓  OK    ${v.slug} (ID ${postId})`);
      }
      success++;
    } catch (err) {
      console.log(`✗  FAIL  ${v.slug} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nFertig. ${success} aktualisiert, ${failed} fehlgeschlagen/übersprungen.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
