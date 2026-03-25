import ratesJson from "@/config/rates.json";
import { getRechnerConfig } from "@/lib/wordpress";
import { mergeRates } from "@/lib/calculators/utils";

/**
 * API Endpoint für dynamische Rechner-Konfiguration
 *
 * 1. Basis: config/rates.json (2026 Defaultwerte)
 * 2. Merge: WordPress ACF Overrides (wenn vorhanden)
 * 3. Rückgabe: Vollständige Rates-Konfiguration
 *
 * Cache: 1 Stunde (wird bei Netlify Build geflusht)
 * Fallback: RATES-Default bei Fehler
 */

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  try {
    const baseRates = ratesJson;

    // Versuche WordPress-Overrides zu laden
    // Bei Fehler/nicht-vorhanden: nur JSON-Defaults
    let wpConfig = null;
    try {
      wpConfig = await getRechnerConfig();
    } catch (wpError) {
      // WordPress nicht verfügbar oder ACF nicht konfiguriert
      // → Fallback auf JSON-Defaults
      console.warn("WordPress config not available, using JSON defaults:", wpError);
    }

    // Merge: WordPress-Werte überschreiben JSON-Defaults
    const mergedRates = wpConfig ? mergeRates(baseRates, wpConfig as Record<string, unknown>) : baseRates;

    return Response.json(mergedRates, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error in /api/rates:", error);
    // Fallback: leeres Objekt (Hook wird RATES-Default nutzen)
    return Response.json({}, { status: 500 });
  }
}
