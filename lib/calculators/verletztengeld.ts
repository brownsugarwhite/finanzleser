/**
 * Verletztengeld-Rechner 2026
 * Berechnet Verletztengeld nach §§45–52 SGB VII.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface VerletztengeldParams {
  monatsBrutto: number;
  monatsNetto: number;
}

export interface VerletztengeldResult {
  monatsBrutto: number;
  bruttoBegrenzt: number;
  istBegrenzt: boolean;
  regelentgeltTaeglich: number;
  vgBruttoTaeglich: number;
  nettoTaeglich: number;
  vgTaeglich: number;
  vgWoechentlich: number;
  vgMonatlich: number;
}

export function berechne(
  params: VerletztengeldParams,
  rates: RatesType = RATES
): VerletztengeldResult {
  const { monatsBrutto, monatsNetto } = params;
  const r = rates.verletztengeld;

  const bruttoBegrenzt = Math.min(monatsBrutto, r.jav_hoechst_monat);
  const istBegrenzt = monatsBrutto > r.jav_hoechst_monat;
  const regelentgeltTaeglich = rund(bruttoBegrenzt / 30);
  const vgBruttoTaeglich = rund(regelentgeltTaeglich * r.satz_prozent / 100);
  const nettoTaeglich = rund(monatsNetto / 30);
  const vgTaeglich = rund(Math.min(vgBruttoTaeglich, nettoTaeglich));
  const vgWoechentlich = rund(vgTaeglich * 7);
  const vgMonatlich = rund(vgTaeglich * 30);

  return { monatsBrutto, bruttoBegrenzt, istBegrenzt, regelentgeltTaeglich, vgBruttoTaeglich, nettoTaeglich, vgTaeglich, vgWoechentlich, vgMonatlich };
}
