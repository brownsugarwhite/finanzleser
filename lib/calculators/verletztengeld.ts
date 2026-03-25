import { RATES } from "./rates";
import { rund } from "./utils";

export interface VerletztensgeldParams {
  nettolohn_tag: number;
  verletzungstage: number;
}

export interface VerletztensgeldResult {
  nettolohn_tag: number;
  verletzungstage: number;
  verletztengeld_pro_tag: number;
  verletztengeld_gesamt: number;
  minderungsrente_option: boolean;
}

export function berechne(
  { nettolohn_tag, verletzungstage }: VerletztensgeldParams,
  rates: typeof RATES = RATES
): VerletztensgeldResult {
  // BG zahlt Verletztengeld from rates.json
  const satz_prozent = rates.verletztengeld.satz_prozent / 100;
  const verletztengeld_pro_tag = rund(nettolohn_tag * satz_prozent);
  const verletztengeld_gesamt = rund(verletztengeld_pro_tag * verletzungstage);

  // Nach Heilungsphase: Minderungsrente falls dauerhafte Behinderung
  const minderungsrente_option = verletzungstage > 30;

  return {
    nettolohn_tag,
    verletzungstage,
    verletztengeld_pro_tag,
    verletztengeld_gesamt,
    minderungsrente_option
  };
}
