/**
 * BAfoeg-Rechner 2026
 * Bedarfssaetze, Elternfreibetraege, Geschwisterabzug, Anrechnung.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface BafoegParams {
  wohnform: "extern" | "eltern";
  hatKV: boolean;                   // Hat KV/PV-Zuschlag?
  elternEinkommen: number;          // Monatliches Netto der Eltern
  elternVerheiratet: boolean;
  geschwisterInAusbildung: number;  // 0-5
}

export interface BafoegResult {
  bedarfMax: number;
  elternFreibetrag: number;
  anrechenbaresElternEinkommen: number;
  elternAnrechnung: number;
  bafoegAnspruch: number;
  darlehensMax: number;
  hatAnspruch: boolean;
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { wohnform, hatKV, elternEinkommen, elternVerheiratet, geschwisterInAusbildung }: BafoegParams,
  rates: RatesType = RATES,
): BafoegResult {
  const r = rates.bafoeg;

  // 1. Bedarfssatz
  let bedarfMax: number;
  if (wohnform === "extern") {
    bedarfMax = r.bedarfssaetze.extern_grundbetrag + r.bedarfssaetze.extern_unterkunft;
  } else {
    bedarfMax = r.bedarfssaetze.elternwohnung;
  }

  if (hatKV) {
    bedarfMax += r.bedarfssaetze.kv_zuschlag + r.bedarfssaetze.pv_zuschlag;
  }

  // 2. Eltern-Freibetrag
  const basisFreibetrag = elternVerheiratet
    ? r.freibetraege.eltern_verheiratet_monat
    : r.freibetraege.eltern_alleinstehend_monat;

  const geschwisterFreibetrag = geschwisterInAusbildung * r.freibetraege.geschwister_in_ausbildung_monat;
  const elternFreibetrag = basisFreibetrag + geschwisterFreibetrag;

  // 3. Anrechenbares Elterneinkommen
  const anrechenbaresElternEinkommen = rund(Math.max(0, elternEinkommen - elternFreibetrag));

  // 4. Elternanrechnung (50 % des anrechenbaren Einkommens)
  const elternAnrechnung = rund(anrechenbaresElternEinkommen * (r.einkommensanrechnung_eltern_prozent / 100));

  // 5. BAfoeg-Anspruch
  const bafoegAnspruch = rund(Math.max(0, bedarfMax - elternAnrechnung));
  const hatAnspruch = bafoegAnspruch > 0;

  // 6. Darlehens-Maximum
  const darlehensMax = r.darlehens_max_gesamt;

  return {
    bedarfMax: rund(bedarfMax),
    elternFreibetrag,
    anrechenbaresElternEinkommen,
    elternAnrechnung,
    bafoegAnspruch,
    darlehensMax,
    hatAnspruch,
  };
}
