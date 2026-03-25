import { RATES } from "./rates";
import { rund } from "./utils";

export interface MinijobParams {
  monatlicher_verdienst: number;
  rv_befreiung: boolean;
}

export interface MinijobResult {
  monatlicher_verdienst: number;
  kategorie: "minijob" | "midijob" | "regulaer";
  netto_arbeitnehmer: number;
  kosten_arbeitgeber: number;
  pauschale_kv_prozent: number;
  pauschale_rv_prozent: number;
  pauschale_steuer_prozent: number;
  geschaetzte_stunden_monat: number;
  hinweis?: string;
}

export function berechne(
  { monatlicher_verdienst, rv_befreiung }: MinijobParams,
  rates: typeof RATES = RATES
): MinijobResult {
  const mindestlohn = rates.mindestlohn?.stundensatz || 13.9;
  const grenzen = { minijob: rates.minijob.minijob_grenze_monatlich, midijob_max: rates.minijob.gleitzone_obergrenze };

  let kategorie: "minijob" | "midijob" | "regulaer";
  let netto_arbeitnehmer: number;
  let kosten_arbeitgeber: number;
  let pauschale_kv = rates.minijob.ag_kv_pauschale_prozent / 100;
  let pauschale_rv = rv_befreiung ? 0 : (rates.minijob.ag_rv_pauschale_prozent / 100);
  let pauschale_steuer = rates.minijob.ag_steuerpauschale_prozent / 100;

  if (monatlicher_verdienst <= grenzen.minijob) {
    kategorie = "minijob";
    netto_arbeitnehmer = monatlicher_verdienst;
    kosten_arbeitgeber = rund(monatlicher_verdienst * (1 + pauschale_kv + pauschale_rv + pauschale_steuer));
  } else if (monatlicher_verdienst <= grenzen.midijob_max) {
    kategorie = "midijob";
    const faktor = rates.minijob.gleitzonenformel_faktor_F;
    const bemessung = monatlicher_verdienst * faktor;
    const sv_abzug = rund(bemessung * (0.11 + (rv_befreiung ? 0 : 0.093)));
    netto_arbeitnehmer = rund(monatlicher_verdienst - sv_abzug);
    kosten_arbeitgeber = rund(monatlicher_verdienst + (monatlicher_verdienst * (pauschale_kv + 0.01)));
  } else {
    kategorie = "regulaer";
    netto_arbeitnehmer = monatlicher_verdienst * 0.8;
    kosten_arbeitgeber = monatlicher_verdienst * 1.2;
  }

  const geschaetzte_stunden_monat = rund(monatlicher_verdienst / mindestlohn);

  let hinweis = undefined;
  if (kategorie === "minijob") {
    hinweis = "Minijob: Pauschalversichert, keine Lohnsteuer";
  } else if (kategorie === "midijob") {
    hinweis = "Midijob: Gleitzone mit reduziertem SV-Beitrag";
  }

  return {
    monatlicher_verdienst,
    kategorie,
    netto_arbeitnehmer,
    kosten_arbeitgeber,
    pauschale_kv_prozent: Math.round(pauschale_kv * 100),
    pauschale_rv_prozent: Math.round(pauschale_rv * 100),
    pauschale_steuer_prozent: Math.round(pauschale_steuer * 100),
    geschaetzte_stunden_monat,
    hinweis
  };
}
