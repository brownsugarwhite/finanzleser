/**
 * Minijob-Rechner 2026
 * Berechnet AN- und AG-Kosten für Minijobs und Midijobs.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface MinijobParams {
  monatsBrutto: number;
  rvBefreiung: boolean; // Befreiung von RV-Aufstockung
}

export type MinijobTyp = "minijob" | "midijob" | "regulaer";

export interface MinijobResult {
  monatsBrutto: number;
  typ: MinijobTyp;
  // AN
  anRVAufstockung: number;
  anSVReduziert: number;
  anSVNormal: number;
  anErsparnis: number;
  netto: number;
  // AG
  agKV: number;
  agRV: number;
  agSteuer: number;
  agGesamt: number;
  // Info
  stundenBeiMindestlohn: number;
  bemessungsentgelt: number;
}

export function berechne(
  params: MinijobParams,
  rates: RatesType = RATES
): MinijobResult {
  const { monatsBrutto, rvBefreiung } = params;
  const mj = rates.minijob;
  const svAnGesamt = rates.alg1.sv_pauschale_an_prozent;
  const mindestlohn = rates.mindestlohn.stundensatz;

  let typ: MinijobTyp;
  if (monatsBrutto <= mj.minijob_grenze_monatlich) {
    typ = "minijob";
  } else if (monatsBrutto <= mj.gleitzone_obergrenze) {
    typ = "midijob";
  } else {
    typ = "regulaer";
  }

  const stundenBeiMindestlohn = rund(monatsBrutto / mindestlohn);

  // AG-Kosten (nur bei Minijob)
  let agKV = 0, agRV = 0, agSteuer = 0, agGesamt = 0;
  if (typ === "minijob") {
    agKV = rund(monatsBrutto * mj.ag_kv_pauschale_prozent / 100);
    agRV = rund(monatsBrutto * mj.ag_rv_pauschale_prozent / 100);
    agSteuer = rund(monatsBrutto * mj.ag_steuerpauschale_prozent / 100);
    agGesamt = rund(agKV + agRV + agSteuer);
  }

  // AN-Kosten
  let anRVAufstockung = 0;
  let anSVReduziert = 0;
  let anSVNormal = rund(monatsBrutto * svAnGesamt / 100);
  let anErsparnis = 0;
  let netto = monatsBrutto;
  let bemessungsentgelt = monatsBrutto;

  if (typ === "minijob") {
    anRVAufstockung = rvBefreiung ? 0 : rund(monatsBrutto * mj.an_rv_aufstockung_prozent / 100);
    netto = rund(monatsBrutto - anRVAufstockung);
    anSVNormal = 0;
    bemessungsentgelt = 0;
  } else if (typ === "midijob") {
    // Gleitzone
    const F = mj.gleitzonenformel_faktor_F;
    const MJ = mj.minijob_grenze_monatlich;
    const OG = mj.gleitzone_obergrenze;
    bemessungsentgelt = rund(F * MJ + ((OG / (OG - MJ)) - (MJ / (OG - MJ)) * F) * (monatsBrutto - MJ));
    anSVReduziert = rund(bemessungsentgelt * svAnGesamt / 100);
    anErsparnis = rund(anSVNormal - anSVReduziert);
    netto = rund(monatsBrutto - anSVReduziert);
  } else {
    anSVReduziert = anSVNormal;
    netto = rund(monatsBrutto - anSVNormal);
  }

  return {
    monatsBrutto,
    typ,
    anRVAufstockung,
    anSVReduziert,
    anSVNormal,
    anErsparnis,
    netto,
    agKV, agRV, agSteuer, agGesamt,
    stundenBeiMindestlohn,
    bemessungsentgelt,
  };
}
