/**
 * Elternzeit-Rechner 2026
 * Berechnet Elternzeit-Zeiträume basierend auf Geburtsdatum,
 * Partnermonate und Übertragung auf später.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface ElternzeitParams {
  geburtYear: number;
  geburtMonth: number;       // 1-12
  partnerMonate: number;     // 0-14 Monate (Partnermonate vom Gesamtkontingent)
  uebertragMonateSpater: number; // 0-12 Monate, die auf später (bis 8. Geburtstag) übertragen werden
}

export interface ElternzeitResult {
  maxMonate: number;
  anmeldeFristWochen: number;
  schutzEnde: string;          // Datum: Ende Mutterschutz (8 Wochen nach Geburt)
  elternzeitStart: string;     // Datum: Beginn Elternzeit
  elternzeitEnde: string;      // Datum: Ende der durchgehenden Elternzeit
  monateErsterAbschnitt: number;
  monateSpater: number;
  partnerMonate: number;
}

/* ── Hilfsfunktion ───────────────────────────────────── */

function fmtDate(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { geburtYear, geburtMonth, partnerMonate, uebertragMonateSpater }: ElternzeitParams,
  rates: RatesType = RATES,
): ElternzeitResult {
  const r = rates.elternzeit;
  const maxMonate = r.max_monate_gesamt;
  const anmeldeFristWochen = r.anmeldung_frist_wochen;

  // Geburt am 1. des Monats (Vereinfachung)
  const geburt = new Date(geburtYear, geburtMonth - 1, 1);

  // Mutterschutz-Ende: 8 Wochen nach Geburt
  const schutzEnde = new Date(geburt);
  schutzEnde.setDate(schutzEnde.getDate() + 8 * 7);

  // Elternzeit startet nach Mutterschutz
  const elternzeitStart = new Date(schutzEnde);

  // Clamp Partner-Monate und Übertrag
  const clampedPartner = Math.min(Math.max(0, partnerMonate), 14);
  const maxUebertrag = Math.min(
    r.uebertragbare_monate_auf_spaeter,
    maxMonate - clampedPartner,
  );
  const clampedUebertrag = Math.min(Math.max(0, uebertragMonateSpater), maxUebertrag);

  // Erster zusammenhängender Abschnitt
  const monateErsterAbschnitt = maxMonate - clampedPartner - clampedUebertrag;

  // Elternzeit-Ende des ersten Abschnitts
  const elternzeitEnde = new Date(elternzeitStart);
  elternzeitEnde.setMonth(elternzeitEnde.getMonth() + monateErsterAbschnitt);

  return {
    maxMonate,
    anmeldeFristWochen,
    schutzEnde: fmtDate(schutzEnde),
    elternzeitStart: fmtDate(elternzeitStart),
    elternzeitEnde: fmtDate(elternzeitEnde),
    monateErsterAbschnitt,
    monateSpater: clampedUebertrag,
    partnerMonate: clampedPartner,
  };
}
