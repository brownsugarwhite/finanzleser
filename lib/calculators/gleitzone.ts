/**
 * Gleitzone/Midijob-Rechner 2026
 * Berechnet SV-Beiträge in der Gleitzone nach §20 Abs. 2 SGB IV.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface GleitzoneParams {
  monatsBrutto: number;
}

export type Beschaeftigungstyp = "minijob" | "gleitzone" | "regulaer";

export interface GleitzoneResult {
  monatsBrutto: number;
  typ: Beschaeftigungstyp;
  // Gleitzone
  beitragsAE: number;       // beitragspflichtiges Arbeitsentgelt
  svANGleitzone: number;    // reduzierter AN-SV-Beitrag
  svANNormal: number;       // normaler AN-SV-Beitrag zum Vergleich
  ersparnisAbsolut: number;
  ersparnisProzent: number;
  nettoNachSV: number;
  // Minijob
  rvAufstockung: number;    // AN-RV 3,6%
}

export function berechne(
  params: GleitzoneParams,
  rates: RatesType = RATES
): GleitzoneResult {
  const { monatsBrutto } = params;
  const mj = rates.minijob;
  const svAnGesamt = rates.alg1.sv_pauschale_an_prozent; // 20.725%

  let typ: Beschaeftigungstyp;
  if (monatsBrutto <= mj.minijob_grenze_monatlich) {
    typ = "minijob";
  } else if (monatsBrutto <= mj.gleitzone_obergrenze) {
    typ = "gleitzone";
  } else {
    typ = "regulaer";
  }

  // Normaler SV-Beitrag
  const svANNormal = rund(monatsBrutto * svAnGesamt / 100);

  // Gleitzone: beitragspflichtiges Arbeitsentgelt
  const F = mj.gleitzonenformel_faktor_F;
  const MJ = mj.minijob_grenze_monatlich;
  const OG = mj.gleitzone_obergrenze;

  let beitragsAE = monatsBrutto;
  let svANGleitzone = svANNormal;

  if (typ === "gleitzone") {
    // Formel: F × MJ + ((OG/(OG-MJ)) - (MJ/(OG-MJ)) × F) × (AE - MJ)
    // Vereinfacht: F × MJ + ((2 - F) × (AE - MJ)) × AE / (OG - MJ) ...
    // Korrekte Formel nach §20 Abs. 2 SGB IV:
    beitragsAE = rund(F * MJ + ((OG / (OG - MJ)) - (MJ / (OG - MJ)) * F) * (monatsBrutto - MJ));
    svANGleitzone = rund(beitragsAE * svAnGesamt / 100);
  } else if (typ === "minijob") {
    beitragsAE = 0;
    svANGleitzone = 0;
  }

  const ersparnisAbsolut = rund(svANNormal - svANGleitzone);
  const ersparnisProzent = svANNormal > 0 ? rund((ersparnisAbsolut / svANNormal) * 100) : 0;
  const nettoNachSV = rund(monatsBrutto - svANGleitzone);

  // Minijob RV-Aufstockung
  const rvAufstockung = typ === "minijob" ? rund(monatsBrutto * mj.an_rv_aufstockung_prozent / 100) : 0;

  return {
    monatsBrutto,
    typ,
    beitragsAE,
    svANGleitzone,
    svANNormal,
    ersparnisAbsolut,
    ersparnisProzent,
    nettoNachSV,
    rvAufstockung,
  };
}
