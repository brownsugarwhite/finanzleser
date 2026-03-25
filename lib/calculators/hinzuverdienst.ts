import { RATES } from "./rates";
import { rund } from "./utils";

export interface HinzuverdienstParams {
  alg1_anspruchswert: number;
  hinzuverdienst_monatlich: number;
  ist_rentnerin: boolean;
}

export interface HinzuverdienstResult {
  alg1_anspruchswert: number;
  hinzuverdienst_monatlich: number;
  hinzuverdienst_freibetrag: number;
  hinzuverdienst_anrechenbar: number;
  alg1_gekuerzt: number;
  alg1_ausgezahlt: number;
  effektiver_satz: number;
}

export function berechne(
  {
    alg1_anspruchswert,
    hinzuverdienst_monatlich,
    ist_rentnerin
  }: HinzuverdienstParams,
  rates: typeof RATES = RATES
): HinzuverdienstResult {
  // Freibetrag auf Hinzuverdienst (vereinfacht - tatsächlich komplexer)
  const hinzuverdienst_freibetrag = ist_rentnerin ? (rates.hinzuverdienst.bbg_monat / 12) : (rates.hinzuverdienst.bbg_monat / 12);
  const hinzuverdienst_ueber = Math.max(
    0,
    hinzuverdienst_monatlich - hinzuverdienst_freibetrag
  );

  // Kürzung % des übersteigenden Betrags wird angerechnet
  const anrechnung_satz = rates.hinzuverdienst.kuerzung_prozent / 100;
  const hinzuverdienst_anrechenbar = rund(hinzuverdienst_ueber * anrechnung_satz);

  // ALG1 wird gekürzt
  const alg1_gekuerzt = Math.max(0, alg1_anspruchswert - hinzuverdienst_anrechenbar);
  const alg1_ausgezahlt = Math.min(
    alg1_anspruchswert,
    alg1_gekuerzt
  );

  // Effektiver Steuersatz
  const verdienst_netto = hinzuverdienst_monatlich - hinzuverdienst_anrechenbar;
  const effektiver_satz = hinzuverdienst_monatlich > 0
    ? rund((hinzuverdienst_anrechenbar / hinzuverdienst_monatlich) * 100)
    : 0;

  return {
    alg1_anspruchswert,
    hinzuverdienst_monatlich,
    hinzuverdienst_freibetrag,
    hinzuverdienst_anrechenbar,
    alg1_gekuerzt,
    alg1_ausgezahlt,
    effektiver_satz
  };
}
