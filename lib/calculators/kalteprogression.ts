/**
 * Kalte-Progression-Rechner 2026
 * Zeigt den Effekt der kalten Progression bei Gehaltserhöhungen.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt } from "./shared/estg32a";
import { berechneSoli } from "./shared/soli";

type RatesType = typeof RATES;

export interface KalteprogressionParams {
  monatsBrutto: number;
  gehaltssteigerungProzent: number;
  inflationsrateProzent: number;
}

export interface KalteprogressionResult {
  // Vorher
  bruttoVorher: number;
  estVorher: number;
  soliVorher: number;
  nettoVorher: number;
  steuerquoteVorher: number;
  // Nachher (mit Erhöhung)
  bruttoNachher: number;
  estNachher: number;
  soliNachher: number;
  nettoNachher: number;
  steuerquoteNachher: number;
  // Vergleich
  bruttoAnstiegAbsolut: number;
  bruttoAnstiegProzent: number;
  nettoAnstiegAbsolut: number;
  nettoAnstiegProzent: number;
  // Realer Verlust
  realerNettoAnstiegAbsolut: number;
  realerNettoAnstiegProzent: number;
  kalteProgressionJahr: number;
  kalteProgressionMonat: number;
}

export function berechne(
  params: KalteprogressionParams,
  rates: RatesType = RATES
): KalteprogressionResult {
  const { monatsBrutto, gehaltssteigerungProzent, inflationsrateProzent } = params;

  const wk = rates.lohnsteuer.arbeitnehmer_pauschbetrag;
  const sa = rates.lohnsteuer.sonderausgaben_pauschbetrag;

  // ── Vorher ──
  const jahresBruttoVorher = monatsBrutto * 12;
  const zvEVorher = Math.max(0, Math.floor(jahresBruttoVorher - wk - sa));
  const estVorher = berechneESt(zvEVorher, rates);
  const soliVorher = berechneSoli(estVorher, false, rates);
  const steuerVorher = estVorher + soliVorher;
  const nettoVorher = jahresBruttoVorher - steuerVorher;
  const steuerquoteVorher = jahresBruttoVorher > 0 ? rund((steuerVorher / jahresBruttoVorher) * 100) : 0;

  // ── Nachher (mit Gehaltserhöhung) ──
  const monatsBruttoNeu = rund(monatsBrutto * (1 + gehaltssteigerungProzent / 100));
  const jahresBruttoNachher = monatsBruttoNeu * 12;
  const zvENachher = Math.max(0, Math.floor(jahresBruttoNachher - wk - sa));
  const estNachher = berechneESt(zvENachher, rates);
  const soliNachher = berechneSoli(estNachher, false, rates);
  const steuerNachher = estNachher + soliNachher;
  const nettoNachher = jahresBruttoNachher - steuerNachher;
  const steuerquoteNachher = jahresBruttoNachher > 0 ? rund((steuerNachher / jahresBruttoNachher) * 100) : 0;

  // ── Vergleich ──
  const bruttoAnstiegAbsolut = rund(jahresBruttoNachher - jahresBruttoVorher);
  const bruttoAnstiegProzent = rund(gehaltssteigerungProzent);
  const nettoAnstiegAbsolut = rund(nettoNachher - nettoVorher);
  const nettoAnstiegProzent = nettoVorher > 0 ? rund((nettoAnstiegAbsolut / nettoVorher) * 100) : 0;

  // ── Realer Anstieg (inflationsbereinigt) ──
  const realerNettoSoll = rund(nettoVorher * (1 + inflationsrateProzent / 100));
  const realerNettoAnstiegAbsolut = rund(nettoNachher - realerNettoSoll);
  const realerNettoAnstiegProzent = nettoVorher > 0
    ? rund(((nettoNachher / nettoVorher) - 1 - inflationsrateProzent / 100) * 100)
    : 0;

  // Kalte Progression = Differenz zwischen nominaler und realer Nettoentwicklung
  const kalteProgressionJahr = rund(bruttoAnstiegAbsolut - nettoAnstiegAbsolut);
  const kalteProgressionMonat = rund(kalteProgressionJahr / 12);

  return {
    bruttoVorher: rund(jahresBruttoVorher / 12),
    estVorher: rund(estVorher / 12),
    soliVorher: rund(soliVorher / 12),
    nettoVorher: rund(nettoVorher / 12),
    steuerquoteVorher,
    bruttoNachher: monatsBruttoNeu,
    estNachher: rund(estNachher / 12),
    soliNachher: rund(soliNachher / 12),
    nettoNachher: rund(nettoNachher / 12),
    steuerquoteNachher,
    bruttoAnstiegAbsolut: rund(bruttoAnstiegAbsolut / 12),
    bruttoAnstiegProzent,
    nettoAnstiegAbsolut: rund(nettoAnstiegAbsolut / 12),
    nettoAnstiegProzent,
    realerNettoAnstiegAbsolut: rund(realerNettoAnstiegAbsolut / 12),
    realerNettoAnstiegProzent,
    kalteProgressionJahr,
    kalteProgressionMonat,
  };
}
