import { rund } from "./utils";

export interface MehrwertsteuerParams {
  betrag: number;
  richtung: "brutto-netto" | "netto-brutto";
  steuersatz: 19 | 7;
}

export interface MehrwertsteuerResult {
  netto: number;
  mehrwertsteuer: number;
  brutto: number;
  steuersatz: number;
}

export function berechne({
  betrag,
  richtung,
  steuersatz,
}: MehrwertsteuerParams): MehrwertsteuerResult {
  const satz = steuersatz / 100;

  if (richtung === "brutto-netto") {
    const netto = rund(betrag / (1 + satz));
    const mwst = rund(betrag - netto);
    return {
      netto,
      mehrwertsteuer: mwst,
      brutto: rund(betrag),
      steuersatz,
    };
  } else {
    const mwst = rund(betrag * satz);
    const brutto = rund(betrag + mwst);
    return {
      netto: rund(betrag),
      mehrwertsteuer: mwst,
      brutto,
      steuersatz,
    };
  }
}
