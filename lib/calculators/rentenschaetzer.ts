/**
 * Rentenschaetzer 2026
 * Schaetzt die zu erwartende Rente anhand von monatlichem Einkommen
 * und Versicherungsjahren.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface RentenschaetzerParams {
  monatlichesEinkommen: number;
  versicherungsjahre: number;
}

export interface RentenschaetzerResult {
  entgeltpunkteGeschaetzt: number;
  renteMonatlichGeschaetzt: number;
}

export function berechne(
  params: RentenschaetzerParams,
  rates: RatesType = RATES
): RentenschaetzerResult {
  const { monatlichesEinkommen, versicherungsjahre } = params;

  // Durchschnittsentgelt (Jahreswert) auf Monatswert umrechnen
  const durchschnittsentgeltMonatlich = rates.rentenschaetzer.durchschnittsentgelt_2025 / 12;

  // Entgeltpunkte pro Jahr = monatliches Einkommen / durchschnittliches monatliches Einkommen
  const epProJahr = monatlichesEinkommen / durchschnittsentgeltMonatlich;
  const entgeltpunkteGeschaetzt = rund(epProJahr * versicherungsjahre);

  // Rente = EP x Rentenwert (Zugangsfaktor 1.0, Rentenartfaktor 1.0)
  const rentenwert = rates.rentenschaetzer.rentenwert_west;
  const renteMonatlichGeschaetzt = rund(entgeltpunkteGeschaetzt * rentenwert);

  return {
    entgeltpunkteGeschaetzt,
    renteMonatlichGeschaetzt,
  };
}
