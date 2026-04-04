import { RATES } from "./rates";
import { rund } from "./utils";

export interface HaushaltsrechnerParams {
  einkommen: number;
  miete: number;
  nebenkosten: number;
  lebensmittel: number;
  versicherungen: number;
  mobilitaet: number;
  freizeit: number;
  sonstiges: number;
}

export interface HaushaltsrechnerResult {
  gesamtAusgaben: number;
  sparBetrag: number;
  sparQuoteProzent: number;
  notgroschenMonate: number;
}

export function berechne(
  { einkommen, miete, nebenkosten, lebensmittel, versicherungen, mobilitaet, freizeit, sonstiges }: HaushaltsrechnerParams,
  rates: typeof RATES = RATES
): HaushaltsrechnerResult {
  const gesamtAusgaben = rund(miete + nebenkosten + lebensmittel + versicherungen + mobilitaet + freizeit + sonstiges);
  const sparBetrag = rund(einkommen - gesamtAusgaben);
  const sparQuoteProzent = einkommen > 0 ? rund((sparBetrag / einkommen) * 100) : 0;
  const notgroschenMonate = gesamtAusgaben > 0 ? rund(sparBetrag / gesamtAusgaben) : 0;

  return {
    gesamtAusgaben,
    sparBetrag,
    sparQuoteProzent,
    notgroschenMonate,
  };
}
