import { RATES } from "./rates";
import { rund } from "./utils";

export interface UebergangssgeldParams {
  nettolohn_tag: number;
  leistungstage: number;
}

export interface UebergangssgeldResult {
  nettolohn_tag: number;
  leistungstage: number;
  uebergangsgeld_pro_tag: number;
  uebergangsgeld_gesamt: number;
  hinweis: string;
}

export function berechne(
  { nettolohn_tag, leistungstage }: UebergangssgeldParams,
  rates: typeof RATES = RATES
): UebergangssgeldResult {
  // Übergangsgeld from rates.json (ohne Kind: 68%, mit Kind: 75%)
  const satz_prozent = rates.uebergangsgeld.satz_ohne_kind_prozent / 100;
  const uebergangsgeld_pro_tag = rund(nettolohn_tag * satz_prozent);
  const uebergangsgeld_gesamt = rund(uebergangsgeld_pro_tag * leistungstage);

  const hinweis =
    "Das Übergangsgeld wird während einer Maßnahme der Rehabilitation oder beruflichen Anpassung gezahlt. Satz: 60 % oder 75 % des Netto, je nach Vorbildung.";

  return {
    nettolohn_tag,
    leistungstage,
    uebergangsgeld_pro_tag,
    uebergangsgeld_gesamt,
    hinweis
  };
}
