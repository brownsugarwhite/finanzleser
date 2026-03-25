import { RATES } from "./rates";
import { rund } from "./utils";

export interface GleitzoneParams {
  monatlicher_verdienst: number;
  ist_ab_2024: boolean;
}

export interface GleitzoneResult {
  monatlicher_verdienst: number;
  kategorie: "minijob" | "gleitzone" | "regulaer";
  grenzen: {
    grenze_unten: number;
    grenze_oben: number;
  };
  sv_freibetrag: number | null;
  hinweis: string;
}

export function berechne(
  { monatlicher_verdienst, ist_ab_2024 }: GleitzoneParams,
  rates: typeof RATES = RATES
): GleitzoneResult {
  let kategorie: "minijob" | "gleitzone" | "regulaer";
  let sv_freibetrag: number | null = null;
  const hinweis_text: Record<string, string> = {
    minijob:
      "Pauschalabgaben: AG 12%, AN 3,6% (KK) + freiwillig 5% (RV)",
    gleitzone:
      "Gleitzone mit reduziertem Beitrag nach § 163 SGB VI. Berechnung über Gleitzonenformeln.",
    regulaer: "Vollständige Sozialversicherung wie bei Vollzeitbeschäftigung"
  };

  // Grenzen from rates.json
  const minijob_grenze = rates.minijob.minijob_grenze_monatlich;
  const gleitzone_grenze_oben = rates.minijob.gleitzone_obergrenze;

  if (monatlicher_verdienst <= minijob_grenze) {
    kategorie = "minijob";
  } else if (monatlicher_verdienst <= gleitzone_grenze_oben) {
    kategorie = "gleitzone";
    // Gleitzone SV-Beitrag: reduziert berechnet
    sv_freibetrag = rund(monatlicher_verdienst * 0.1);
  } else {
    kategorie = "regulaer";
  }

  return {
    monatlicher_verdienst,
    kategorie,
    grenzen: {
      grenze_unten: minijob_grenze,
      grenze_oben: gleitzone_grenze_oben
    },
    sv_freibetrag,
    hinweis: hinweis_text[kategorie] || ""
  };
}
