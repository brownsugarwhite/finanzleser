import { RATES } from "./rates";
import { rund } from "./utils";

export interface GruendungszuschussParams {
  algMonatlich: number;
}

export interface GruendungszuschussResult {
  phase1Monatlich: number;
  phase1Gesamt: number;
  phase2Monatlich: number;
  phase2Gesamt: number;
  gesamtFoerderung: number;
}

export function berechne(
  { algMonatlich }: GruendungszuschussParams,
  rates = RATES
): GruendungszuschussResult {
  const r = rates.gruendungszuschuss;

  // Phase 1: ALG + Pauschale (300 EUR) fuer 6 Monate
  const phase1Monatlich = rund(algMonatlich + r.pauschale_phase1_monat);
  const phase1Gesamt = rund(phase1Monatlich * r.dauer_phase1_monate);

  // Phase 2: Nur Pauschale (300 EUR) fuer 9 Monate
  const phase2Monatlich = r.pauschale_phase2_monat;
  const phase2Gesamt = rund(phase2Monatlich * r.dauer_phase2_monate);

  const gesamtFoerderung = rund(phase1Gesamt + phase2Gesamt);

  return {
    phase1Monatlich,
    phase1Gesamt,
    phase2Monatlich,
    phase2Gesamt,
    gesamtFoerderung,
  };
}
