/**
 * Kurzarbeitergeld-Rechner 2026
 * Berechnet KUG nach §§95–111 SGB III.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt } from "./shared/estg32a";
import { berechneSVArbeitnehmer } from "./shared/sozialversicherung";

type RatesType = typeof RATES;

export interface KurzarbeitsgeldParams {
  sollEntgelt: number;
  istEntgelt: number;
  steuerklasse: number;
  hatKind: boolean;
  kinderlosUeber23: boolean;
}

export interface KurzarbeitsgeldResult {
  sollBrutto: number;
  istBrutto: number;
  nettoSoll: number;
  nettoIst: number;
  nettoEntgeltDifferenz: number;
  leistungssatzProzent: number;
  kurzarbeitergeld: number;
  gesamtEinkommen: number;
  ausfallQuoteProzent: number;
}

function berechneNetto(brutto: number, sk: number, kinderAnzahl: number, kinderlosUeber23: boolean, rates: RatesType): number {
  const sv = berechneSVArbeitnehmer({ monatsBrutto: brutto, kinderAnzahl, kinderlosUeber23 }, rates);
  const jahresBrutto = brutto * 12;
  const wk = rates.lohnsteuer.arbeitnehmer_pauschbetrag;
  const sa = rates.lohnsteuer.sonderausgaben_pauschbetrag;
  let zvE = Math.max(0, Math.floor(jahresBrutto - wk - sa));
  if (sk === 2) zvE = Math.max(0, zvE - rates.lohnsteuer.entlastungsbetrag_alleinerziehend);
  let est: number;
  if (sk === 3) {
    est = berechneESt(Math.floor(zvE / 2), rates) * 2;
  } else {
    est = berechneESt(zvE, rates);
  }
  return rund(brutto - sv.gesamt - rund(est / 12));
}

export function berechne(
  params: KurzarbeitsgeldParams,
  rates: RatesType = RATES
): KurzarbeitsgeldResult {
  const { sollEntgelt, istEntgelt, steuerklasse, hatKind, kinderlosUeber23 } = params;
  const kinderAnzahl = hatKind ? 1 : 0;

  const nettoSoll = berechneNetto(sollEntgelt, steuerklasse, kinderAnzahl, kinderlosUeber23, rates);
  const nettoIst = istEntgelt > 0 ? berechneNetto(istEntgelt, steuerklasse, kinderAnzahl, kinderlosUeber23, rates) : 0;

  const nettoEntgeltDifferenz = Math.max(0, rund(nettoSoll - nettoIst));
  const leistungssatzProzent = hatKind
    ? rates.kurzarbeitsgeld.leistungssatz_mit_kind_prozent
    : rates.kurzarbeitsgeld.leistungssatz_ohne_kind_prozent;

  const kurzarbeitergeld = rund(nettoEntgeltDifferenz * leistungssatzProzent / 100);
  const gesamtEinkommen = rund(nettoIst + kurzarbeitergeld);
  const ausfallQuoteProzent = sollEntgelt > 0 ? rund(((sollEntgelt - istEntgelt) / sollEntgelt) * 100) : 0;

  return {
    sollBrutto: sollEntgelt,
    istBrutto: istEntgelt,
    nettoSoll,
    nettoIst,
    nettoEntgeltDifferenz,
    leistungssatzProzent,
    kurzarbeitergeld,
    gesamtEinkommen,
    ausfallQuoteProzent,
  };
}
