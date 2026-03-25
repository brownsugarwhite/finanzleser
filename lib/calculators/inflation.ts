import { RATES } from "./rates";
import { rund } from "./utils";

export interface InflationParams {
  betrag: number;
  inflationsrate: number;
  jahre: number;
}

export interface InflationResult {
  startbetrag: number;
  inflationsrate: number;
  jahre: number;
  endbetrag: number;
  kaufkraftverlust: number;
  kaufkraftprozent: number;
}

export function berechne({ betrag, inflationsrate, jahre }: InflationParams, rates: typeof RATES = RATES): InflationResult {
  const rate = inflationsrate / 100;
  const endbetrag = rund(betrag * Math.pow(1 + rate, jahre));
  const kaufkraftverlust = rund(betrag - endbetrag);
  const kaufkraftprozent = rund((kaufkraftverlust / betrag) * 100);

  return {
    startbetrag: rund(betrag),
    inflationsrate,
    jahre,
    endbetrag,
    kaufkraftverlust,
    kaufkraftprozent,
  };
}
