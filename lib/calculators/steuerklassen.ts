import { RATES } from "./rates";
import { rund } from "./utils";

export interface SteuerklassenParams {
  monatsBrutto: number;
  steuerklasse: number;
  kinder: number;
}

export interface SteuerklassenResult {
  steuerklasse: number;
  steuerklasse_beschreibung: string;
  monatsBrutto: number;
  lohnsteuer_monatlich: number;
  netto_monatlich: number;
  effektiver_steuersatz: number;
}

export function berechne(
  { monatsBrutto, steuerklasse, kinder }: SteuerklassenParams,
  rates: typeof RATES = RATES
): SteuerklassenResult {
  // Vereinfachte Steuerberechnung pro Klasse
  const steuersaetze: Record<number, number> = {
    1: 0.22,
    2: 0.20,
    3: 0.16,
    4: 0.22,
    5: 0.26,
    6: 0.30
  };

  const beschreibungen: Record<number, string> = {
    1: "Ledig, kinderlos",
    2: "Ledig, Anspruch Entlastungsbetrag",
    3: "Verheiratet/LP, höheres Einkommen",
    4: "Verheiratet/LP, ähnliches Einkommen",
    5: "Verheiratet/LP, Ehegatte hat Klasse III",
    6: "Mehrfachbesteuerung"
  };

  const satz = steuersaetze[steuerklasse] || steuersaetze[1];
  const lohnsteuer_monatlich = rund(monatsBrutto * satz);
  const netto_monatlich = rund(monatsBrutto - lohnsteuer_monatlich);
  const effektiver_steuersatz = rund((lohnsteuer_monatlich / monatsBrutto) * 100);

  return {
    steuerklasse,
    steuerklasse_beschreibung: beschreibungen[steuerklasse] || "Unbekannt",
    monatsBrutto,
    lohnsteuer_monatlich,
    netto_monatlich,
    effektiver_steuersatz
  };
}
