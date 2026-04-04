/**
 * Kirchensteuer-Berechnung
 * 8% in Bayern und Baden-Württemberg, 9% in allen anderen Bundesländern.
 * Alle Werte aus RATES.kirchensteuer.
 */

import { RATES } from "../rates";
import { rund } from "../utils";

type RatesType = typeof RATES;

/**
 * Berechnet die Kirchensteuer basierend auf der Einkommensteuer.
 *
 * @param est - Einkommensteuer (Jahresbetrag)
 * @param bundesland - Bundesland des Steuerpflichtigen
 * @param istMitglied - Kirchenmitglied ja/nein
 */
export function berechneKirchensteuer(
  est: number,
  bundesland: string,
  istMitglied: boolean,
  rates: RatesType = RATES
): number {
  if (!istMitglied || est <= 0) return 0;

  const satz = getKirchensteuersatz(bundesland, rates);
  return rund(est * satz / 100);
}

/**
 * Gibt den Kirchensteuersatz für ein Bundesland zurück (8 oder 9).
 */
export function getKirchensteuersatz(
  bundesland: string,
  rates: RatesType = RATES
): number {
  const kst = rates.kirchensteuer;
  if (kst.satz_8_prozent_bundeslaender.includes(bundesland)) {
    return 8;
  }
  return 9;
}

/**
 * Alle Bundesländer als Options-Array für Select-Felder.
 */
export const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

export const BUNDESLAENDER_OPTIONS = BUNDESLAENDER.map((bl) => ({
  label: bl,
  value: bl,
}));
