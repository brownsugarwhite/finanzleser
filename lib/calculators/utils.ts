/**
 * Runden auf 2 Dezimalstellen
 * z.B. rund(123.456) → 123.46
 */
export function rund(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Formatieren als Euro mit Tausendertrennzeichen
 * z.B. euro(1234.56) → "1.234,56 €"
 */
export function euro(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/**
 * Merge WordPress ACF Overrides into base rates
 * WordPress-Werte (wenn definiert) überschreiben JSON-Defaults
 *
 * Mapping: ACF-Keys → rates.json Pfade
 * rc_mindestlohn → arbeitsmarkt.mindestlohn
 * rc_kindergeld → sozialhilfe.kindergeld
 * rc_rentenwert → rente.rentenwert
 * rc_rv_an → sozialversicherung.rentenversicherung_arbeitnehmer
 * rc_kv_an → sozialversicherung.krankenversicherung_arbeitnehmer
 * etc.
 */
export function mergeRates(
  baseRates: Record<string, unknown>,
  wpOverrides: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!wpOverrides) return baseRates;

  const merged = JSON.parse(JSON.stringify(baseRates)) as Record<string, unknown>; // Deep clone

  // Mapping: ACF-Keys → Pfade in rates.json
  const mapping: Record<string, string> = {
    rc_mindestlohn: "arbeitsmarkt.mindestlohn",
    rc_kindergeld: "sozialhilfe.kindergeld",
    rc_rentenwert: "rente.rentenwert",
    rc_rv_an: "sozialversicherung.rentenversicherung_arbeitnehmer",
    rc_kv_an: "sozialversicherung.krankenversicherung_arbeitnehmer",
    rc_kv_zusatz: "sozialversicherung.krankenversicherung_zusatzbeitrag",
    rc_pv_kinderlos: "sozialversicherung.pflegeversicherung_kinderlos",
    rc_alv_an: "sozialversicherung.arbeitslosenversicherung_arbeitnehmer",
    rc_grundfreibetrag: "lohnsteuer.grundfreibetrag",
    rc_bbg_kv: "sozialversicherung.beitragssatzbasis_kv",
    rc_bbg_rv: "sozialversicherung.beitragssatzbasis_rv",
    rc_elterngeld_min: "elterngeld.minimum",
    rc_elterngeld_max: "elterngeld.maximum",
  };

  // Apply overrides
  Object.entries(mapping).forEach(([acfKey, path]) => {
    const value = wpOverrides[acfKey];
    if (value !== undefined && value !== null) {
      const keys = path.split(".");
      let current = merged as Record<string, unknown>;

      // Navigate to parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      // Set final value
      current[keys[keys.length - 1]] = value;
    }
  });

  return merged;
}
