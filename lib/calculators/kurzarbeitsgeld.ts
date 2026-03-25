import { RATES } from "./rates";
import { rund } from "./utils";

export interface KurzarbeitssgeldParams {
  regelmaessiges_gehalt: number; // Regelmäßiges monatliches Gehalt
  ausgefallene_stunden: number; // Ausgefallene Arbeitsstunden pro Woche
  gesamtstunden_pro_woche: number; // Normale Arbeitszeit pro Woche
  monate: number; // Dauer in Monaten
}

export interface KurzarbeitssgeldResult {
  regelmaessiges_gehalt: number;
  ausfallquote: number;
  kurzarbeitsgeld_monatlich: number;
  kurzarbeitsgeld_gesamt: number;
  einkommensverlust: number;
}

// Vereinfachte Kurzarbeitsgeld-Berechnung
// Kurzarbeitsgeld ersetzt 60% des wegfallenden Nettoentgelts
export function berechne({
  regelmaessiges_gehalt,
  ausgefallene_stunden,
  gesamtstunden_pro_woche,
  monate,
}: KurzarbeitssgeldParams, rates: typeof RATES = RATES): KurzarbeitssgeldResult {
  // Ausfallquote berechnen
  const ausfallquote = ausgefallene_stunden / gesamtstunden_pro_woche;

  // Vereinfachte Berechnung: 60% des wegfallenden Nettoentgelts
  // Annahme: Netto ca. 80% des Bruttos
  const netto_anteil = 0.8;
  const wegfallender_netto = regelmaessiges_gehalt * netto_anteil * ausfallquote;
  const kurzarbeitsgeld_monatlich = rund(wegfallender_netto * 0.6);

  const kurzarbeitsgeld_gesamt = rund(kurzarbeitsgeld_monatlich * monate);
  const einkommensverlust = rund(wegfallender_netto * monate);

  return {
    regelmaessiges_gehalt,
    ausfallquote: rund(ausfallquote * 100) / 100,
    kurzarbeitsgeld_monatlich,
    kurzarbeitsgeld_gesamt,
    einkommensverlust,
  };
}
