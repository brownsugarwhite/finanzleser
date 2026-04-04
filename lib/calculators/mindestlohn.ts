/**
 * Mindestlohn-Rechner 2026
 * Prüft Mindestlohn-Einhaltung und berechnet Monats-/Jahresgehalt.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

const WOCHEN_PRO_MONAT = 4.348;

export interface MindestlohnParams {
  stundenlohn: number;
  wochenstunden: number;
}

export interface MindestlohnResult {
  stundenlohn: number;
  mindestlohn: number;
  wochenstunden: number;
  monatsStunden: number;
  bruttoMonatlich: number;
  mindestlohnMonatlich: number;
  differenz: number;
  istKonform: boolean;
}

export function berechne(
  params: MindestlohnParams,
  rates: RatesType = RATES
): MindestlohnResult {
  const { stundenlohn, wochenstunden } = params;
  const mindestlohn = rates.mindestlohn.stundensatz;

  const monatsStunden = rund(wochenstunden * WOCHEN_PRO_MONAT);
  const bruttoMonatlich = rund(stundenlohn * monatsStunden);
  const mindestlohnMonatlich = rund(mindestlohn * monatsStunden);
  const differenz = rund(bruttoMonatlich - mindestlohnMonatlich);
  const istKonform = stundenlohn >= mindestlohn;

  return {
    stundenlohn,
    mindestlohn,
    wochenstunden,
    monatsStunden,
    bruttoMonatlich,
    mindestlohnMonatlich,
    differenz,
    istKonform,
  };
}
