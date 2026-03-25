import { RATES } from "./rates";
import { rund } from "./utils";

export interface PendlerpauschaleParams {
  entfernung_km: number;
  arbeitstage_jahr: number;
  oepnv_kosten_jahr?: number;
}

export interface PendlerpauschaleResult {
  entfernung_km: number;
  arbeitstage_jahr: number;
  pauschale_roh: number;
  werbungskosten: number;
  deckelt: boolean;
  werbungskosten_monat: number;
  steuerersparnis_20: number;
  steuerersparnis_30: number;
  steuerersparnis_42: number;
}

export function berechne(
  { entfernung_km, arbeitstage_jahr, oepnv_kosten_jahr }: PendlerpauschaleParams,
  rates: typeof RATES = RATES
): PendlerpauschaleResult {
  // Sätze from rates.json
  const satz_bis_20km = rates.pendlerpauschale.pauschale_bis_20km;
  const satz_ab_21km = rates.pendlerpauschale.pauschale_ab_21km;
  const deckel_jahr = rates.pendlerpauschale.max_pauschale_pkw;

  // Pauschale berechnen
  let pauschale_roh = 0;
  if (entfernung_km <= 20) {
    pauschale_roh = entfernung_km * satz_bis_20km * arbeitstage_jahr;
  } else {
    const erste_20km = 20 * satz_bis_20km * arbeitstage_jahr;
    const weitere_km = (entfernung_km - 20) * satz_ab_21km * arbeitstage_jahr;
    pauschale_roh = erste_20km + weitere_km;
  }

  // Vergleich mit ÖPNV-Kosten
  let werbungskosten = pauschale_roh;
  if (oepnv_kosten_jahr && oepnv_kosten_jahr > pauschale_roh) {
    werbungskosten = oepnv_kosten_jahr;
  }

  // Deckelung
  const deckelt = werbungskosten > deckel_jahr;
  werbungskosten = Math.min(werbungskosten, deckel_jahr);

  const werbungskosten_monat = rund(werbungskosten / 12);

  // Steuerersparnis bei verschiedenen Grenzsteuersätzen
  const steuerersparnis_20 = rund(werbungskosten * 0.2);
  const steuerersparnis_30 = rund(werbungskosten * 0.3);
  const steuerersparnis_42 = rund(werbungskosten * 0.42);

  return {
    entfernung_km,
    arbeitstage_jahr,
    pauschale_roh: rund(pauschale_roh),
    werbungskosten: rund(werbungskosten),
    deckelt,
    werbungskosten_monat,
    steuerersparnis_20,
    steuerersparnis_30,
    steuerersparnis_42
  };
}
