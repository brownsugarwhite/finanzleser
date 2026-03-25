import { RATES } from "./rates";
import { rund } from "./utils";

export interface FlexrenteParams {
  rentenpunkte: number;
  monate_vorzeitig_oder_spaeter: number;
}

export interface FlexrenteResult {
  rentenpunkte: number;
  monate: number;
  type: "vorzeitig" | "regelalter" | "spaeter";
  rente_basis: number;
  zugangsfaktor: number;
  factor_prozent: number;
  rente_monatlich: number;
  differenz: number;
  rentenwert: number;
}

export function berechne(
  { rentenpunkte, monate_vorzeitig_oder_spaeter }: FlexrenteParams,
  rates: typeof RATES = RATES
): FlexrenteResult {
  const rentenwert_west = rates.flexrente.rentenwert_west;
  const abschlag_pro_monat = rates.flexrente.abschlag_je_monat_prozent / 100;
  const zuschlag_pro_monat = rates.flexrente.zuschlag_je_monat_prozent / 100;
  const max_abschlag = rates.flexrente.abschlag_max_prozent / 100;

  const rente_basis = rentenpunkte * rentenwert_west;
  let zugangsfaktor = 1.0;
  let type: "vorzeitig" | "regelalter" | "spaeter" = "regelalter";

  if (monate_vorzeitig_oder_spaeter < 0) {
    // Vorzeitig
    const monate_vor = Math.abs(monate_vorzeitig_oder_spaeter);
    const abschlag = Math.min(monate_vor * abschlag_pro_monat, max_abschlag);
    zugangsfaktor = 1 - abschlag;
    type = "vorzeitig";
  } else if (monate_vorzeitig_oder_spaeter > 0) {
    // Später
    zugangsfaktor = 1 + monate_vorzeitig_oder_spaeter * zuschlag_pro_monat;
    type = "spaeter";
  }

  const rente_monatlich = rente_basis * zugangsfaktor;
  const differenz = rente_monatlich - rente_basis;
  const factor_prozent = Math.round(zugangsfaktor * 1000) / 10;

  return {
    rentenpunkte,
    monate: monate_vorzeitig_oder_spaeter,
    type,
    rente_basis: rund(rente_basis),
    zugangsfaktor,
    factor_prozent,
    rente_monatlich: rund(rente_monatlich),
    differenz: rund(differenz),
    rentenwert: rentenwert_west
  };
}
