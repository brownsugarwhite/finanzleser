/**
 * Abfindungsrechner 2026
 * Berechnet Abfindung mit Vergleich: Normale Besteuerung vs. Fünftelregelung (§34 EStG).
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt } from "./shared/estg32a";

type RatesType = typeof RATES;

export interface AbfindungParams {
  monatsBrutto: number;
  beschaeftigungsjahre: number;
  faktor: number; // z.B. 0.5
  jahresBruttoEinkommen: number; // Jahresbrutto OHNE Abfindung
}

export interface AbfindungResult {
  abfindungBrutto: number;
  jahresBruttoEinkommen: number;
  // Normale Besteuerung
  estNormal: number;
  nettoNormal: number;
  // Fünftelregelung §34 EStG
  estFuenftel: number;
  nettoFuenftel: number;
  // Ersparnis
  steuerersparnis: number;
}

export function berechne(
  params: AbfindungParams,
  rates: RatesType = RATES
): AbfindungResult {
  const { monatsBrutto, beschaeftigungsjahre, faktor, jahresBruttoEinkommen } = params;

  // Abfindung nach Faustformel
  const abfindung = rund(monatsBrutto * beschaeftigungsjahre * faktor);

  // Abzüge für zvE
  const wk = rates.lohnsteuer.arbeitnehmer_pauschbetrag;
  const sa = rates.lohnsteuer.sonderausgaben_pauschbetrag;

  // zvE ohne Abfindung
  const zvEOhne = Math.max(0, Math.floor(jahresBruttoEinkommen - wk - sa));
  const estOhne = berechneESt(zvEOhne, rates);

  // ── Variante 1: Normale Besteuerung ──
  const zvEMitAbfindung = Math.max(0, Math.floor(jahresBruttoEinkommen + abfindung - wk - sa));
  const estMitAbfindung = berechneESt(zvEMitAbfindung, rates);
  const estNormal = estMitAbfindung - estOhne;

  // ── Variante 2: Fünftelregelung §34 EStG ──
  const einFuenftel = Math.floor(abfindung / 5);
  const zvEMitFuenftel = Math.max(0, Math.floor(jahresBruttoEinkommen + einFuenftel - wk - sa));
  const estMitFuenftel = berechneESt(zvEMitFuenftel, rates);
  const estFuenftel = (estMitFuenftel - estOhne) * 5;

  // Netto
  const nettoNormal = rund(abfindung - estNormal);
  const nettoFuenftel = rund(abfindung - estFuenftel);

  // Ersparnis
  const steuerersparnis = rund(Math.max(0, estNormal - estFuenftel));

  return {
    abfindungBrutto: abfindung,
    jahresBruttoEinkommen,
    estNormal,
    nettoNormal,
    estFuenftel,
    nettoFuenftel,
    steuerersparnis,
  };
}
