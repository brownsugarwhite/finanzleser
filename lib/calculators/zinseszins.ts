import { rund } from "./utils";

export interface ZinseszinsParams {
  kapital: number;
  zinssatz: number;
  jahre: number;
}

export interface ZinseszinsResult {
  startkapital: number;
  zinssatz: number;
  jahre: number;
  endkapital: number;
  ertrag: number;
}

export function berechne({ kapital, zinssatz, jahre }: ZinseszinsParams): ZinseszinsResult {
  const rate = zinssatz / 100;
  const endkapital = rund(kapital * Math.pow(1 + rate, jahre));
  const ertrag = rund(endkapital - kapital);

  return {
    startkapital: rund(kapital),
    zinssatz,
    jahre,
    endkapital,
    ertrag,
  };
}
