import { RATES } from "./rates";
import { rund } from "./utils";

export interface StundenlohnParams {
  jahresgehalt: number;
  wochenstunden: number;
  urlaubstage: number;
  feiertage: number;
}

export interface StundenlohnResult {
  stundenlohn: number;
  monatsgehalt: number;
  arbeitstageJahr: number;
  arbeitsstundenJahr: number;
  ueberMindestlohn: boolean;
  differenzZuMindestlohn: number;
}

export function berechne(
  { jahresgehalt, wochenstunden, urlaubstage, feiertage }: StundenlohnParams,
  rates: typeof RATES = RATES
): StundenlohnResult {
  // Wochenendtage pro Jahr (ca. 104)
  const wochenenden = 104;
  const arbeitstageJahr = 365 - urlaubstage - feiertage - wochenenden;
  const arbeitsstundenJahr = rund(arbeitstageJahr * wochenstunden / 5);
  const stundenlohn = arbeitsstundenJahr > 0 ? rund(jahresgehalt / arbeitsstundenJahr) : 0;
  const monatsgehalt = rund(jahresgehalt / 12);

  const mindestlohn = rates.mindestlohn.stundensatz;
  const ueberMindestlohn = stundenlohn >= mindestlohn;
  const differenzZuMindestlohn = rund(stundenlohn - mindestlohn);

  return {
    stundenlohn,
    monatsgehalt,
    arbeitstageJahr,
    arbeitsstundenJahr,
    ueberMindestlohn,
    differenzZuMindestlohn,
  };
}
