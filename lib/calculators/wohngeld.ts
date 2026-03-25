import { RATES } from "./rates";
import { rund } from "./utils";

export interface WohngeldParams {
  miete: number;
  haushaltsmitglieder: number;
}

export interface WohngeldResult {
  miete: number;
  haushaltsmitglieder: number;
  maxWohngeld: number;
  monatlich: number;
  jaehrlich: number;
}

export function berechne({ miete, haushaltsmitglieder }: WohngeldParams, rates: typeof RATES = RATES): WohngeldResult {
  // Vereinfachte Berechnung basierend auf Richtwert
  const baseSatz = 150; // Vereinfachter Richtwert
  const satzProPerson = 30;

  const maxWohngeld = rund(baseSatz + haushaltsmitglieder * satzProPerson);
  const monatlich = Math.min(rund(miete * 0.15), maxWohngeld); // Vereinfacht: 15% der Miete, max. Obergrenze

  return {
    miete,
    haushaltsmitglieder,
    maxWohngeld,
    monatlich,
    jaehrlich: rund(monatlich * 12),
  };
}
