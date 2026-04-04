/**
 * Mutterschutz-Rechner 2026
 * Berechnet Schutzfristen, Mutterschaftsgeld und Arbeitgeberzuschuss.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface MutterschutzParams {
  entbindungYear: number;
  entbindungMonth: number; // 1-12
  entbindungDay: number;   // 1-31
  monatsNetto: number;     // Netto-Monatslohn
  istGKV: boolean;         // Gesetzlich krankenversichert?
}

export interface MutterschutzResult {
  schutzfristVon: string;       // Beginn Mutterschutz (6 Wochen vor ET)
  schutzfristBis: string;       // Ende Mutterschutz (8 Wochen nach ET)
  schutzTageGesamt: number;
  mutterschaftsgeldTag: number; // KK-Tagessatz (max. 13 €)
  arbeitgeberZuschussTag: number;
  gesamtTagessatz: number;
  gesamtMutterschaftsgeld: number;
  gesamtArbeitgeberzuschuss: number;
  gesamtLeistung: number;
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
  { entbindungYear, entbindungMonth, entbindungDay, monatsNetto, istGKV }: MutterschutzParams,
  rates: RatesType = RATES,
): MutterschutzResult {
  const r = rates.mutterschutz;

  const et = new Date(entbindungYear, entbindungMonth - 1, entbindungDay);

  // Schutzfristen
  const wochenVor = r.schutzfrist_vor_geburt_wochen;
  const wochenNach = r.schutzfrist_nach_geburt_wochen;

  const schutzVon = new Date(et);
  schutzVon.setDate(schutzVon.getDate() - wochenVor * 7);

  const schutzBis = new Date(et);
  schutzBis.setDate(schutzBis.getDate() + wochenNach * 7);

  const schutzTageGesamt = Math.ceil(
    (schutzBis.getTime() - schutzVon.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Mutterschaftsgeld (GKV: max. 13 €/Tag, PKV: Einmalzahlung 210 €)
  const nettoTag = rund(monatsNetto / 30);
  let mutterschaftsgeldTag: number;
  if (istGKV) {
    mutterschaftsgeldTag = Math.min(r.mutterschaftsgeld_max_tag_gkv, nettoTag);
  } else {
    // PKV: Einmalzahlung 210 €, auf Tage umgelegt zum Vergleich
    mutterschaftsgeldTag = rund(r.mutterschaftsgeld_pauschal_privat / schutzTageGesamt);
  }

  // Arbeitgeberzuschuss: Differenz zwischen Netto-Tageslohn und KK-Tagessatz
  const arbeitgeberZuschussTag = Math.max(0, rund(nettoTag - mutterschaftsgeldTag));
  const gesamtTagessatz = rund(mutterschaftsgeldTag + arbeitgeberZuschussTag);

  return {
    schutzfristVon: fmtDate(schutzVon),
    schutzfristBis: fmtDate(schutzBis),
    schutzTageGesamt,
    mutterschaftsgeldTag: rund(mutterschaftsgeldTag),
    arbeitgeberZuschussTag,
    gesamtTagessatz,
    gesamtMutterschaftsgeld: rund(mutterschaftsgeldTag * schutzTageGesamt),
    gesamtArbeitgeberzuschuss: rund(arbeitgeberZuschussTag * schutzTageGesamt),
    gesamtLeistung: rund(gesamtTagessatz * schutzTageGesamt),
  };
}
