import { RATES } from "./rates";
import { rund } from "./utils";

export interface KreditParams {
  kreditsumme: number;
  laufzeitMonate: number;
  jahreszins: number;
}

export interface TilgungsplanMonat {
  monat: number;
  zinsen: number;
  tilgung: number;
  restschuld: number;
}

export interface KreditResult {
  kreditsumme: number;
  monatsrate: number;
  gesamtbetrag: number;
  gesamtzinsen: number;
  laufzeitMonate: number;
  jahreszins: number;
  plan: TilgungsplanMonat[];
}

export function berechne({ kreditsumme, laufzeitMonate, jahreszins }: KreditParams, rates: typeof RATES = RATES): KreditResult {
  const r = jahreszins / 100 / 12; // monatlicher Zinssatz

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

  // Tilgungsplan
  const plan: TilgungsplanMonat[] = [];
  let restschuld = kreditsumme;

  for (let monat = 1; monat <= laufzeitMonate; monat++) {
    const zinsen = rund(restschuld * r);
    const tilgung = rund(Math.min(monatsrate - zinsen, restschuld));
    restschuld = rund(Math.max(0, restschuld - tilgung));

    plan.push({ monat, zinsen, tilgung, restschuld });
  }

  return {
    kreditsumme: rund(kreditsumme),
    monatsrate: rund(monatsrate),
    gesamtbetrag,
    gesamtzinsen,
    laufzeitMonate,
    jahreszins,
    plan,
  };
}
