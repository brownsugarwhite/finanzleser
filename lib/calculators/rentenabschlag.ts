/**
 * Rentenabschlagrechner 2026
 * Berechnet den Abschlag bei vorzeitigem Rentenbezug.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface RentenabschlagParams {
  monatlicheRente: number; // Rente ohne Abschlag
  monate_frueher: number; // Monate vor Regelaltersgrenze (1-60)
}

export interface RentenabschlagResult {
  abschlagProzent: number;
  abschlagBetrag: number;
  renteNachAbschlag: number;
  verlustJaehrlich: number;
}

export function berechne(
  params: RentenabschlagParams,
  rates: RatesType = RATES
): RentenabschlagResult {
  const { monatlicheRente, monate_frueher } = params;

  const abschlagProMonat = rates.rentenabschlag.abschlag_pro_monat_prozent;
  const maxAbschlag = rates.rentenabschlag.max_abschlag_prozent;

  // Abschlag berechnen: 0,3% pro Monat, max 14,4%
  const abschlagProzent = rund(Math.min(monate_frueher * abschlagProMonat, maxAbschlag));

  // Abzug in Euro
  const abschlagBetrag = rund(monatlicheRente * abschlagProzent / 100);
  const renteNachAbschlag = rund(monatlicheRente - abschlagBetrag);
  const verlustJaehrlich = rund(abschlagBetrag * 12);

  return {
    abschlagProzent,
    abschlagBetrag,
    renteNachAbschlag,
    verlustJaehrlich,
  };
}
