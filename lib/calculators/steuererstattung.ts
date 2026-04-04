/**
 * Steuererstattungsrechner 2026
 * Berechnet die voraussichtliche Steuererstattung basierend auf Abzügen.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt } from "./shared/estg32a";
import { berechneSoli } from "./shared/soli";

type RatesType = typeof RATES;

export interface SteuererstattungParams {
  jahresBrutto: number;
  gezahlteLohnsteuer: number;
  gezahlterSoli: number;
  werbungskostenTatsaechlich: number;
  homeofficeTage: number;
  sonderausgabenTatsaechlich: number;
  aussergewoehnlicheBelastungen: number;
  handwerkerkosten: number; // Lohnkosten für §35a
}

export interface SteuererstattungResult {
  jahresBrutto: number;
  // Abzüge
  werbungskosten: number; // tatsächlich oder Pauschale
  homeofficePauschale: number;
  sonderausgaben: number;
  aussergewoehnlicheBelastungen: number;
  // zvE & Steuer
  zvE: number;
  estSoll: number;
  soliSoll: number;
  // Handwerkerleistungen §35a
  handwerkerErmaessigung: number;
  // Erstattung
  erstattungESt: number;
  erstattungSoli: number;
  erstattungGesamt: number;
  istErstattung: boolean;
}

export function berechne(
  params: SteuererstattungParams,
  rates: RatesType = RATES
): SteuererstattungResult {
  const {
    jahresBrutto,
    gezahlteLohnsteuer,
    gezahlterSoli,
    werbungskostenTatsaechlich,
    homeofficeTage,
    sonderausgabenTatsaechlich,
    aussergewoehnlicheBelastungen,
    handwerkerkosten,
  } = params;

  const r = rates.steuererstattung;

  // Homeoffice-Pauschale
  const tage = Math.min(homeofficeTage, r.homeoffice_max_tage);
  const homeofficePauschale = Math.min(tage * r.homeoffice_pauschale_je_tag, r.homeoffice_max_jahr);

  // Werbungskosten: Maximum aus Pauschale und tatsächlichen Kosten
  const wkGesamt = werbungskostenTatsaechlich + homeofficePauschale;
  const werbungskosten = Math.max(wkGesamt, rates.lohnsteuer.arbeitnehmer_pauschbetrag);

  // Sonderausgaben
  const sonderausgaben = Math.max(sonderausgabenTatsaechlich, rates.lohnsteuer.sonderausgaben_pauschbetrag);

  // zvE
  const zvE = Math.max(0, Math.floor(jahresBrutto - werbungskosten - sonderausgaben - aussergewoehnlicheBelastungen));

  // ESt
  const estSoll = berechneESt(zvE, rates);
  const soliSoll = berechneSoli(estSoll, false, rates);

  // Handwerkerleistungen §35a: 20% der Lohnkosten, max 1.200€ Ermäßigung
  const hwErmaessigung = Math.min(
    rund(handwerkerkosten * r.handwerker_ermaessigung_prozent / 100),
    r.handwerker_max_ermaessigung
  );

  // ESt nach Ermäßigung
  const estNachErmaessigung = Math.max(0, estSoll - hwErmaessigung);

  // Erstattung = Gezahlt - Soll
  const erstattungESt = rund(gezahlteLohnsteuer - estNachErmaessigung);
  const erstattungSoli = rund(gezahlterSoli - soliSoll);
  const erstattungGesamt = rund(erstattungESt + erstattungSoli);

  return {
    jahresBrutto,
    werbungskosten,
    homeofficePauschale,
    sonderausgaben,
    aussergewoehnlicheBelastungen,
    zvE,
    estSoll: estNachErmaessigung,
    soliSoll,
    handwerkerErmaessigung: hwErmaessigung,
    erstattungESt,
    erstattungSoli,
    erstattungGesamt,
    istErstattung: erstattungGesamt > 0,
  };
}
