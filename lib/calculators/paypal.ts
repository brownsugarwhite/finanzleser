import { RATES } from "./rates";
import { rund } from "./utils";

export interface PaypalParams {
  umsatz_monatlich: number;
  transaktionsgebuehr_prozent: number;
  fixgebuehr: number;
}

export interface PaypalResult {
  umsatz_monatlich: number;
  transaktionsgebuehr: number;
  fixgebuehr: number;
  gebuehr_gesamt: number;
  gebuehr_prozent: number;
  netto_nach_gebuehr: number;
}

export function berechne(
  {
    umsatz_monatlich,
    transaktionsgebuehr_prozent,
    fixgebuehr
  }: PaypalParams,
  rates: typeof RATES = RATES
): PaypalResult {
  // PayPal Gebühren from rates.json
  const gebuehr_prozent = transaktionsgebuehr_prozent || (rates.paypal.haendler_inland_prozent);
  const transaktionsgebuehr = rund(umsatz_monatlich * (gebuehr_prozent / 100));
  const gebuehr_gesamt = transaktionsgebuehr + (fixgebuehr || rates.paypal.haendler_inland_fix);
  const netto_nach_gebuehr = rund(umsatz_monatlich - gebuehr_gesamt);

  const gebuehr_prozent_effektiv = umsatz_monatlich > 0
    ? rund((gebuehr_gesamt / umsatz_monatlich) * 100)
    : 0;

  return {
    umsatz_monatlich,
    transaktionsgebuehr: rund(transaktionsgebuehr),
    fixgebuehr,
    gebuehr_gesamt: rund(gebuehr_gesamt),
    gebuehr_prozent: gebuehr_prozent_effektiv,
    netto_nach_gebuehr
  };
}
