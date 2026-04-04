/**
 * Sozialversicherungs-Berechnung
 * Berechnet AN-Anteile für RV, KV, PV, ALV.
 * Alle Werte aus RATES.sozialversicherung und RATES.beitragsbemessungsgrenzen.
 */

import { RATES } from "../rates";
import { rund } from "../utils";

type RatesType = typeof RATES;

export interface SVErgebnis {
  rv: number;       // Rentenversicherung AN
  kv: number;       // Krankenversicherung AN (inkl. Zusatzbeitrag)
  pv: number;       // Pflegeversicherung AN
  alv: number;      // Arbeitslosenversicherung AN
  gesamt: number;   // Summe aller AN-Anteile
}

export interface SVErgebnisAG {
  rv: number;
  kv: number;
  pv: number;
  alv: number;
  gesamt: number;
}

export interface SVParams {
  monatsBrutto: number;
  kinderAnzahl?: number;        // Anzahl Kinder unter 25
  kinderlosUeber23?: boolean;   // AN ist kinderlos und über 23
  kvZusatzbeitrag?: number;     // individueller KV-Zusatzbeitrag in % (default: Durchschnitt)
  bundesland?: string;          // für Sachsen PV-Sonderregel
}

/**
 * Berechnet die monatlichen Sozialversicherungsbeiträge (Arbeitnehmer-Anteil).
 */
export function berechneSVArbeitnehmer(
  params: SVParams,
  rates: RatesType = RATES
): SVErgebnis {
  const sv = rates.sozialversicherung;
  const bbg = rates.beitragsbemessungsgrenzen;

  const bruttoKV = Math.min(params.monatsBrutto, bbg.kranken_pflege.monatlich);
  const bruttoRV = Math.min(params.monatsBrutto, bbg.renten_arbeitslosen.monatlich);

  // Rentenversicherung
  const rv = rund(bruttoRV * sv.rentenversicherung.arbeitnehmer_prozent / 100);

  // Krankenversicherung (allgemein + halber Zusatzbeitrag)
  const zusatz = params.kvZusatzbeitrag ?? sv.krankenversicherung.durchschnittlicher_zusatzbeitrag_prozent;
  const kvSatz = sv.krankenversicherung.allgemeiner_beitrag_an_prozent + (zusatz / 2);
  const kv = rund(bruttoKV * kvSatz / 100);

  // Pflegeversicherung
  const pvSatz = berechnePVSatz(params, rates);
  const pv = rund(bruttoKV * pvSatz / 100);

  // Arbeitslosenversicherung
  const alv = rund(bruttoRV * sv.arbeitslosenversicherung.arbeitnehmer_prozent / 100);

  const gesamt = rund(rv + kv + pv + alv);

  return { rv, kv, pv, alv, gesamt };
}

/**
 * Berechnet die monatlichen Sozialversicherungsbeiträge (Arbeitgeber-Anteil).
 */
export function berechneSVArbeitgeber(
  params: SVParams,
  rates: RatesType = RATES
): SVErgebnisAG {
  const sv = rates.sozialversicherung;
  const bbg = rates.beitragsbemessungsgrenzen;

  const bruttoKV = Math.min(params.monatsBrutto, bbg.kranken_pflege.monatlich);
  const bruttoRV = Math.min(params.monatsBrutto, bbg.renten_arbeitslosen.monatlich);

  const rv = rund(bruttoRV * sv.rentenversicherung.arbeitgeber_prozent / 100);

  const zusatz = params.kvZusatzbeitrag ?? sv.krankenversicherung.durchschnittlicher_zusatzbeitrag_prozent;
  const kvSatz = sv.krankenversicherung.allgemeiner_beitrag_ag_prozent + (zusatz / 2);
  const kv = rund(bruttoKV * kvSatz / 100);

  // AG-PV: 1,7% (Sachsen: 1,3%)
  const pvAgSatz = params.bundesland === "Sachsen"
    ? 1.3
    : sv.pflegeversicherung.arbeitgeber_prozent;
  const pv = rund(bruttoKV * pvAgSatz / 100);

  const alv = rund(bruttoRV * sv.arbeitslosenversicherung.arbeitgeber_prozent / 100);

  const gesamt = rund(rv + kv + pv + alv);

  return { rv, kv, pv, alv, gesamt };
}

/**
 * Ermittelt den PV-Satz für Arbeitnehmer basierend auf Kinderzahl.
 */
function berechnePVSatz(params: SVParams, rates: RatesType): number {
  const pv = rates.sozialversicherung.pflegeversicherung;
  const kinder = params.kinderAnzahl ?? 0;

  if (kinder === 0 && (params.kinderlosUeber23 ?? true)) {
    return pv.arbeitnehmer_nach_kindern.kinderlos_ueber23;
  }

  if (kinder >= 5) return pv.arbeitnehmer_nach_kindern["5_oder_mehr_kinder"];
  if (kinder === 4) return pv.arbeitnehmer_nach_kindern["4_kinder"];
  if (kinder === 3) return pv.arbeitnehmer_nach_kindern["3_kinder"];
  if (kinder === 2) return pv.arbeitnehmer_nach_kindern["2_kinder"];
  return pv.arbeitnehmer_nach_kindern["1_kind"];
}

/**
 * Berechnet die gesamte SV-Pauschale als Prozent für Pauschalberechnungen (z.B. ALG1).
 */
export function berechneSVPauschale(rates: RatesType = RATES): number {
  return rates.alg1.sv_pauschale_an_prozent;
}

/**
 * Berechnet den Gleitzonenberechnungsfaktor (Midijob §20 Abs. 2 SGB IV).
 */
export function berechneGleitzoneBeitrag(
  monatsBrutto: number,
  rates: RatesType = RATES
): number {
  const mj = rates.minijob;
  const F = mj.gleitzonenformel_faktor_F;
  const untergrenze = mj.gleitzone_untergrenze;
  const obergrenze = mj.gleitzone_obergrenze;

  if (monatsBrutto <= untergrenze || monatsBrutto > obergrenze) {
    return monatsBrutto;
  }

  // Formel: F × Untergrenze + ((Obergrenze / (Obergrenze - Untergrenze)) - (Untergrenze / (Obergrenze - Untergrenze)) × F) × (Brutto - Untergrenze)
  const faktor = (obergrenze / (obergrenze - untergrenze))
    - (untergrenze / (obergrenze - untergrenze)) * F;
  const beitragsBrutto = F * untergrenze + faktor * (monatsBrutto - untergrenze);

  return rund(beitragsBrutto);
}
