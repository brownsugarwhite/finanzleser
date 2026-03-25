import { RATES } from "./rates";
import { rund } from "./utils";

export interface RentenabschlagParams {
  regelaltersgrenze_monate: number;
  vorzeitiger_beginn_monate: number;
  rentenpunkte: number;
}

export interface RentenabschlagResult {
  regelaltersgrenze_monate: number;
  vorzeitiger_beginn_monate: number;
  monate_vorzeitig: number;
  abschlag_prozent: number;
  rente_basis: number;
  rente_mit_abschlag: number;
  rentenminderung_absolut: number;
}

export function berechne(
  {
    regelaltersgrenze_monate,
    vorzeitiger_beginn_monate,
    rentenpunkte
  }: RentenabschlagParams,
  rates: typeof RATES = RATES
): RentenabschlagResult {
  const monate_vorzeitig = regelaltersgrenze_monate - vorzeitiger_beginn_monate;

  // Abschlag from rates.json
  const abschlag_prozent = Math.min(monate_vorzeitig * rates.rentenabschlag.abschlag_pro_monat_prozent, rates.rentenabschlag.max_abschlag_prozent);

  // Rentenwert from rates.json
  const rentenwert = rates.rente.rentenwert_ab_01jul_2026;
  const rente_basis = rund(rentenpunkte * rentenwert);
  const rente_mit_abschlag = rund(rente_basis * (1 - abschlag_prozent / 100));
  const rentenminderung_absolut = rund(rente_basis - rente_mit_abschlag);

  return {
    regelaltersgrenze_monate,
    vorzeitiger_beginn_monate,
    monate_vorzeitig,
    abschlag_prozent: rund(abschlag_prozent),
    rente_basis,
    rente_mit_abschlag,
    rentenminderung_absolut
  };
}
