import { RATES } from "./rates";
import { rund } from "./utils";

export interface RenteParams {
  rentenpunkte: number; // Erworbene Rentenpunkte
  renteneintrittsalter: number; // Alter bei Renteneintritt
}

export interface RenteResult {
  rentenpunkte: number;
  renteneintrittsalter: number;
  monatlicheRente: number;
  jaehrlicheRente: number;
}

// Simplified Deutsche Rentenversicherung calculation
// 2026 Rentenwert: ca. 39,32 €/Punkt (West)
export function berechne({
  rentenpunkte,
  renteneintrittsalter,
}: RenteParams, rates: typeof RATES = RATES): RenteResult {
  const rentenwert = 39.32; // 2026 Wert für alte Bundesländer
  const accessfaktor = 1.0; // Ohne Zu-/Abschlag (reguläre Altersgrenze)

  const monatlicheRente = rund(rentenpunkte * rentenwert * accessfaktor);
  const jaehrlicheRente = rund(monatlicheRente * 12);

  return {
    rentenpunkte,
    renteneintrittsalter,
    monatlicheRente,
    jaehrlicheRente,
  };
}
