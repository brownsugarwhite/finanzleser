import { RATES } from "./rates";
import { rund } from "./utils";

export interface UrlaubsanspruchParams {
  arbeitstage_jahr: number;
  beschaeftigungsmonate: number;
  hat_tarifvertrag: boolean;
}

export interface UrlaubsanspruchResult {
  arbeitstage_jahr: number;
  beschaeftigungsmonate: number;
  mindesturlaubstage_gesetz: number;
  mindesturlaubstage_beschaeftigung: number;
  anspruch: number;
  hat_tarifvertrag: boolean;
  hinweis: string;
}

export function berechne(
  {
    arbeitstage_jahr,
    beschaeftigungsmonate,
    hat_tarifvertrag
  }: UrlaubsanspruchParams,
  rates: typeof RATES = RATES
): UrlaubsanspruchResult {
  // Gesetzlich Mindesturlaub from rates.json (§ 1 BUrlG)
  // Gesetz: 24 Werktage = 4,8 Tage/Woche = 4 Tage/5-Tage-Woche
  const mindesturlaubstage_gesetz = rates.urlaubsanspruch.gesetzlicher_mindesturlaub_werktage / 6;

  // Anteilig für Beschäftigungsmonate
  const mindesturlaubstage_beschaeftigung = rund(
    (mindesturlaubstage_gesetz / 12) * beschaeftigungsmonate
  );

  // Bei Tarifvertrag oft mehr (z.B. 24–30 Tage)
  let anspruch = mindesturlaubstage_beschaeftigung;
  if (hat_tarifvertrag) {
    anspruch = rund((30 / 12) * beschaeftigungsmonate);
  }

  // Anteilig auf Arbeitstage pro Jahr
  const anteiliger_anspruch = rund(
    (anspruch / 20) * arbeitstage_jahr
  );

  const hinweis = hat_tarifvertrag
    ? "Mit Tarifvertrag häufig 24–30 Tage/Jahr"
    : "Mindestens 20 Tage/Jahr nach BUrlG";

  return {
    arbeitstage_jahr,
    beschaeftigungsmonate,
    mindesturlaubstage_gesetz,
    mindesturlaubstage_beschaeftigung,
    anspruch: anteiliger_anspruch,
    hat_tarifvertrag,
    hinweis
  };
}
