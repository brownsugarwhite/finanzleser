import { RATES } from "./rates";
import { rund } from "./utils";

export interface ElterngeldParams {
  einkommen_vor_geburt: number; // Durchschnittliches Nettoeinkommen vor Geburt
  anzahl_kinder: number; // 1 = erstes Kind, 2 = zweites+ Kind (für Mehrlingszuschlag)
  basiselterngeld: boolean; // true = Basiselterngeld, false = Elterngeld Plus
}

export interface ElterngeldResult {
  einkommen_vor_geburt: number;
  elterngeld_monatlich: number;
  elterngeld_jaehrlich: number;
  gesamtdauer_monate: number;
}

// Vereinfachte Elterngeldberechnung 2026
export function berechne({
  einkommen_vor_geburt,
  anzahl_kinder,
  basiselterngeld,
}: ElterngeldParams, rates: typeof RATES = RATES): ElterngeldResult {
  // Elterngeld: 65% des durchschnittlichen Nettoeinkommens
  // Minimum: 300 €, Maximum: 1800 € pro Monat
  const quote = 0.65;
  let elterngeld_monatlich = einkommen_vor_geburt * quote;

  // Mindest- und Höchstbetrag
  elterngeld_monatlich = Math.max(300, Math.min(1800, elterngeld_monatlich));

  // Mehrlingszuschlag (25% für jedes weitere Kind)
  if (anzahl_kinder > 1) {
    elterngeld_monatlich = elterngeld_monatlich * (1 + (anzahl_kinder - 1) * 0.25);
  }

  elterngeld_monatlich = rund(elterngeld_monatlich);

  // Bezugsdauer: 12 oder 14 Monate für Basiselterngeld
  // Für Elterngeld Plus: 24 oder 28 Monate (mit halber Leistung)
  const gesamtdauer_monate = basiselterngeld ? 12 : 24;

  const elterngeld_jaehrlich = rund(elterngeld_monatlich * 12);

  return {
    einkommen_vor_geburt,
    elterngeld_monatlich,
    elterngeld_jaehrlich,
    gesamtdauer_monate,
  };
}
