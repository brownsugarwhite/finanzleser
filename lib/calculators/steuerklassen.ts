/**
 * Steuerklassenrechner 2026
 * Vergleicht Steuerklassen: Einzelperson (SK I–VI) oder Ehepaar (III/V vs IV/IV).
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt, berechneEStSplitting } from "./shared/estg32a";
import { berechneSoli } from "./shared/soli";

type RatesType = typeof RATES;

export interface SteuerklassenParams {
  modus: "single" | "paar";
  monatsBrutto: number;
  monatsBruttoPartner?: number;
}

export interface SteuerklassenNetto {
  steuerklasse: number;
  beschreibung: string;
  netto: number;
  lohnsteuer: number;
  soli: number;
  svAbzug: number;
}

export interface SteuerklassenResult {
  modus: "single" | "paar";
  monatsBrutto: number;
  monatsBruttoPartner: number;
  // Einzelperson: Vergleich aller Klassen
  vergleich: SteuerklassenNetto[];
  // Ehepaar: Empfehlung
  empfehlung?: string;
  vorteilBetrag?: number;
}

const BESCHREIBUNGEN: Record<number, string> = {
  1: "Ledig / Geschieden",
  2: "Alleinerziehend",
  3: "Verheiratet (höheres Einkommen)",
  4: "Verheiratet (ähnliches Einkommen)",
  5: "Verheiratet (Ehegatte hat III)",
  6: "Zweitjob",
};

function berechneJahresLohnsteuer(
  jahresBrutto: number,
  sk: number,
  rates: RatesType
): number {
  const wk = rates.lohnsteuer.arbeitnehmer_pauschbetrag;
  const sa = rates.lohnsteuer.sonderausgaben_pauschbetrag;

  if (sk === 3) {
    const zvE = Math.max(0, Math.floor(jahresBrutto - wk - sa));
    return berechneEStSplitting(zvE, rates);
  }

  if (sk === 5) {
    // SK V: wie SK I aber ohne Grundfreibetrag
    const zvE = Math.max(0, Math.floor(jahresBrutto - wk - sa));
    return berechneESt(zvE + rates.lohnsteuer.grundfreibetrag, rates);
  }

  if (sk === 6) {
    return berechneESt(Math.floor(jahresBrutto + rates.lohnsteuer.grundfreibetrag), rates);
  }

  let abzuege = wk + sa;
  if (sk === 2) abzuege += rates.lohnsteuer.entlastungsbetrag_alleinerziehend;
  return berechneESt(Math.max(0, Math.floor(jahresBrutto - abzuege)), rates);
}

function nettoMonatlich(
  monatsBrutto: number,
  sk: number,
  rates: RatesType
): SteuerklassenNetto {
  const jahresBrutto = monatsBrutto * 12;

  // SV-Pauschale (vereinfacht)
  const svProzent = rates.alg1.sv_pauschale_an_prozent;
  const svMonat = rund(monatsBrutto * svProzent / 100);

  // Lohnsteuer
  const estJahr = berechneJahresLohnsteuer(jahresBrutto, sk, rates);
  const lstMonat = rund(estJahr / 12);

  // Soli
  const soliJahr = berechneSoli(estJahr, sk === 3, rates);
  const solMonat = rund(soliJahr / 12);

  const netto = rund(monatsBrutto - svMonat - lstMonat - solMonat);

  return {
    steuerklasse: sk,
    beschreibung: BESCHREIBUNGEN[sk] ?? "Unbekannt",
    netto,
    lohnsteuer: lstMonat,
    soli: solMonat,
    svAbzug: svMonat,
  };
}

export function berechne(
  params: SteuerklassenParams,
  rates: RatesType = RATES
): SteuerklassenResult {
  const { modus, monatsBrutto, monatsBruttoPartner = 0 } = params;

  if (modus === "single") {
    // Vergleiche SK 1, 2, 4, 5, 6
    const klassen = [1, 2, 4, 5, 6];
    const vergleich = klassen.map((sk) => nettoMonatlich(monatsBrutto, sk, rates));

    return {
      modus,
      monatsBrutto,
      monatsBruttoPartner: 0,
      vergleich,
    };
  }

  // Ehepaar: III/V vs IV/IV
  const p1_III = nettoMonatlich(monatsBrutto, 3, rates);
  const p2_V = nettoMonatlich(monatsBruttoPartner, 5, rates);
  const gesamt_III_V = rund(p1_III.netto + p2_V.netto);

  const p1_IV = nettoMonatlich(monatsBrutto, 4, rates);
  const p2_IV = nettoMonatlich(monatsBruttoPartner, 4, rates);
  const gesamt_IV_IV = rund(p1_IV.netto + p2_IV.netto);

  const vorteil = rund(gesamt_III_V - gesamt_IV_IV);
  const empfehlung = vorteil > 0
    ? `III/V ist ${vorteil.toLocaleString("de-DE")} € günstiger pro Monat`
    : vorteil < 0
      ? `IV/IV ist ${Math.abs(vorteil).toLocaleString("de-DE")} € günstiger pro Monat`
      : "Beide Varianten sind gleich";

  const vergleich = [
    { ...p1_III, beschreibung: `Person 1 (SK III)` },
    { ...p2_V, beschreibung: `Person 2 (SK V)` },
    { steuerklasse: 0, beschreibung: "Gesamt III/V", netto: gesamt_III_V, lohnsteuer: rund(p1_III.lohnsteuer + p2_V.lohnsteuer), soli: rund(p1_III.soli + p2_V.soli), svAbzug: rund(p1_III.svAbzug + p2_V.svAbzug) },
    { ...p1_IV, beschreibung: `Person 1 (SK IV)` },
    { ...p2_IV, beschreibung: `Person 2 (SK IV)` },
    { steuerklasse: 0, beschreibung: "Gesamt IV/IV", netto: gesamt_IV_IV, lohnsteuer: rund(p1_IV.lohnsteuer + p2_IV.lohnsteuer), soli: rund(p1_IV.soli + p2_IV.soli), svAbzug: rund(p1_IV.svAbzug + p2_IV.svAbzug) },
  ];

  return {
    modus,
    monatsBrutto,
    monatsBruttoPartner,
    vergleich,
    empfehlung,
    vorteilBetrag: vorteil,
  };
}
