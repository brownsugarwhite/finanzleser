import { RATES } from "./rates";
import { rund } from "./utils";

export interface KirchensteuerParams {
  lohnsteuer_jahr: number;
  bundesland: string;
}

export interface KirchensteuerResult {
  lohnsteuer_jahr: number;
  bundesland: string;
  satz_prozent: number;
  kirchensteuer_jahr: number;
  kirchensteuer_monat: number;
}

export function berechne(
  { lohnsteuer_jahr, bundesland }: KirchensteuerParams,
  rates: typeof RATES = RATES
): KirchensteuerResult {
  const satz8Bundeslaender = rates.kirchensteuer.satz_8_prozent_bundeslaender;
  const satz = satz8Bundeslaender.includes(bundesland) ? 0.08 : 0.09;

  const kirchensteuer_jahr = rund(lohnsteuer_jahr * satz);
  const kirchensteuer_monat = rund(kirchensteuer_jahr / 12);

  return {
    lohnsteuer_jahr,
    bundesland,
    satz_prozent: Math.round(satz * 100),
    kirchensteuer_jahr,
    kirchensteuer_monat
  };
}
