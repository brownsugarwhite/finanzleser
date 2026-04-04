/**
 * Witwenrentenrechner 2026
 * Berechnet die Witwenrente (grosse und kleine) inkl.
 * Einkommensanrechnung nach § 97 SGB VI.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface WitwenrenteParams {
  entgeltpunkteVerstorbener: number;
  eigeneEntgeltpunkte: number;
  grosseWR: boolean; // true = grosse Witwenrente (55%), false = kleine (25%)
  eigenesEinkommen: number; // monatliches Nettoeinkommen der Witwe/des Witwers
}

export interface WitwenrenteResult {
  renteVerstorbener: number;
  witwenrenteVorAnrechnung: number;
  freibetrag: number;
  anrechenbareEinkuenfte: number;
  kuerzung: number;
  witwenrenteNachAnrechnung: number;
}

export function berechne(
  params: WitwenrenteParams,
  rates: RatesType = RATES
): WitwenrenteResult {
  const { entgeltpunkteVerstorbener, eigeneEntgeltpunkte, grosseWR, eigenesEinkommen } = params;

  const rentenwert = rates.witwenrente.rentenwert_west;
  const grosseFaktor = rates.witwenrente.grosse_wr_faktor;
  const kleineFaktor = rates.witwenrente.kleine_wr_faktor;
  const freibetragFaktor = rates.witwenrente.freibetrag_faktor;
  const anrechnungProzent = rates.witwenrente.einkommensanrechnung_prozent;

  // Rente des Verstorbenen
  const renteVerstorbener = rund(entgeltpunkteVerstorbener * rentenwert);

  // Witwenrente vor Einkommensanrechnung
  const wrFaktor = grosseWR ? grosseFaktor : kleineFaktor;
  const witwenrenteVorAnrechnung = rund(renteVerstorbener * wrFaktor);

  // Freibetrag = freibetrag_faktor x aktueller Rentenwert
  const freibetrag = rund(freibetragFaktor * rentenwert);

  // Anrechenbares Einkommen: eigenesEinkommen - Freibetrag
  const anrechenbareEinkuenfte = Math.max(0, rund(eigenesEinkommen - freibetrag));

  // 40% des anrechenbaren Einkommens wird von der Witwenrente abgezogen
  const kuerzung = rund(anrechenbareEinkuenfte * anrechnungProzent / 100);

  // Witwenrente nach Anrechnung (min. 0)
  const witwenrenteNachAnrechnung = Math.max(0, rund(witwenrenteVorAnrechnung - kuerzung));

  return {
    renteVerstorbener,
    witwenrenteVorAnrechnung,
    freibetrag,
    anrechenbareEinkuenfte,
    kuerzung,
    witwenrenteNachAnrechnung,
  };
}
