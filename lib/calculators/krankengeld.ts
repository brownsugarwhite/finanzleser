import { RATES } from "./rates";
import { rund } from "./utils";

export interface Krankengeldarams {
  nettolohn_tag: number;
  krankheitstage: number;
}

export interface KrangeldResult {
  nettolohn_tag: number;
  krankheitstage: number;
  krankengeld_pro_tag: number;
  krankengeld_gesamt: number;
  krankengeld_jahresanspruch: number;
}

export function berechne(
  { nettolohn_tag, krankheitstage }: Krankengeldarams,
  rates: typeof RATES = RATES
): KrangeldResult {
  // KV zahlt Prozentsatz des Bruttoverdienstes / Nettos from rates.json
  const satz = rates.krankengeld.satz_brutto_prozent / 100;
  const krankengeld_pro_tag = Math.min(rund(nettolohn_tag * satz), 90);
  const krankengeld_gesamt = rund(krankengeld_pro_tag * krankheitstage);

  // Jahresanspruch: unbegrenzt (aber 78 Wochen in 3 Jahren für gleiche Krankheit)
  const krankengeld_jahresanspruch = 365; // Tage

  return {
    nettolohn_tag,
    krankheitstage,
    krankengeld_pro_tag,
    krankengeld_gesamt,
    krankengeld_jahresanspruch
  };
}
