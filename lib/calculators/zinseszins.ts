import { RATES } from "./rates";
import { rund } from "./utils";

export interface ZinseszinsParams {
  startkapital: number;
  monatlicheSparrate: number;
  zinssatzPa: number;
  laufzeitJahre: number;
}

export interface ZinseszinsJahresplan {
  jahr: number;
  kapital: number;
  einzahlungen: number;
  zinsertraege: number;
}

export interface ZinseszinsResult {
  endkapital: number;
  gesamtEinzahlungen: number;
  gesamtZinsertraege: number;
  jahresplan: ZinseszinsJahresplan[];
}

export function berechne(
  { startkapital, monatlicheSparrate, zinssatzPa, laufzeitJahre }: ZinseszinsParams,
  rates: typeof RATES = RATES
): ZinseszinsResult {
  const jahresplan: ZinseszinsJahresplan[] = [];
  let kapital = startkapital;
  let gesamtEinzahlungen = startkapital;

  for (let jahr = 1; jahr <= laufzeitJahre; jahr++) {
    const sparJahr = monatlicheSparrate * 12;
    kapital = (kapital + sparJahr) * (1 + zinssatzPa / 100);
    gesamtEinzahlungen += sparJahr;
    const zinsertraege = kapital - gesamtEinzahlungen;

    jahresplan.push({
      jahr,
      kapital: rund(kapital),
      einzahlungen: rund(gesamtEinzahlungen),
      zinsertraege: rund(zinsertraege),
    });
  }

  const gesamtZinsertraege = rund(kapital - gesamtEinzahlungen);

  return {
    endkapital: rund(kapital),
    gesamtEinzahlungen: rund(gesamtEinzahlungen),
    gesamtZinsertraege,
    jahresplan,
  };
}
