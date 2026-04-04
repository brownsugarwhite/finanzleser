/**
 * Teilzeit-Rechner 2026
 * Berechnet Teilzeitgehalt, Beschäftigungsart und Netto-Schätzung.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

const WOCHEN_PRO_MONAT = 4.348;

export type TeilzeitTyp = "minijob" | "midijob" | "regulaer";

export interface TeilzeitParams {
  stundenlohn: number;
  wochenstunden: number;
  vollzeitStundenWoche: number;
}

export interface TeilzeitResult {
  stundenlohn: number;
  wochenstunden: number;
  vollzeitStundenWoche: number;
  teilzeitProzent: number;
  monatsStunden: number;
  bruttoMonatlich: number;
  typ: TeilzeitTyp;
  nettoSchaetzung: number;
  mindestlohnKonform: boolean;
}

export function berechne(
  params: TeilzeitParams,
  rates: RatesType = RATES
): TeilzeitResult {
  const { stundenlohn, wochenstunden, vollzeitStundenWoche } = params;
  const r = rates.teilzeit;

  const monatsStunden = rund(wochenstunden * WOCHEN_PRO_MONAT);
  const bruttoMonatlich = rund(stundenlohn * monatsStunden);
  const teilzeitProzent = rund((wochenstunden / vollzeitStundenWoche) * 100);
  const mindestlohnKonform = stundenlohn >= r.mindestlohn_stunde;

  let typ: TeilzeitTyp;
  if (bruttoMonatlich <= r.minijob_grenze_monatlich) {
    typ = "minijob";
  } else if (bruttoMonatlich <= r.gleitzone_obergrenze_monatlich) {
    typ = "midijob";
  } else {
    typ = "regulaer";
  }

  // Netto-Schätzung (vereinfacht)
  const svAnProzent = rates.alg1.sv_pauschale_an_prozent;
  let nettoSchaetzung: number;
  if (typ === "minijob") {
    nettoSchaetzung = bruttoMonatlich; // keine Abzüge
  } else if (typ === "midijob") {
    nettoSchaetzung = rund(bruttoMonatlich * (1 - (svAnProzent / 100) * 0.5)); // reduziert
  } else {
    nettoSchaetzung = rund(bruttoMonatlich * (1 - svAnProzent / 100));
  }

  return {
    stundenlohn,
    wochenstunden,
    vollzeitStundenWoche,
    teilzeitProzent,
    monatsStunden,
    bruttoMonatlich,
    typ,
    nettoSchaetzung,
    mindestlohnKonform,
  };
}
