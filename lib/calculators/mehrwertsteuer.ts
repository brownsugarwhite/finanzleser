/**
 * Mehrwertsteuerrechner 2026
 * Berechnet Netto, MwSt und Brutto in beide Richtungen.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface MehrwertsteuerParams {
  betrag: number;
  richtung: "netto" | "brutto"; // Eingabe ist Netto oder Brutto
  steuersatz: "regelsteuersatz" | "ermaessigt"; // 19% oder 7%
}

export interface MehrwertsteuerResult {
  netto: number;
  mwst: number;
  brutto: number;
  steuersatzProzent: number;
}

export function berechne(
  params: MehrwertsteuerParams,
  rates: RatesType = RATES
): MehrwertsteuerResult {
  const { betrag, richtung, steuersatz } = params;

  const satz = steuersatz === "ermaessigt"
    ? rates.mehrwertsteuer.ermaessigter_steuersatz_prozent
    : rates.mehrwertsteuer.regelsteuersatz_prozent;

  let netto: number;
  let brutto: number;
  let mwst: number;

  if (richtung === "netto") {
    netto = betrag;
    mwst = rund(netto * satz / 100);
    brutto = rund(netto + mwst);
  } else {
    brutto = betrag;
    netto = rund(brutto / (1 + satz / 100));
    mwst = rund(brutto - netto);
  }

  return {
    netto,
    mwst,
    brutto,
    steuersatzProzent: satz,
  };
}
