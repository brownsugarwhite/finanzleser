import { rund } from "./utils";

export interface KfzSteuerParams {
  hubraum: number; // in ccm
  co2_ausstoss: number; // in g/km
  anmeldungsjahr: number; // Erstzulassung Jahr
}

export interface KfzSteuerResult {
  hubraum: number;
  co2_ausstoss: number;
  anmeldungsjahr: number;
  steuer_monatlich: number;
  steuer_jaehrlich: number;
}

// Vereinfachte KFZ-Steuer 2026
// Nach §9 KraftStG: 2 € pro 100 ccm + CO2-basierter Zuschlag
export function berechne({
  hubraum,
  co2_ausstoss,
  anmeldungsjahr,
}: KfzSteuerParams): KfzSteuerResult {
  // Hubraum-basierte Grundsteuer: 2,00 € pro 100 ccm
  const grundsteuer = (Math.ceil(hubraum / 100) * 2.0);

  // CO2-Zuschlag (ab 2026: 2 € pro g/km über 120 g/km)
  let co2_zuschlag = 0;
  if (co2_ausstoss > 120) {
    co2_zuschlag = (co2_ausstoss - 120) * 2.0;
  }

  // Reduktion für ältere Fahrzeuge
  const fahrzeugalter = new Date().getFullYear() - anmeldungsjahr;
  let reduktion = 1.0;

  if (fahrzeugalter > 15) {
    reduktion = 0.85; // 15% Reduktion nach 15 Jahren
  }

  const steuer_jaehrlich = rund((grundsteuer + co2_zuschlag) * reduktion);
  const steuer_monatlich = rund(steuer_jaehrlich / 12);

  return {
    hubraum,
    co2_ausstoss,
    anmeldungsjahr,
    steuer_monatlich,
    steuer_jaehrlich,
  };
}
