/**
 * Einkommensteuer-Berechnung nach §32a EStG 2026
 * Zentrale Implementierung – wird von allen steuerrelevanten Rechnern genutzt.
 * Alle Werte stammen aus RATES.lohnsteuer.tarifzonen.
 */

import { RATES } from "../rates";
import { rund } from "../utils";

type RatesType = typeof RATES;

/**
 * Berechnet die Einkommensteuer für ein zu versteuerndes Einkommen (zvE).
 * §32a EStG – Progressiver Steuertarif 2026
 */
export function berechneESt(zvE: number, rates: RatesType = RATES): number {
  const tz = rates.lohnsteuer.tarifzonen;
  const grundfreibetrag = rates.lohnsteuer.grundfreibetrag;

  zvE = Math.floor(zvE); // zvE wird auf volle Euro abgerundet

  if (zvE <= grundfreibetrag) return 0;

  if (zvE <= tz.zone1_ende) {
    const y = (zvE - grundfreibetrag) / 10000;
    return Math.floor((914.51 * y + 1400) * y);
  }

  if (zvE <= tz.zone2_ende) {
    const z = (zvE - tz.zone1_ende) / 10000;
    return Math.floor((173.10 * z + 2397) * z + 1034.87);
  }

  if (zvE <= tz.zone3_ende) {
    return Math.floor(0.42 * zvE - 9690.85);
  }

  return Math.floor(0.45 * zvE - 19470.38);
}

/**
 * Berechnet den Grenzsteuersatz (marginaler Steuersatz für den nächsten Euro).
 */
export function berechneGrenzsteuersatz(zvE: number, rates: RatesType = RATES): number {
  const tz = rates.lohnsteuer.tarifzonen;
  const grundfreibetrag = rates.lohnsteuer.grundfreibetrag;

  zvE = Math.floor(zvE);

  if (zvE <= grundfreibetrag) return 0;

  if (zvE <= tz.zone1_ende) {
    const y = (zvE - grundfreibetrag) / 10000;
    return rund((2 * 914.51 * y + 1400) / 10000 * 100);
  }

  if (zvE <= tz.zone2_ende) {
    const z = (zvE - tz.zone1_ende) / 10000;
    return rund((2 * 173.10 * z + 2397) / 10000 * 100);
  }

  if (zvE <= tz.zone3_ende) {
    return 42;
  }

  return 45;
}

/**
 * Berechnet das zu versteuernde Einkommen (zvE) aus Bruttoeinkommen.
 * Berücksichtigt Arbeitnehmerpauschbetrag, Sonderausgabenpauschbetrag,
 * und optionale Sonderabzüge.
 */
export function berechneZvE(
  jahresBrutto: number,
  options: {
    werbungskosten?: number;
    sonderausgaben?: number;
    aussergewoehnlicheBelastungen?: number;
    vorsorgeaufwendungen?: number;
    isSplitting?: boolean;
  } = {},
  rates: RatesType = RATES
): number {
  const wk = Math.max(options.werbungskosten ?? 0, rates.lohnsteuer.arbeitnehmer_pauschbetrag);
  const sa = Math.max(options.sonderausgaben ?? 0, rates.lohnsteuer.sonderausgaben_pauschbetrag);
  const agb = options.aussergewoehnlicheBelastungen ?? 0;
  const vorsorge = options.vorsorgeaufwendungen ?? 0;

  let zvE = jahresBrutto - wk - sa - agb - vorsorge;
  return Math.max(0, Math.floor(zvE));
}

/**
 * Berechnet ESt mit Splitting-Verfahren (Steuerklasse III / Ehepartner).
 * zvE wird halbiert, ESt berechnet, dann verdoppelt.
 */
export function berechneEStSplitting(zvE: number, rates: RatesType = RATES): number {
  const halbZvE = Math.floor(zvE / 2);
  return berechneESt(halbZvE, rates) * 2;
}

/**
 * Berechnet den effektiven Steuersatz (Gesamtsteuer / zvE × 100).
 */
export function berechneEffektiverSatz(steuer: number, zvE: number): number {
  if (zvE <= 0) return 0;
  return rund((steuer / zvE) * 100);
}
