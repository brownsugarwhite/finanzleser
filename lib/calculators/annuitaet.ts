import { RATES } from "./rates";
import { rund } from "./utils";

export interface AnnuitaetParams {
  darlehensbetrag: number;
  zinssatz_jahr: number;
  laufzeit_jahre: number;
}

export interface TilgungsplanRow {
  monat: number;
  zinsen: number;
  tilgung: number;
  restschuld: number;
}

export interface AnnuitaetResult {
  darlehensbetrag: number;
  zinssatz_jahr: number;
  laufzeit_jahre: number;
  annuitaet_monatlich: number;
  gesamtbetrag: number;
  gesamtzinsen: number;
  tilgungsplan: TilgungsplanRow[];
}

export function berechne(
  { darlehensbetrag, zinssatz_jahr, laufzeit_jahre }: AnnuitaetParams,
  rates: typeof RATES = RATES
): AnnuitaetResult {
  const r = zinssatz_jahr / 100 / 12; // monatlicher Zinssatz
  const n = laufzeit_jahre * 12; // Anzahl Monate

  let annuitaet_monatlich;
  if (r === 0) {
    annuitaet_monatlich = darlehensbetrag / n;
  } else {
    annuitaet_monatlich =
      (darlehensbetrag * (r * Math.pow(1 + r, n))) /
      (Math.pow(1 + r, n) - 1);
  }

  const gesamtbetrag = annuitaet_monatlich * n;
  const gesamtzinsen = gesamtbetrag - darlehensbetrag;

  // Tilgungsplan (erste 24 Monate + letzte Zeile)
  const tilgungsplan: TilgungsplanRow[] = [];
  let restschuld = darlehensbetrag;
  for (let m = 1; m <= n; m++) {
    const zinsen = restschuld * r;
    const tilgung = annuitaet_monatlich - zinsen;
    restschuld -= tilgung;
    if (m <= 24 || m === n) {
      tilgungsplan.push({
        monat: m,
        zinsen: rund(zinsen),
        tilgung: rund(tilgung),
        restschuld: Math.max(0, rund(restschuld))
      });
    }
  }

  return {
    darlehensbetrag,
    zinssatz_jahr,
    laufzeit_jahre,
    annuitaet_monatlich: rund(annuitaet_monatlich),
    gesamtbetrag: rund(gesamtbetrag),
    gesamtzinsen: rund(gesamtzinsen),
    tilgungsplan
  };
}
