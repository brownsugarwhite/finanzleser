/**
 * Rentenbesteuerungsrechner 2026
 * Berechnet die Steuer auf Renteneinkuenfte basierend auf Rentenbeginn-Jahr.
 * Nutzt den Besteuerungsanteil nach § 22 EStG und die ESt-Berechnung nach § 32a.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt } from "./shared/estg32a";

type RatesType = typeof RATES;

export interface RentenbesteuerungParams {
  monatlicheRente: number;
  rentenBeginnJahr: number; // 2005-2058
}

export interface RentenbesteuerungResult {
  besteuerungsanteilProzent: number;
  steuerpflichtigAnteil: number;
  wkPauschbetrag: number;
  zvEAusRente: number;
  estAufRente: number;
}

/**
 * Besteuerungsanteil nach Rentenbeginn-Jahr (§ 22 Nr. 1 Satz 3 EStG)
 * 2005: 50%, +2% pro Jahr bis 2020 (=80%), +1% pro Jahr bis 2058 (=100%)
 */
function getBesteuerungsanteil(beginn: number): number {
  if (beginn <= 2005) return 50;
  if (beginn <= 2020) return 50 + (beginn - 2005) * 2;
  if (beginn <= 2058) return 80 + (beginn - 2020);
  return 100;
}

export function berechne(
  params: RentenbesteuerungParams,
  rates: RatesType = RATES
): RentenbesteuerungResult {
  const { monatlicheRente, rentenBeginnJahr } = params;

  const renteJaehrlich = monatlicheRente * 12;
  const besteuerungsanteilProzent = getBesteuerungsanteil(rentenBeginnJahr);

  // Steuerpflichtiger Anteil der Rente
  const steuerpflichtigAnteil = rund(renteJaehrlich * besteuerungsanteilProzent / 100);

  // Werbungskosten-Pauschbetrag fuer Rentner
  const wkPauschbetrag = rates.rentenbesteuerung.werbungskosten_pauschbetrag_rente;

  // Zu versteuerndes Einkommen aus Rente
  const zvEAusRente = Math.max(0, rund(steuerpflichtigAnteil - wkPauschbetrag));

  // Einkommensteuer nach § 32a EStG
  const estAufRente = berechneESt(zvEAusRente, rates);

  return {
    besteuerungsanteilProzent,
    steuerpflichtigAnteil,
    wkPauschbetrag,
    zvEAusRente,
    estAufRente,
  };
}
