import { RATES } from "./rates";
import { rund } from "./utils";

export interface AltersteilzeitParams {
  monatsBrutto: number;
  alter: number;
}

export interface AltersteilzeitResult {
  teilzeitBrutto: number;
  aufstockung: number;
  gesamtTeilzeit: number;
  nettovergleich: number;
  alterBerechtigt: boolean;
}

export function berechne(
  { monatsBrutto, alter }: AltersteilzeitParams,
  rates = RATES
): AltersteilzeitResult {
  const r = rates.altersteilzeit;
  const teilzeitAnteil = r.teilzeit_anteil_prozent / 100; // 0.5

  // Teilzeit-Brutto = 50 % des Vollzeit-Brutto
  const teilzeitBrutto = rund(monatsBrutto * teilzeitAnteil);

  // Aufstockung = 20 % des Vollzeit-Brutto (typischer Tarifwert)
  const aufstockung = rund(monatsBrutto * 0.2);

  // Gesamt in der Teilzeit = Teilzeit-Brutto + Aufstockung
  const gesamtTeilzeit = rund(teilzeitBrutto + aufstockung);

  // Netto-Vergleich: vereinfachte SV-Pauschale ~20 %
  const svPauschale = 0.20;
  const vollzeitNetto = rund(monatsBrutto * (1 - svPauschale));
  const teilzeitNetto = rund(gesamtTeilzeit * (1 - svPauschale));
  const nettovergleich = rund(teilzeitNetto - vollzeitNetto);

  const alterBerechtigt = alter >= r.mindestalter_jahre;

  return {
    teilzeitBrutto,
    aufstockung,
    gesamtTeilzeit,
    nettovergleich,
    alterBerechtigt,
  };
}
