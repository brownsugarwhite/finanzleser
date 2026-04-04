/**
 * ALG I Rechner 2026
 * Berechnet Arbeitslosengeld I nach §§147, 149–153 SGB III.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface Alg1Params {
  monatsBrutto: number;
  steuerklasse: number;
  hatKinder: boolean;
  versicherungsmonate: number;
  alter: number;
}

export interface Alg1Result {
  bemessungsentgelt: number;
  bemessungsentgeltBegrenzt: boolean;
  svPauschale: number;
  lstPauschale: number;
  leistungsentgeltTaeglich: number;
  leistungsentgeltMonatlich: number;
  satzProzent: number;
  algTaeglich: number;
  algMonatlich: number;
  bezugsdauerMonate: number;
  gesamtbetrag: number;
}

function getLstPauschale(sk: number): number {
  if (sk === 3) return 0.08;
  if (sk === 5 || sk === 6) return 0.25;
  if (sk === 2) return 0.12;
  return 0.14;
}

export function berechne(
  params: Alg1Params,
  rates: RatesType = RATES
): Alg1Result {
  const { monatsBrutto, steuerklasse, hatKinder, versicherungsmonate, alter } = params;
  const r = rates.alg1;

  const bbg = r.bbg_alv_monatlich;
  const bemessungsentgelt = Math.min(monatsBrutto, bbg);
  const bemessungsentgeltBegrenzt = monatsBrutto > bbg;

  const svProzent = r.sv_pauschale_an_prozent;
  const svAbzug = rund(bemessungsentgelt * svProzent / 100);

  const lstProzent = getLstPauschale(steuerklasse);
  const lstAbzug = rund(bemessungsentgelt * lstProzent);

  const leistungsentgeltMonatlich = rund(bemessungsentgelt - svAbzug - lstAbzug);
  const leistungsentgeltTaeglich = rund(leistungsentgeltMonatlich / 30);

  const satzProzent = hatKinder ? r.leistungssatz_mit_kind_prozent : r.leistungssatz_ohne_kind_prozent;

  const algTaeglich = rund(leistungsentgeltTaeglich * satzProzent / 100);
  const algMonatlich = rund(algTaeglich * 30);

  let bezugsdauerMonate = 0;
  for (const stufe of r.anspruchsdauer) {
    if (versicherungsmonate >= stufe.versicherungsmonate && alter >= stufe.alter_mind) {
      bezugsdauerMonate = stufe.dauer_monate;
    }
  }

  const gesamtbetrag = rund(algMonatlich * bezugsdauerMonate);

  return {
    bemessungsentgelt,
    bemessungsentgeltBegrenzt,
    svPauschale: svAbzug,
    lstPauschale: lstAbzug,
    leistungsentgeltTaeglich,
    leistungsentgeltMonatlich,
    satzProzent,
    algTaeglich,
    algMonatlich,
    bezugsdauerMonate,
    gesamtbetrag,
  };
}
