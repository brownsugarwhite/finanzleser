/**
 * Buergergeld-Rechner 2026
 * Regelbedarfe nach Haushalt-/Kindertyp, Freibetraege auf Erwerbseinkommen.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export type HaushaltTyp =
  | "alleinstehend"
  | "paar"
  | "alleinerziehend_kinder"
  | "paar_kinder";

export interface BuergergeldParams {
  haushaltTyp: HaushaltTyp;
  anzahlKinder06: number;   // 0-5
  anzahlKinder713: number;  // 0-5
  anzahlKinder1417: number; // 0-5
  eigenesEinkommen: number; // Bruttoerwerbseinkommen
}

export interface BuergergeldResult {
  regelbedarf: number;
  kinderBedarf: number;
  gesamtBedarf: number;
  freibetrag: number;
  anrechenbaresEinkommen: number;
  buergergeldAnspruch: number;
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { haushaltTyp, anzahlKinder06, anzahlKinder713, anzahlKinder1417, eigenesEinkommen }: BuergergeldParams,
  rates: RatesType = RATES,
): BuergergeldResult {
  const rb = rates.buergergeld.regelbedarfe_2026;
  const fb = rates.buergergeld.freibetraege;

  // 1. Regelbedarf Erwachsene
  let regelbedarf: number;
  switch (haushaltTyp) {
    case "alleinstehend":
    case "alleinerziehend_kinder":
      regelbedarf = rb.stufe1_alleinstehende;
      break;
    case "paar":
    case "paar_kinder":
      regelbedarf = rb.stufe2_paare_je_partner * 2;
      break;
  }

  // 2. Kinderbedarf
  const kinderBedarf =
    anzahlKinder06 * rb.stufe6_kinder_0_5 +
    anzahlKinder713 * rb.stufe5_kinder_6_13 +
    anzahlKinder1417 * rb.stufe4_jugendliche_14_17;

  const gesamtBedarf = regelbedarf + kinderBedarf;

  // 3. Freibeträge auf Erwerbseinkommen (§ 11b SGB II)
  //    Grundfreibetrag 100 €
  //    100-1.000 €: 20 % Freibetrag
  //    1.000-1.200 €: 10 % Freibetrag
  let freibetrag = 0;
  if (eigenesEinkommen > 0) {
    // Grundfreibetrag
    freibetrag += Math.min(eigenesEinkommen, fb.grundfreibetrag);

    // 20% auf 100-1.000 €
    if (eigenesEinkommen > fb.grundfreibetrag) {
      const anteil20 = Math.min(eigenesEinkommen - fb.grundfreibetrag, 1000 - fb.grundfreibetrag);
      freibetrag += anteil20 * (fb.freibetrag_prozent_100_1000 / 100);
    }

    // 10% auf 1.000-1.200 €
    if (eigenesEinkommen > 1000) {
      const anteil10 = Math.min(eigenesEinkommen - 1000, 200);
      freibetrag += anteil10 * (fb.freibetrag_prozent_1000_1200 / 100);
    }
  }
  freibetrag = rund(freibetrag);

  const anrechenbaresEinkommen = rund(Math.max(0, eigenesEinkommen - freibetrag));
  const buergergeldAnspruch = rund(Math.max(0, gesamtBedarf - anrechenbaresEinkommen));

  return {
    regelbedarf,
    kinderBedarf,
    gesamtBedarf,
    freibetrag,
    anrechenbaresEinkommen,
    buergergeldAnspruch,
  };
}
