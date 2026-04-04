import { rund } from "./utils";

export interface HeizkostenParams {
  wohnflaeche: number;
  energietraeger: "gas" | "oel" | "fernwaerme" | "waermepumpe";
  verbrauchKwh: number; // 0 = auto-calc from flaeche
}

export interface HeizkostenResult {
  jahresverbrauch: number;
  kostenJahr: number;
  kostenMonat: number;
  co2Ausstoss: number; // kg CO2/Jahr
}

// TODO: Rates spaeter aus rates.json importieren, sobald dort eine heizkosten-Section existiert
const HEIZKOSTEN_DEFAULTS = {
  /** Durchschnittlicher Verbrauch kWh pro m2 und Jahr */
  verbrauch_kwh_m2: {
    gas: 140,
    oel: 150,
    fernwaerme: 100,
    waermepumpe: 40,
  },
  /** Kosten in Cent pro kWh (Durchschnitt Deutschland 2026) */
  kosten_ct_kwh: {
    gas: 12.5,
    oel: 11.0,
    fernwaerme: 14.0,
    waermepumpe: 30.0, // Strom fuer WP
  },
  /** CO2-Emissionsfaktor in g pro kWh */
  co2_g_kwh: {
    gas: 201,
    oel: 266,
    fernwaerme: 130,
    waermepumpe: 80, // abhaengig vom Strommix
  },
} as const;

export function berechne({
  wohnflaeche,
  energietraeger,
  verbrauchKwh,
}: HeizkostenParams): HeizkostenResult {
  const d = HEIZKOSTEN_DEFAULTS;

  // Jahresverbrauch: manuell oder automatisch aus Flaeche
  const jahresverbrauch =
    verbrauchKwh > 0
      ? verbrauchKwh
      : Math.round(wohnflaeche * d.verbrauch_kwh_m2[energietraeger]);

  const kostenJahr = rund(
    (jahresverbrauch * d.kosten_ct_kwh[energietraeger]) / 100
  );
  const kostenMonat = rund(kostenJahr / 12);

  const co2Ausstoss = rund(
    (jahresverbrauch * d.co2_g_kwh[energietraeger]) / 1000
  );

  return {
    jahresverbrauch,
    kostenJahr,
    kostenMonat,
    co2Ausstoss,
  };
}
