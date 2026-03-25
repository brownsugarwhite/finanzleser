import { RATES } from "./rates";
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
}: KfzSteuerParams, rates: typeof RATES = RATES): KfzSteuerResult {
  // Hubraum-basierte Grundsteuer from rates.json
  const satz_je_100ccm = rates.kfz_steuer.hubraum_benzin_euro_je_100ccm;
  const grundsteuer = (Math.ceil(hubraum / 100) * satz_je_100ccm);

  // CO2-Zuschlag from rates.json
  const co2_freibetrag = rates.kfz_steuer.co2_freibetrag_g_km;
  let co2_zuschlag = 0;
  if (co2_ausstoss > co2_freibetrag) {
    const co2_ueber_freibetrag = co2_ausstoss - co2_freibetrag;
    // Find the appropriate rate from co2_stufen
    const stufe = rates.kfz_steuer.co2_stufen.find(s => co2_ueber_freibetrag <= s.bis);
    if (stufe) {
      co2_zuschlag = co2_ueber_freibetrag * stufe.euro_je_g;
    }
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
