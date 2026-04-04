/**
 * Krankengeld-Rechner 2026
 * Berechnet Krankengeld nach §47 SGB V.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface KrankengeldParams {
  monatsBrutto: number;
  monatsNetto: number;
}

export interface KrankengeldResult {
  monatsBrutto: number;
  bruttoBegrenzt: number;
  istBegrenzt: boolean;
  regelentgeltTaeglich: number;
  kgBruttoTaeglich: number;
  kgNettoGrenze: number;
  kgTaeglich: number;
  kgWoechentlich: number;
  kgMonatlich: number;
  maxBezugsdauerWochen: number;
}

export function berechne(
  params: KrankengeldParams,
  rates: RatesType = RATES
): KrankengeldResult {
  const { monatsBrutto, monatsNetto } = params;
  const r = rates.krankengeld;
  const bbgKV = rates.beitragsbemessungsgrenzen.kranken_pflege.monatlich;

  const bruttoBegrenzt = Math.min(monatsBrutto, bbgKV);
  const istBegrenzt = monatsBrutto > bbgKV;
  const regelentgeltTaeglich = rund(bruttoBegrenzt / 30);
  const kgBruttoTaeglich = rund(regelentgeltTaeglich * r.satz_brutto_prozent / 100);
  const kgNettoGrenze = rund((monatsNetto / 30) * r.netto_grenze_prozent / 100);
  const kgTaeglich = rund(Math.min(kgBruttoTaeglich, kgNettoGrenze));
  const kgWoechentlich = rund(kgTaeglich * 7);
  const kgMonatlich = rund(kgTaeglich * 30);

  return {
    monatsBrutto,
    bruttoBegrenzt,
    istBegrenzt,
    regelentgeltTaeglich,
    kgBruttoTaeglich,
    kgNettoGrenze,
    kgTaeglich,
    kgWoechentlich,
    kgMonatlich,
    maxBezugsdauerWochen: r.max_bezugsdauer_wochen,
  };
}
