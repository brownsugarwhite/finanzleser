/**
 * Brutto-Netto-Rechner 2026
 * Vollständige Gehaltsberechnung: SV + Steuern → Netto (monatlich & jährlich).
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt, berechneEStSplitting } from "./shared/estg32a";
import { berechneSoli } from "./shared/soli";
import { berechneKirchensteuer } from "./shared/kirchensteuer";
import { berechneSVArbeitnehmer, type SVErgebnis } from "./shared/sozialversicherung";

type RatesType = typeof RATES;

export interface BruttoNettoParams {
  monatsBrutto: number;
  steuerklasse: number; // 1–6
  bundesland: string;
  kirchenmitglied: boolean;
  kinderAnzahl: number;
  kinderlosUeber23: boolean;
  kvZusatzbeitrag: number; // in %
}

export interface BruttoNettoResult {
  monatsBrutto: number;
  jahresBrutto: number;
  // SV monatlich
  sv: SVErgebnis;
  svJahr: SVErgebnis;
  // Steuern monatlich
  lohnsteuer: number;
  lohnsteuerJahr: number;
  solidaritaetszuschlag: number;
  solidaritaetszuschlagJahr: number;
  kirchensteuer: number;
  kirchensteuerJahr: number;
  steuernGesamt: number;
  steuernGesamtJahr: number;
  // Summen
  gesamtAbzuege: number;
  gesamtAbzuegeJahr: number;
  netto: number;
  nettoJahr: number;
}

export function berechne(
  params: BruttoNettoParams,
  rates: RatesType = RATES
): BruttoNettoResult {
  const {
    monatsBrutto,
    steuerklasse,
    bundesland,
    kirchenmitglied,
    kinderAnzahl,
    kinderlosUeber23,
    kvZusatzbeitrag,
  } = params;

  const jahresBrutto = rund(monatsBrutto * 12);

  // ── Sozialversicherung (monatlich) ──
  const sv = berechneSVArbeitnehmer({
    monatsBrutto,
    kinderAnzahl,
    kinderlosUeber23,
    kvZusatzbeitrag,
    bundesland,
  }, rates);

  const svJahr: SVErgebnis = {
    rv: rund(sv.rv * 12),
    kv: rund(sv.kv * 12),
    pv: rund(sv.pv * 12),
    alv: rund(sv.alv * 12),
    gesamt: rund(sv.gesamt * 12),
  };

  // ── Lohnsteuer (Jahresberechnung → durch 12 für Monat) ──
  const wk = rates.lohnsteuer.arbeitnehmer_pauschbetrag;
  const sa = rates.lohnsteuer.sonderausgaben_pauschbetrag;
  let zvE = Math.max(0, Math.floor(jahresBrutto - wk - sa));

  // Entlastungsbetrag Alleinerziehend (SK II)
  if (steuerklasse === 2) {
    zvE = Math.max(0, zvE - rates.lohnsteuer.entlastungsbetrag_alleinerziehend);
  }

  const isSplitting = steuerklasse === 3;
  let estJahr: number;
  if (isSplitting) {
    estJahr = berechneEStSplitting(zvE, rates);
  } else {
    estJahr = berechneESt(zvE, rates);
  }

  const soliJahr = berechneSoli(estJahr, isSplitting, rates);
  const kistJahr = berechneKirchensteuer(estJahr, bundesland, kirchenmitglied, rates);

  const lohnsteuerMonat = rund(estJahr / 12);
  const soliMonat = rund(soliJahr / 12);
  const kistMonat = rund(kistJahr / 12);

  const steuernGesamt = rund(lohnsteuerMonat + soliMonat + kistMonat);
  const steuernGesamtJahr = rund(estJahr + soliJahr + kistJahr);

  const gesamtAbzuege = rund(sv.gesamt + steuernGesamt);
  const gesamtAbzuegeJahr = rund(svJahr.gesamt + steuernGesamtJahr);

  const netto = rund(monatsBrutto - gesamtAbzuege);
  const nettoJahr = rund(jahresBrutto - gesamtAbzuegeJahr);

  return {
    monatsBrutto,
    jahresBrutto,
    sv,
    svJahr,
    lohnsteuer: lohnsteuerMonat,
    lohnsteuerJahr: estJahr,
    solidaritaetszuschlag: soliMonat,
    solidaritaetszuschlagJahr: soliJahr,
    kirchensteuer: kistMonat,
    kirchensteuerJahr: kistJahr,
    steuernGesamt,
    steuernGesamtJahr,
    gesamtAbzuege,
    gesamtAbzuegeJahr,
    netto,
    nettoJahr,
  };
}
