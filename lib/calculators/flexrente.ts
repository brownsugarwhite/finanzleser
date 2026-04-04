/**
 * Flexrentenrechner 2026
 * Berechnet die Rente mit Zu- oder Abschlaegen bei vorzeitigem
 * oder spaeterem Renteneintritt (Flexirentengesetz).
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface FlexrenteParams {
  entgeltpunkte: number;
  monateVorher: number; // 0-60, Monate vor Regelaltersgrenze
  monateNachher: number; // 0-60, Monate nach Regelaltersgrenze
}

export interface FlexrenteResult {
  zugangsfaktor: number;
  renteMonatlich: number;
  abschlagProzent: number;
  zuschlagProzent: number;
}

export function berechne(
  params: FlexrenteParams,
  rates: RatesType = RATES
): FlexrenteResult {
  const { entgeltpunkte, monateVorher, monateNachher } = params;

  const rentenwert = rates.flexrente.rentenwert_west;
  const abschlagProMonat = rates.flexrente.abschlag_je_monat_prozent / 100;
  const zuschlagProMonat = rates.flexrente.zuschlag_je_monat_prozent / 100;
  const maxAbschlag = rates.flexrente.abschlag_max_prozent / 100;

  // Abschlag (vorzeitig) und Zuschlag (spaeter)
  const abschlag = Math.min(monateVorher * abschlagProMonat, maxAbschlag);
  const zuschlag = monateNachher * zuschlagProMonat;

  // Zugangsfaktor: 1.0 - Abschlag + Zuschlag
  const zugangsfaktor = rund(1.0 - abschlag + zuschlag);

  // Monatsrente = EP x Zugangsfaktor x Rentenwert
  const renteMonatlich = rund(entgeltpunkte * zugangsfaktor * rentenwert);

  const abschlagProzent = rund(abschlag * 100);
  const zuschlagProzent = rund(zuschlag * 100);

  return {
    zugangsfaktor,
    renteMonatlich,
    abschlagProzent,
    zuschlagProzent,
  };
}
