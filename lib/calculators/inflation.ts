import { RATES } from "./rates";
import { rund } from "./utils";

export interface InflationParams {
  betrag: number;
  inflationsrateProzent: number;
  jahre: number;
}

export interface InflationJahresplan {
  jahr: number;
  reellerWert: number;
  kaufkraftVerlust: number;
  benoetigt: number;
}

export interface InflationResult {
  reellerWert: number;
  kaufkraftVerlust: number;
  benoetigt: number;
  verlustProzent: number;
  jahresplan: InflationJahresplan[];
}

export function berechne(
  { betrag, inflationsrateProzent, jahre }: InflationParams,
  rates: typeof RATES = RATES
): InflationResult {
  const rate = inflationsrateProzent / 100;
  const jahresplan: InflationJahresplan[] = [];

  for (let j = 1; j <= jahre; j++) {
    const reellerWert = betrag / Math.pow(1 + rate, j);
    const kaufkraftVerlust = betrag - reellerWert;
    const benoetigt = betrag * Math.pow(1 + rate, j);

    jahresplan.push({
      jahr: j,
      reellerWert: rund(reellerWert),
      kaufkraftVerlust: rund(kaufkraftVerlust),
      benoetigt: rund(benoetigt),
    });
  }

  const letztes = jahresplan[jahresplan.length - 1];
  const reellerWert = letztes.reellerWert;
  const kaufkraftVerlust = letztes.kaufkraftVerlust;
  const benoetigt = letztes.benoetigt;
  const verlustProzent = rund((kaufkraftVerlust / betrag) * 100);

  return {
    reellerWert,
    kaufkraftVerlust,
    benoetigt,
    verlustProzent,
    jahresplan,
  };
}
