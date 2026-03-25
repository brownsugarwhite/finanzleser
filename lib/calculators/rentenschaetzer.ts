import { RATES } from "./rates";
import { rund } from "./utils";

export interface RentenschaetzerParams {
  monatliches_einkommen: number;
  versicherungsjahre: number;
  bundesland: "west" | "ost";
}

export interface RentenschaetzerResult {
  monatliches_einkommen: number;
  versicherungsjahre: number;
  rentenpunkte_schaetzer: number;
  rente_monatlich_schaetzer: number;
  hinweis: string;
}

export function berechne(
  {
    monatliches_einkommen,
    versicherungsjahre,
    bundesland
  }: RentenschaetzerParams,
  rates: typeof RATES = RATES
): RentenschaetzerResult {
  // Durchschnittsverdienst from rates.json (annualisiert)
  const durchschnittsverdienst = rates.rentenschaetzer.durchschnittsentgelt_2025 / 12;

  // Verdienste als Rentenpunkte
  const verdienstquote = monatliches_einkommen / durchschnittsverdienst;
  const rentenpunkte_schaetzer = rund(verdienstquote * versicherungsjahre);

  // Rentenwert from rates.json
  const rentenwert = rates.rentenschaetzer.rentenwert_west;
  const rente_monatlich_schaetzer = rund(rentenpunkte_schaetzer * rentenwert);

  const hinweis = "Dies ist eine unverbindliche Schätzung. Die tatsächliche Rente hängt von den genauen Versicherungszeiten und Einkommen ab.";

  return {
    monatliches_einkommen,
    versicherungsjahre,
    rentenpunkte_schaetzer,
    rente_monatlich_schaetzer,
    hinweis
  };
}
