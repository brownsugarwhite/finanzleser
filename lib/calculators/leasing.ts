import { RATES } from "./rates";
import { rund } from "./utils";

export interface LeasingParams {
  fahrzeugpreis: number;
  laufzeit_monate: number;
  zinssatz_prozent: number;
  restwert_prozent: number;
}

export interface LeasingResult {
  fahrzeugpreis: number;
  laufzeit_monate: number;
  zinssatz_prozent: number;
  restwert: number;
  leasingrate_monatlich: number;
  gesamtkosten: number;
  vergleich_kauf_rate: number;
}

export function berechne(
  {
    fahrzeugpreis,
    laufzeit_monate,
    zinssatz_prozent,
    restwert_prozent
  }: LeasingParams,
  rates: typeof RATES = RATES
): LeasingResult {
  // Restwert am Ende der Laufzeit
  const restwert = rund(fahrzeugpreis * (restwert_prozent / 100));

  // Leasingfähiger Betrag
  const leasingfaehig = fahrzeugpreis - restwert;

  // Leasing-Rate (vereinfachte Annuitätenmethode)
  const zinssatz_monatlich = zinssatz_prozent / 100 / 12;
  const n = laufzeit_monate;

  let leasingrate_monatlich;
  if (zinssatz_monatlich === 0) {
    leasingrate_monatlich = leasingfaehig / n;
  } else {
    leasingrate_monatlich =
      (leasingfaehig *
        (zinssatz_monatlich * Math.pow(1 + zinssatz_monatlich, n))) /
      (Math.pow(1 + zinssatz_monatlich, n) - 1);
  }

  const gesamtkosten = rund(leasingrate_monatlich * laufzeit_monate);
  const vergleich_kauf_rate = rund(fahrzeugpreis / laufzeit_monate);

  return {
    fahrzeugpreis,
    laufzeit_monate,
    zinssatz_prozent,
    restwert,
    leasingrate_monatlich: rund(leasingrate_monatlich),
    gesamtkosten,
    vergleich_kauf_rate
  };
}
