/**
 * Solidaritätszuschlag-Berechnung
 * Alle Werte aus RATES.solidaritaetszuschlag
 */

import { RATES } from "../rates";
import { rund } from "../utils";

type RatesType = typeof RATES;

/**
 * Berechnet den Solidaritätszuschlag.
 * Berücksichtigt Freigrenze und Milderungszone.
 *
 * @param est - Einkommensteuer (Jahresbetrag)
 * @param isSplitting - true bei Zusammenveranlagung (Steuerklasse III)
 */
export function berechneSoli(
  est: number,
  isSplitting: boolean = false,
  rates: RatesType = RATES
): number {
  const soli = rates.solidaritaetszuschlag;
  const freigrenze = isSplitting ? soli.freigrenze_zusammenveranlagt : soli.freigrenze_einzeln;

  if (est <= freigrenze) return 0;

  // Voller Soli
  const vollerSoli = rund(est * soli.satz_prozent / 100);

  // Milderungszone: Soli darf maximal 11,9% des Überschreitungsbetrags sein
  const milderung = rund((est - freigrenze) * soli.milderungszone_faktor_prozent / 100);

  return Math.min(vollerSoli, milderung);
}
