import { RATES } from "./rates";
import { rund, euro } from "./utils";

export interface PendlerpauschaleParams {
  entfernungKm: number;
  arbeitstage: number;
}

export interface PendlerpauschaleResult {
  pauschale: number;
  steuererstattungCa: number;
  km1Bis20: number;
  km21Plus: number;
  deckelt: boolean;
}

export function berechne(
  { entfernungKm, arbeitstage }: PendlerpauschaleParams,
  rates = RATES
): PendlerpauschaleResult {
  const r = rates.pendlerpauschale;
  const satzBis20 = r.pauschale_bis_20km;
  const satzAb21 = r.pauschale_ab_21km;
  const maxPkw = r.max_pauschale_pkw;

  // km 1-20 Anteil
  const km1Bis20 = Math.min(entfernungKm, 20) * satzBis20 * arbeitstage;

  // km 21+ Anteil
  const km21Plus =
    entfernungKm > 20
      ? (entfernungKm - 20) * satzAb21 * arbeitstage
      : 0;

  const pauschaleRoh = km1Bis20 + km21Plus;
  const deckelt = pauschaleRoh > maxPkw;
  const pauschale = Math.min(pauschaleRoh, maxPkw);

  // Durchschnittlicher Grenzsteuersatz ~30 %
  const steuererstattungCa = rund(pauschale * 0.3);

  return {
    pauschale: rund(pauschale),
    steuererstattungCa,
    km1Bis20: rund(km1Bis20),
    km21Plus: rund(km21Plus),
    deckelt,
  };
}
