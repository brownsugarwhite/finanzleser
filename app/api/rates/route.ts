import ratesJson from "@/config/rates.json";
import { cacheHeaders } from "@/lib/httpCache";
import { RECHNER_CONFIG_TAG } from "@/lib/cacheTags";

/**
 * API Endpoint für dynamische Rechner-Konfiguration
 * Lädt rates.json und merged mit WordPress-Overrides
 */

// Rechner-Konfiguration (Mindestlohn, BBG, Kindergeld …) ändert sich ~jährlich.
// Vorher 5s → WP wurde praktisch bei jedem Rechner-Seitenaufruf neu abgefragt
// (~3,9s Latenz). Jetzt 24h: der Save-Webhook bustet diese Route bei jeder
// finanzleser_rc_*-Änderung gezielt (app/api/revalidate), Aktualität ist also
// garantiert — das Intervall ist nur noch das Sicherheitsnetz.
export const revalidate = 86400;

export async function GET() {
  try {
    // Kopiere rates.json
    const rates = JSON.parse(JSON.stringify(ratesJson));

    // Versuche WordPress-Werte direkt zu laden
    try {
      const wpUrl = process.env.WORDPRESS_API_URL;
      if (wpUrl) {
        const baseUrl = wpUrl.replace('/graphql', '');
        // Tag zusätzlich zum Pfad: revalidatePath("/api/rates") bustet die Route,
        // aber auf den Data-Cache-Eintrag dieses Fetches ist bei 86400 kein Verlass.
        // Der Webhook revalidiert deshalb auch den Tag — sonst würde die Route zwar
        // neu rendern, aber die alte WP-Antwort wiederverwenden (Kindergeld & Co.
        // hingen bis zu 24 h fest).
        const response = await fetch(`${baseUrl}/wp-json/finanzleser/v1/rechner-config`, {
          next: { revalidate: 86400, tags: [RECHNER_CONFIG_TAG] },
        });
        if (response.ok) {
          const wpRates = await response.json();

          // Direktes Mapping: WordPress-Keys → rates.json Pfade
          if (wpRates.rc_mindestlohn) rates.mindestlohn.stundensatz = wpRates.rc_mindestlohn;
          if (wpRates.rc_kindergeld) rates.kindergeld.monatlich_je_kind = wpRates.rc_kindergeld;
          if (wpRates.rc_rentenwert) rates.rente.rentenwert_ab_01jul_2026 = wpRates.rc_rentenwert;
          if (wpRates.rc_rv_an) rates.sozialversicherung.rentenversicherung.arbeitnehmer_prozent = wpRates.rc_rv_an;
          if (wpRates.rc_kv_an) rates.sozialversicherung.krankenversicherung.allgemeiner_beitrag_an_prozent = wpRates.rc_kv_an;
          if (wpRates.rc_kv_zusatz) rates.sozialversicherung.krankenversicherung.durchschnittlicher_zusatzbeitrag_prozent = wpRates.rc_kv_zusatz;
          if (wpRates.rc_pv_kinderlos) rates.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern.kinderlos_ueber23 = wpRates.rc_pv_kinderlos;
          if (wpRates.rc_alv_an) rates.sozialversicherung.arbeitslosenversicherung.arbeitnehmer_prozent = wpRates.rc_alv_an;
          if (wpRates.rc_grundfreibetrag) rates.lohnsteuer.grundfreibetrag = wpRates.rc_grundfreibetrag;
          if (wpRates.rc_bbg_kv) rates.beitragsbemessungsgrenzen.kranken_pflege.monatlich = wpRates.rc_bbg_kv;
          if (wpRates.rc_bbg_rv) rates.beitragsbemessungsgrenzen.renten_arbeitslosen.monatlich = wpRates.rc_bbg_rv;
          if (wpRates.rc_elterngeld_min) rates.elterngeld.minimum = wpRates.rc_elterngeld_min;
          if (wpRates.rc_elterngeld_max) rates.elterngeld.maximum = wpRates.rc_elterngeld_max;
        }
      }
    } catch (wpError) {
      console.warn("Could not fetch WordPress config, using defaults");
    }

    return Response.json(rates, {
      headers: {
        "Content-Type": "application/json",
        ...cacheHeaders(3600, 3600),
      },
    });
  } catch (error) {
    console.error("Error in /api/rates:", error);
    return Response.json(ratesJson);
  }
}
