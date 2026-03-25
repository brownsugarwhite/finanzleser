import { RATES } from "./rates";
import { rund } from "./utils";

export interface WitwenrenteParams {
  rentenpunkte_verstorbener: number;
  ist_grosse_witwenrente: boolean;
  alter_witwe: number;
}

export interface WitwenrenteResult {
  rentenpunkte_verstorbener: number;
  rente_verstorbener: number;
  ist_grosse_witwenrente: boolean;
  satz_witwenrente: number;
  witwenrente_monatlich: number;
  zeitlich_begrenzt: boolean;
  hinweis: string;
}

export function berechne(
  {
    rentenpunkte_verstorbener,
    ist_grosse_witwenrente,
    alter_witwe
  }: WitwenrenteParams,
  rates: typeof RATES = RATES
): WitwenrenteResult {
  // Rentenwert from rates.json
  const rentenwert = rates.witwenrente.rentenwert_west;
  const rente_verstorbener = rund(rentenpunkte_verstorbener * rentenwert);

  // Sätze für Witwenrente from rates.json
  const satz_witwenrente = ist_grosse_witwenrente ? rates.witwenrente.grosse_wr_faktor : rates.witwenrente.kleine_wr_faktor;
  const witwenrente_monatlich = rund(rente_verstorbener * satz_witwenrente);

  const zeitlich_begrenzt =
    !ist_grosse_witwenrente && alter_witwe < 45;

  const hinweis = zeitlich_begrenzt
    ? "Kleine Witwenrente wird nach 24 Monaten beendet, es sei denn, die Voraussetzungen für Große Witwenrente werden erfüllt."
    : "Große Witwenrente wird auf Lebenszeit gewährt.";

  return {
    rentenpunkte_verstorbener,
    rente_verstorbener,
    ist_grosse_witwenrente,
    satz_witwenrente: rund(satz_witwenrente * 100),
    witwenrente_monatlich,
    zeitlich_begrenzt,
    hinweis
  };
}
