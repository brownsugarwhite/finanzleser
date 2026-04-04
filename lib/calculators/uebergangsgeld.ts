/**
 * Übergangsgeld-Rechner 2026
 * Berechnet Übergangsgeld nach §§20–21 SGB VI / §§49–52 SGB IX.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface UebergangsgeldParams {
  monatsBrutto: number;
  hatKind: boolean;
}

export interface UebergangsgeldResult {
  monatsBrutto: number;
  bruttoBegrenzt: number;
  istBegrenzt: boolean;
  nettoStandardisiert: number;
  nettoTaeglich: number;
  satzProzent: number;
  uebergangsgeldTaeglich: number;
  uebergangsgeldMonatlich: number;
}

export function berechne(
  params: UebergangsgeldParams,
  rates: RatesType = RATES
): UebergangsgeldResult {
  const { monatsBrutto, hatKind } = params;
  const r = rates.uebergangsgeld;
  const bbgRV = rates.beitragsbemessungsgrenzen.renten_arbeitslosen.monatlich;
  const svPauschale = rates.alg1.sv_pauschale_an_prozent;

  const bruttoBegrenzt = Math.min(monatsBrutto, bbgRV);
  const istBegrenzt = monatsBrutto > bbgRV;

  // Netto standardisiert (SV-Pauschale abziehen)
  const nettoStandardisiert = rund(bruttoBegrenzt * (1 - svPauschale / 100));
  const nettoTaeglich = rund(nettoStandardisiert / 30);

  const satzProzent = hatKind ? r.satz_mit_kind_prozent : r.satz_ohne_kind_prozent;

  const uebergangsgeldTaeglich = rund(nettoTaeglich * satzProzent / 100);
  const uebergangsgeldMonatlich = rund(uebergangsgeldTaeglich * 30);

  return {
    monatsBrutto,
    bruttoBegrenzt,
    istBegrenzt,
    nettoStandardisiert,
    nettoTaeglich,
    satzProzent,
    uebergangsgeldTaeglich,
    uebergangsgeldMonatlich,
  };
}
