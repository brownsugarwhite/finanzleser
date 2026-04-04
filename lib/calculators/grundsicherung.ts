/**
 * Grundsicherung-Rechner 2026
 * Grundsicherung im Alter und bei Erwerbsminderung (§§ 41-46b SGB XII).
 * Regelbedarfe, Freibetrag auf Rente.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface GrundsicherungParams {
  alleinstehend: boolean;
  monatlicheRente: number;
  sonstigesEinkommen: number;
}

export interface GrundsicherungResult {
  regelbedarf: number;
  freibetragRente: number;
  anrechenbareRente: number;
  anrechenbaresSonstiges: number;
  anspruch: number;
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { alleinstehend, monatlicheRente, sonstigesEinkommen }: GrundsicherungParams,
  rates: RatesType = RATES,
): GrundsicherungResult {
  const rb = rates.grundsicherung.regelbedarfe_2026;

  // 1. Regelbedarf
  const regelbedarf = alleinstehend
    ? rb.stufe1_alleinstehende
    : rb.stufe2_paare_je_partner * 2;

  // 2. Freibetrag auf Rente (§ 82 Abs. 4 SGB XII)
  //    30 % der Rente, maximal 50 % des Eckregelsatzes (Stufe 1)
  const freibetragMax = rund(rb.stufe1_alleinstehende * (rates.grundsicherung.freibetrag_rente_max / 100));
  const freibetragRente = rund(
    Math.min(
      monatlicheRente * (rates.grundsicherung.freibetrag_rente_prozent / 100),
      freibetragMax,
    ),
  );

  // 3. Anrechenbares Einkommen
  const anrechenbareRente = rund(Math.max(0, monatlicheRente - freibetragRente));
  const anrechenbaresSonstiges = rund(Math.max(0, sonstigesEinkommen)); // Voll angerechnet

  // 4. Anspruch
  const anspruch = rund(
    Math.max(0, regelbedarf - anrechenbareRente - anrechenbaresSonstiges),
  );

  return {
    regelbedarf,
    freibetragRente,
    anrechenbareRente,
    anrechenbaresSonstiges,
    anspruch,
  };
}
