/**
 * Kindergeld-Rechner 2026
 * Berechnet Kindergeld und Kinderfreibetrag-Vergleich.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface KindergeldParams {
  anzahlKinder: number; // 1-10
}

export interface KindergeldResult {
  kindergeldProKind: number;
  kindergeldMonatlich: number;
  kindergeldJaehrlich: number;
  kinderfreibetragJeElternteil: number;
  kinderfreibetragBeideEltern: number;
  anzahlKinder: number;
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { anzahlKinder }: KindergeldParams,
  rates: RatesType = RATES,
): KindergeldResult {
  const r = rates.kindergeld;

  const kindergeldProKind = r.monatlich_je_kind;
  const kindergeldMonatlich = rund(kindergeldProKind * anzahlKinder);
  const kindergeldJaehrlich = rund(kindergeldMonatlich * 12);

  return {
    kindergeldProKind,
    kindergeldMonatlich,
    kindergeldJaehrlich,
    kinderfreibetragJeElternteil: r.kinderfreibetrag_gesamt_je_elternteil,
    kinderfreibetragBeideEltern: r.kinderfreibetrag_gesamt_beide_eltern,
    anzahlKinder,
  };
}
