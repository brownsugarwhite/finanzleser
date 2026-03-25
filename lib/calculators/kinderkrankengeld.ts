import { RATES } from "./rates";
import { rund } from "./utils";

export interface KinderkrankentagParams {
  nettolohn_tag: number;
  krankheitstage: number;
  mehrere_kinder: boolean;
}

export interface KinderkrankentagResult {
  nettolohn_tag: number;
  krankheitstage: number;
  kinderkrankengeld_pro_tag: number;
  kinderkrankengeld_gesamt: number;
  jahresanspruch: number;
  mehrere_kinder: boolean;
}

export function berechne(
  {
    nettolohn_tag,
    krankheitstage,
    mehrere_kinder
  }: KinderkrankentagParams,
  rates: typeof RATES = RATES
): KinderkrankentagResult {
  // KV zahlt max. netto_grenze_prozent % des Nettoeinkommens pro Tag
  const netto_grenze_prozent = rates.kinderkrankengeld.netto_grenze_prozent / 100;
  const kinderkrankengeld_pro_tag = rund(nettolohn_tag * netto_grenze_prozent);
  const kinderkrankengeld_gesamt = rund(kinderkrankengeld_pro_tag * krankheitstage);

  // Jahresanspruch pro Kind from rates.kinderkrankengeld.anspruchstage_2026
  const anspruchstage = rates.kinderkrankengeld.anspruchstage_2026;
  const jahresanspruch_arbeitnehmer = mehrere_kinder
    ? anspruchstage.je_elternteil_je_kind_ab3_kindern
    : anspruchstage.je_elternteil_je_kind; // Tage
  const jahresanspruch_alleinerziehend = mehrere_kinder
    ? anspruchstage.alleinerziehend_max
    : anspruchstage.alleinerziehend_je_kind; // Tage
  const jahresanspruch = jahresanspruch_arbeitnehmer; // Default

  return {
    nettolohn_tag,
    krankheitstage,
    kinderkrankengeld_pro_tag,
    kinderkrankengeld_gesamt,
    jahresanspruch,
    mehrere_kinder
  };
}
