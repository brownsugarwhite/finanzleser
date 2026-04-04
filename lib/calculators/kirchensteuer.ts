/**
 * Kirchensteuerrechner 2026
 * Berechnet Kirchensteuer basierend auf Einkommensteuer und Bundesland.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { getKirchensteuersatz } from "./shared/kirchensteuer";

type RatesType = typeof RATES;

export interface KirchensteuerParams {
  lohnsteuerJahr: number;
  bundesland: string;
}

export interface KirchensteuerResult {
  lohnsteuerJahr: number;
  bundesland: string;
  satzProzent: number;
  kirchensteuerJahr: number;
  kirchensteuerMonat: number;
}

export function berechne(
  params: KirchensteuerParams,
  rates: RatesType = RATES
): KirchensteuerResult {
  const { lohnsteuerJahr, bundesland } = params;

  const satz = getKirchensteuersatz(bundesland, rates);
  const kirchensteuerJahr = rund(lohnsteuerJahr * satz / 100);
  const kirchensteuerMonat = rund(kirchensteuerJahr / 12);

  return {
    lohnsteuerJahr,
    bundesland,
    satzProzent: satz,
    kirchensteuerJahr,
    kirchensteuerMonat,
  };
}
