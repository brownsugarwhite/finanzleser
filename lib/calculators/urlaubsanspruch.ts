import { RATES } from "./rates";
import { rund } from "./utils";

export interface UrlaubsanspruchParams {
  arbeitstageWoche: 5 | 6;
  schwerbehinderung: boolean;
}

export interface UrlaubsanspruchResult {
  mindesturlaubWerktage: number;
  mindesturlaubArbeitstage: number;
  zusatzurlaub: number;
  gesamtAnspruch: number;
}

export function berechne(
  { arbeitstageWoche, schwerbehinderung }: UrlaubsanspruchParams,
  rates = RATES
): UrlaubsanspruchResult {
  const r = rates.urlaubsanspruch;
  const mindesturlaubWerktage = r.gesetzlicher_mindesturlaub_werktage;

  // Umrechnung Werktage (6-Tage-Woche) auf tatsaechliche Arbeitstage
  const mindesturlaubArbeitstage = rund(
    (mindesturlaubWerktage / 6) * arbeitstageWoche
  );

  // Zusatzurlaub bei Schwerbehinderung (bezogen auf Arbeitstage)
  const zusatzurlaub = schwerbehinderung
    ? rund((r.zusatzurlaub_schwerbehinderung_tage / 5) * arbeitstageWoche)
    : 0;

  const gesamtAnspruch = rund(mindesturlaubArbeitstage + zusatzurlaub);

  return {
    mindesturlaubWerktage,
    mindesturlaubArbeitstage,
    zusatzurlaub,
    gesamtAnspruch,
  };
}
