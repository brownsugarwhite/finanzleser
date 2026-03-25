import { RATES } from "./rates";
import { rund } from "./utils";

export interface MindestlohnParams {
  stundenlohn: number;
  stunden_woche: number;
}

export interface MindestlohnResult {
  stundenlohn: number;
  stunden_woche: number;
  stunden_monat: number;
  brutto_monat: number;
  mindest_monat: number;
  differenz: number;
  eingehalten: boolean;
}

export function berechne(
  { stundenlohn, stunden_woche }: MindestlohnParams,
  rates: typeof RATES = RATES
): MindestlohnResult {
  const mindestlohn_stunde = rates.mindestlohn?.stundensatz || 13.9;
  const wochen_monat = 4.348;

  const stunden_monat = rund(stunden_woche * wochen_monat);
  const brutto_monat = rund(stundenlohn * stunden_woche * wochen_monat);
  const mindest_monat = rund(mindestlohn_stunde * stunden_woche * wochen_monat);
  const differenz = rund(brutto_monat - mindest_monat);
  const eingehalten = stundenlohn >= mindestlohn_stunde;

  return {
    stundenlohn,
    stunden_woche,
    stunden_monat,
    brutto_monat,
    mindest_monat,
    differenz,
    eingehalten
  };
}
