/**
 * Wohngeld-Rechner 2026
 * Vollstaendige WoGG-Formel mit Anlage 1 (Hoechstbetraege), Anlage 2 (Koeffizienten),
 * Anlage 3 (Mindest-M/Y) und Klimafaktor.
 * W = klimaFaktor * (M - (a + b*M + c*Y) * Y)
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface WohngeldParams {
  haushaltsmitglieder: number; // 1-12
  bruttoMiete: number;         // Bruttokaltmiete inkl. Nebenkosten
  mietenstufe: number;         // 1-7
  monatsEinkommen: number;     // Monatliches Gesamteinkommen
}

export interface WohngeldResult {
  anrechenbareMiete: number;
  hoechstbetrag: number;
  monatsEinkommen: number;
  wohngeldMonatlich: number;
  wohngeldJaehrlich: number;
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { haushaltsmitglieder, bruttoMiete, mietenstufe, monatsEinkommen }: WohngeldParams,
  rates: RatesType = RATES,
): WohngeldResult {
  const r = rates.wohngeld;

  // Haushaltsgröße clampen auf 1-12
  const hh = Math.max(1, Math.min(12, haushaltsmitglieder));
  const hhKey = String(hh) as keyof typeof r.hoechstbetraege_anlage1;

  // Mietenstufe clampen auf 1-7 (Index 0-6)
  const ms = Math.max(1, Math.min(7, mietenstufe));
  const msIndex = ms - 1;

  // 1. Höchstbetrag aus Anlage 1
  const hoechstbetraegeRow = r.hoechstbetraege_anlage1[hhKey];
  const hoechstbetrag = (hoechstbetraegeRow as number[])[msIndex];

  // 2. Anrechenbare Miete M = min(Bruttomiete, Höchstbetrag)
  let M = Math.min(bruttoMiete, hoechstbetrag);

  // 3. Mindest-M aus Anlage 3
  const mindestMRow = r.mindest_M_anlage3;
  const mindestM = mindestMRow[hhKey as keyof typeof mindestMRow] as number;
  M = Math.max(M, mindestM);

  // 4. Monatliches Einkommen Y (min. aus Anlage 3)
  const mindestYRow = r.mindest_Y_anlage3;
  const mindestY = mindestYRow[hhKey as keyof typeof mindestYRow] as number;
  const Y = Math.max(monatsEinkommen, mindestY);

  // 5. Koeffizienten aus Anlage 2
  const koeff = r.koeffizienten_anlage2[hhKey as keyof typeof r.koeffizienten_anlage2] as { a: number; b: number; c: number };
  const a = koeff.a;
  const b = koeff.b;
  const c = koeff.c;

  // 6. WoGG-Formel: W = klimaFaktor * (M - (a + b*M + c*Y) * Y)
  const klimaFaktor = r.klima_faktor;
  const innerTerm = (a + b * M + c * Y) * Y;
  const wRaw = klimaFaktor * (M - innerTerm);

  // Mindest-Wohngeld
  const wohngeldMonatlich = rund(Math.max(0, wRaw));

  return {
    anrechenbareMiete: rund(M),
    hoechstbetrag,
    monatsEinkommen: rund(Y),
    wohngeldMonatlich,
    wohngeldJaehrlich: rund(wohngeldMonatlich * 12),
  };
}
