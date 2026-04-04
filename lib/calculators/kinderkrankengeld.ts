/**
 * Kinderkrankengeld-Rechner 2026
 * Berechnet Kinderkrankengeld nach §45 SGB V.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface KinderkrankengeldParams {
  monatsBrutto: number;
  monatsNetto: number;
  anzahlKinder: number;
  alleinerziehend: boolean;
  bereitsGenutzteTage: number;
}

export interface KinderkrankengeldResult {
  kgTaeglich: number;
  kgBruttoTaeglich: number;
  kgNettoGrenze: number;
  jahresanspruchTage: number;
  verbleibendeTage: number;
  gesamtbetrag: number;
  bruttoBegrenzt: number;
  istBegrenzt: boolean;
}

export function berechne(
  params: KinderkrankengeldParams,
  rates: RatesType = RATES
): KinderkrankengeldResult {
  const { monatsBrutto, monatsNetto, anzahlKinder, alleinerziehend, bereitsGenutzteTage } = params;
  const r = rates.kinderkrankengeld;
  const bbgKV = rates.beitragsbemessungsgrenzen.kranken_pflege.monatlich;

  const bruttoBegrenzt = Math.min(monatsBrutto, bbgKV);
  const istBegrenzt = monatsBrutto > bbgKV;
  const regelentgeltTaeglich = rund(bruttoBegrenzt / 30);
  const kgBruttoTaeglich = rund(regelentgeltTaeglich * r.satz_brutto_prozent / 100);
  const kgNettoGrenze = rund((monatsNetto / 30) * r.netto_grenze_prozent / 100);
  const kgTaeglich = rund(Math.min(kgBruttoTaeglich, kgNettoGrenze));

  const at = r.anspruchstage_2026;
  let jahresanspruchTage: number;
  if (alleinerziehend) {
    jahresanspruchTage = Math.min(at.alleinerziehend_je_kind * anzahlKinder, at.alleinerziehend_max);
  } else if (anzahlKinder >= 3) {
    jahresanspruchTage = Math.min(at.je_elternteil_je_kind_ab3_kindern * anzahlKinder, at.max_je_elternteil_ab3_kindern);
  } else {
    jahresanspruchTage = Math.min(at.je_elternteil_je_kind * anzahlKinder, at.max_je_elternteil);
  }

  const verbleibendeTage = Math.max(0, jahresanspruchTage - bereitsGenutzteTage);
  const gesamtbetrag = rund(kgTaeglich * verbleibendeTage);

  return { kgTaeglich, kgBruttoTaeglich, kgNettoGrenze, jahresanspruchTage, verbleibendeTage, gesamtbetrag, bruttoBegrenzt, istBegrenzt };
}
