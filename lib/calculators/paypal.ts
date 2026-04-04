import { RATES } from "./rates";
import { rund } from "./utils";

export type PaypalTyp = "haendler_inland" | "haendler_international" | "freunde_kreditkarte";

export interface PaypalParams {
  betrag: number;
  typ: PaypalTyp;
}

export interface PaypalResult {
  bruttoBetrag: number;
  gebuehr: number;
  nettoBetrag: number;
  gebuehrProzent: number;
}

export function berechne(
  { betrag, typ }: PaypalParams,
  rates: typeof RATES = RATES
): PaypalResult {
  const paypal = rates.paypal;

  let prozent: number;
  let fix: number;

  switch (typ) {
    case "haendler_inland":
      prozent = paypal.haendler_inland_prozent;
      fix = paypal.haendler_inland_fix;
      break;
    case "haendler_international":
      prozent = paypal.haendler_international_prozent;
      fix = paypal.haendler_international_fix;
      break;
    case "freunde_kreditkarte":
      prozent = paypal.freunde_kreditkarte_prozent;
      fix = paypal.freunde_kreditkarte_fix;
      break;
  }

  const gebuehr = rund(betrag * (prozent / 100) + fix);
  const nettoBetrag = rund(betrag - gebuehr);
  const gebuehrProzent = betrag > 0 ? rund((gebuehr / betrag) * 100) : 0;

  return {
    bruttoBetrag: rund(betrag),
    gebuehr,
    nettoBetrag,
    gebuehrProzent,
  };
}
