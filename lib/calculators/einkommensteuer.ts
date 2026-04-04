/**
 * Einkommensteuerrechner 2026
 * Vollständige Berechnung nach §32a EStG inkl. Soli, Kirchensteuer.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt, berechneEStSplitting, berechneGrenzsteuersatz } from "./shared/estg32a";
import { berechneSoli } from "./shared/soli";
import { berechneKirchensteuer } from "./shared/kirchensteuer";

type RatesType = typeof RATES;

export interface EinkommensteuerParams {
  jahresBrutto: number;
  steuerklasse: number; // 1–6
  bundesland: string;
  kirchenmitglied: boolean;
  werbungskosten?: number;
  sonderausgaben?: number;
  aussergewoehnlicheBelastungen?: number;
}

export interface EinkommensteuerResult {
  jahresBrutto: number;
  zvE: number;
  einkommensteuer: number;
  einkommensteuerMonatlich: number;
  solidaritaetszuschlag: number;
  solidaritaetszuschlagMonatlich: number;
  kirchensteuer: number;
  kirchensteuerMonatlich: number;
  gesamtsteuer: number;
  gesamtsteuerMonatlich: number;
  nettoEinkommen: number;
  nettoEinkommenMonatlich: number;
  effektiverSteuersatz: number;
  grenzsteuersatz: number;
}

export function berechne(
  params: EinkommensteuerParams,
  rates: RatesType = RATES
): EinkommensteuerResult {
  const {
    jahresBrutto,
    steuerklasse,
    bundesland,
    kirchenmitglied,
  } = params;

  // Abzüge bestimmen
  const wk = Math.max(params.werbungskosten ?? 0, rates.lohnsteuer.arbeitnehmer_pauschbetrag);
  const sa = Math.max(params.sonderausgaben ?? 0, rates.lohnsteuer.sonderausgaben_pauschbetrag);
  const agb = params.aussergewoehnlicheBelastungen ?? 0;

  // Zu versteuerndes Einkommen
  let zvE = Math.max(0, Math.floor(jahresBrutto - wk - sa - agb));

  // Entlastungsbetrag Alleinerziehend (SK II)
  if (steuerklasse === 2) {
    zvE = Math.max(0, zvE - rates.lohnsteuer.entlastungsbetrag_alleinerziehend);
  }

  // Einkommensteuer berechnen
  const isSplitting = steuerklasse === 3;
  let est: number;

  if (isSplitting) {
    est = berechneEStSplitting(zvE, rates);
  } else {
    est = berechneESt(zvE, rates);
  }

  // Soli
  const soli = berechneSoli(est, isSplitting, rates);

  // Kirchensteuer
  const kist = berechneKirchensteuer(est, bundesland, kirchenmitglied, rates);

  // Gesamtsteuer
  const gesamt = rund(est + soli + kist);

  // Netto
  const netto = rund(jahresBrutto - gesamt);

  // Effektiver Steuersatz
  const effektiv = jahresBrutto > 0 ? rund((gesamt / jahresBrutto) * 100) : 0;

  // Grenzsteuersatz
  const grenz = berechneGrenzsteuersatz(zvE, rates);

  return {
    jahresBrutto,
    zvE,
    einkommensteuer: est,
    einkommensteuerMonatlich: rund(est / 12),
    solidaritaetszuschlag: soli,
    solidaritaetszuschlagMonatlich: rund(soli / 12),
    kirchensteuer: kist,
    kirchensteuerMonatlich: rund(kist / 12),
    gesamtsteuer: gesamt,
    gesamtsteuerMonatlich: rund(gesamt / 12),
    nettoEinkommen: netto,
    nettoEinkommenMonatlich: rund(netto / 12),
    effektiverSteuersatz: effektiv,
    grenzsteuersatz: grenz,
  };
}
