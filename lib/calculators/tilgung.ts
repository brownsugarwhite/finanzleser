import { rund } from "./utils";

export interface TilgungParams {
  schuldsumme: number;
  laufzeitMonate: number;
  jahreszins: number;
}

export interface TilgungResult {
  schuldsumme: number;
  monatsrate: number;
  gesamtzins: number;
  laufzeitMonate: number;
  jahreszins: number;
}

export function berechne({ schuldsumme, laufzeitMonate, jahreszins }: TilgungParams): TilgungResult {
  const r = jahreszins / 100 / 12;
  const monatsrate =
    schuldsumme === 0 || laufzeitMonate === 0
      ? 0
      : r === 0
        ? schuldsumme / laufzeitMonate
        : (schuldsumme * (r * Math.pow(1 + r, laufzeitMonate))) /
          (Math.pow(1 + r, laufzeitMonate) - 1);

  const gesamtzins = rund(monatsrate * laufzeitMonate - schuldsumme);

  return {
    schuldsumme: rund(schuldsumme),
    monatsrate: rund(monatsrate),
    gesamtzins,
    laufzeitMonate,
    jahreszins,
  };
}
