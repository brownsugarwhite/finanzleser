import { RATES } from "./rates";
import { rund } from "./utils";

export interface KreditParams {
  kreditsumme: number;
  laufzeitMonate: number;
  jahreszins: number;
}

export interface KreditTilgungsplanRow {
  monat: number;
  zinsen: number;
  tilgung: number;
  restschuld: number;
}

export interface KreditResult {
  monatsrate: number;
  gesamtbetrag: number;
  gesamtzinsen: number;
  effektivzins: number;
  tilgungsplan: KreditTilgungsplanRow[];
}

export function berechne(
  { kreditsumme, laufzeitMonate, jahreszins }: KreditParams,
  rates: typeof RATES = RATES
): KreditResult {
  const r = jahreszins / 100 / 12;

  let monatsrate: number;
  if (r === 0) {
    monatsrate = kreditsumme / laufzeitMonate;
  } else {
    monatsrate =
      (kreditsumme * (r * Math.pow(1 + r, laufzeitMonate))) /
      (Math.pow(1 + r, laufzeitMonate) - 1);
  }

  const gesamtbetrag = rund(monatsrate * laufzeitMonate);
  const gesamtzinsen = rund(gesamtbetrag - kreditsumme);
  const effektivzins = rund(jahreszins); // Vereinfacht: gleich Nominalzins

  // Tilgungsplan
  const tilgungsplan: KreditTilgungsplanRow[] = [];
  let restschuld = kreditsumme;

  for (let monat = 1; monat <= laufzeitMonate; monat++) {
    const zinsen = rund(restschuld * r);
    const tilgung = rund(Math.min(monatsrate - zinsen, restschuld));
    restschuld = rund(Math.max(0, restschuld - tilgung));
    tilgungsplan.push({ monat, zinsen, tilgung, restschuld });
  }

  return {
    monatsrate: rund(monatsrate),
    gesamtbetrag,
    gesamtzinsen,
    effektivzins,
    tilgungsplan,
  };
}
