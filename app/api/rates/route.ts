import ratesJson from "@/config/rates.json";

/**
 * API Endpoint für dynamische Rechner-Konfiguration
 *
 * Gibt aktuelle Rates aus config/rates.json zurück
 * Später: Merged mit WordPress ACF Options
 *
 * Cache: 1 Stunde (wird bei Netlify Build geflusht)
 */

export const revalidate = 3600; // 1 hour cache

export async function GET() {
  try {
    // Momentan: nur JSON
    // Später: merge mit getRechnerConfig() von WordPress
    const rates = ratesJson;

    return Response.json(rates, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    // Fallback: leeres Objekt (Hook wird RATES-Default nutzen)
    return Response.json({}, { status: 500 });
  }
}
