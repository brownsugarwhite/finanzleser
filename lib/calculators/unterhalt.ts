import { rund } from "./utils";

export interface UnterhaltParams {
  kinderanzahl: number;
  nettoeinkommen: number; // Nettoeinkommen des Unterhaltsverpflichteten
}

export interface UnterhaltResult {
  kinderanzahl: number;
  nettoeinkommen: number;
  unterhaltsquote: number;
  monatlicherUnterhalt: number;
  jaehrlichUnterhalt: number;
}

// Vereinfachte Unterhaltsberechnung basierend auf Düsseldorf-Tabelle 2026
// Vereinfachter Zahlbetrag für minderjährige Kinder
export function berechne({
  kinderanzahl,
  nettoeinkommen,
}: UnterhaltParams): UnterhaltResult {
  // Düsseldorf-Tabelle 2026: Unterhaltsquote ca. 14-16% des Nettoeinkommens
  // Vereinfacht: 15% pro Kind für Einfachheit
  let unterhaltsquote = 0;

  if (kinderanzahl === 1) {
    unterhaltsquote = 0.14; // ~14% für 1 Kind
  } else if (kinderanzahl === 2) {
    unterhaltsquote = 0.22; // ~11% pro Kind für 2 Kinder
  } else if (kinderanzahl === 3) {
    unterhaltsquote = 0.27; // ~9% pro Kind für 3 Kinder
  } else {
    unterhaltsquote = 0.3; // ~7,5% pro Kind für 4+ Kinder
  }

  const monatlicherUnterhalt = rund((nettoeinkommen * unterhaltsquote) / kinderanzahl);
  const jaehrlichUnterhalt = rund(monatlicherUnterhalt * 12);

  return {
    kinderanzahl,
    nettoeinkommen,
    unterhaltsquote: rund(unterhaltsquote * 100) / 100,
    monatlicherUnterhalt,
    jaehrlichUnterhalt,
  };
}
