/**
 * Rentenrechner 2026
 * Berechnet die gesetzliche Rente anhand von Bruttoeinkommen, Beitragsjahren
 * und optionalen bekannten Entgeltpunkten.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface RenteParams {
  geburtsjahr: number;
  beitragsjahre: number;
  jahresBrutto: number;
  bekannteEntgeltpunkte: number; // optional override (0 = automatisch berechnen)
}

export interface RenteResult {
  entgeltpunkte: number;
  zugangsfaktor: number;
  rentenwertAktuell: number;
  renteMonatlich: number;
  renteJaehrlich: number;
  standardrente: number; // Standardrente bei 45 EP
  regelaltersgrenze: number;
  verbleibendeJahre: number;
}

export function berechne(
  params: RenteParams,
  rates: RatesType = RATES
): RenteResult {
  const {
    geburtsjahr,
    beitragsjahre,
    jahresBrutto,
    bekannteEntgeltpunkte,
  } = params;

  const durchschnittsentgelt = rates.rente.durchschnittsentgelt_2026;
  const maxEPProJahr = rates.rente.max_entgeltpunkte_pro_jahr;
  const rentenwert = rates.rente.rentenwert_ab_01jul_2026;
  const regelaltersgrenze = geburtsjahr >= 1964
    ? rates.rente.regelaltersgrenze_ab_jahrgang_1964
    : geburtsjahr >= 1959 ? 66 : 65;

  // Entgeltpunkte berechnen
  let entgeltpunkte: number;
  if (bekannteEntgeltpunkte > 0) {
    entgeltpunkte = bekannteEntgeltpunkte;
  } else {
    const epProJahr = Math.min(jahresBrutto / durchschnittsentgelt, maxEPProJahr);
    entgeltpunkte = rund(epProJahr * beitragsjahre);
  }

  // Zugangsfaktor (1.0 bei Regelaltersgrenze)
  const zugangsfaktor = 1.0;

  // Rentenartfaktor Altersrente = 1.0
  const rentenartfaktor = 1.0;

  // Monatsrente = EP x Zugangsfaktor x Rentenwert x Rentenartfaktor
  const renteMonatlich = rund(entgeltpunkte * zugangsfaktor * rentenwert * rentenartfaktor);
  const renteJaehrlich = rund(renteMonatlich * 12);

  // Standardrente (45 EP, Zugangsfaktor 1.0)
  const standardrente = rund(45 * zugangsfaktor * rentenwert * rentenartfaktor);

  // Verbleibende Jahre bis Regelaltersgrenze
  const aktuellesJahr = new Date().getFullYear();
  const aktuellesAlter = aktuellesJahr - geburtsjahr;
  const verbleibendeJahre = Math.max(0, regelaltersgrenze - aktuellesAlter);

  return {
    entgeltpunkte,
    zugangsfaktor,
    rentenwertAktuell: rentenwert,
    renteMonatlich,
    renteJaehrlich,
    standardrente,
    regelaltersgrenze,
    verbleibendeJahre,
  };
}
