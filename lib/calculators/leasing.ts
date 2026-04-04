import { RATES } from "./rates";
import { rund } from "./utils";

export interface LeasingParams {
  kaufpreis: number;
  laufzeitMonate: number;
  restwertProzent: number;
  zinssatzPa: number;
  anzahlung: number;
}

export interface LeasingResult {
  leasingrate: number;
  gesamtKosten: number;
  restwert: number;
  zinskosten: number;
}

export function berechne(
  { kaufpreis, laufzeitMonate, restwertProzent, zinssatzPa, anzahlung }: LeasingParams,
  rates: typeof RATES = RATES
): LeasingResult {
  const restwert = rund(kaufpreis * restwertProzent / 100);
  const finanzierungsbetrag = kaufpreis - anzahlung - restwert;

  const zinsMonat = zinssatzPa / 100 / 12;
  const n = laufzeitMonate;

  let leasingrate: number;
  if (zinsMonat === 0) {
    leasingrate = finanzierungsbetrag / n;
  } else {
    leasingrate =
      (finanzierungsbetrag * (zinsMonat * Math.pow(1 + zinsMonat, n))) /
      (Math.pow(1 + zinsMonat, n) - 1);
  }

  const gesamtKosten = rund(leasingrate * laufzeitMonate + anzahlung);
  const zinskosten = rund(gesamtKosten - finanzierungsbetrag - anzahlung);

  return {
    leasingrate: rund(leasingrate),
    gesamtKosten,
    restwert,
    zinskosten,
  };
}
