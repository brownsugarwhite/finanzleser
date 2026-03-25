import { RATES } from "./rates";
import { rund } from "./utils";

export interface TeilzeitParams {
  vollzeit_brutto: number;
  stunden_pro_woche_neu: number;
  stunden_pro_woche_alt: number;
}

export interface TeilzeitResult {
  vollzeit_brutto: number;
  stunden_pro_woche_alt: number;
  stunden_pro_woche_neu: number;
  reduktion_prozent: number;
  teilzeit_brutto: number;
  brutto_differenz: number;
  netto_monatlich_alt: number;
  netto_monatlich_neu: number;
  netto_differenz: number;
}

export function berechne(
  {
    vollzeit_brutto,
    stunden_pro_woche_neu,
    stunden_pro_woche_alt
  }: TeilzeitParams,
  rates: typeof RATES = RATES
): TeilzeitResult {
  const reduktion_prozent = rund(
    ((stunden_pro_woche_alt - stunden_pro_woche_neu) / stunden_pro_woche_alt) *
      100
  );

  const teilzeit_brutto = rund(
    vollzeit_brutto * (stunden_pro_woche_neu / stunden_pro_woche_alt)
  );

  const brutto_differenz = rund(vollzeit_brutto - teilzeit_brutto);

  // Vereinfachte Netto-Berechnung (20% SV + 10% Lohnsteuer)
  const sv_pauschale = 0.2;
  const netto_monatlich_alt = rund(vollzeit_brutto * (1 - sv_pauschale));
  const netto_monatlich_neu = rund(teilzeit_brutto * (1 - sv_pauschale));
  const netto_differenz = rund(netto_monatlich_alt - netto_monatlich_neu);

  return {
    vollzeit_brutto,
    stunden_pro_woche_alt,
    stunden_pro_woche_neu,
    reduktion_prozent,
    teilzeit_brutto,
    brutto_differenz,
    netto_monatlich_alt,
    netto_monatlich_neu,
    netto_differenz
  };
}
