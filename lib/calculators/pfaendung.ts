/**
 * Pfaendungs-Rechner 2026
 * Berechnet pfaendbares Einkommen nach § 850c ZPO.
 * Grundfreibetrag + Erhoehung je Unterhaltspflicht.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

/* ── Params & Result ────────��───────────────────────���── */

export interface PfaendungParams {
  monatsNetto: number;
  unterhaltspflichten: number; // 0-5
}

export interface PfaendungResult {
  grundfreibetrag: number;
  erhoehung: number;
  gesamtFreibetrag: number;
  pfaendbarerBetrag: number;
  verbleibendesEinkommen: number;
}

/* ── Berechnung ───────────���──────────────────────────── */

export function berechne(
  { monatsNetto, unterhaltspflichten }: PfaendungParams,
  rates: RatesType = RATES,
): PfaendungResult {
  const r = rates.pfaendung;

  // 1. Grundfreibetrag
  const grundfreibetrag = r.grundfreibetrag_monat;

  // 2. Erhöhung für Unterhaltspflichten
  //    1. Person: erhoehung_erste_person, weitere: erhoehung_weitere_person
  let erhoehung = 0;
  if (unterhaltspflichten >= 1) {
    erhoehung += r.erhoehung_erste_person;
  }
  if (unterhaltspflichten >= 2) {
    erhoehung += (unterhaltspflichten - 1) * r.erhoehung_weitere_person;
  }
  erhoehung = rund(erhoehung);

  // 3. Gesamter Freibetrag
  const gesamtFreibetrag = rund(grundfreibetrag + erhoehung);

  // 4. Pfändbarer Betrag (70 % des Betrags über dem Freibetrag)
  const ueberFreibetrag = Math.max(0, monatsNetto - gesamtFreibetrag);
  const pfaendbarerBetrag = rund(ueberFreibetrag * r.pfaendungsquote_zone);

  // 5. Verbleibendes Einkommen
  const verbleibendesEinkommen = rund(monatsNetto - pfaendbarerBetrag);

  return {
    grundfreibetrag,
    erhoehung,
    gesamtFreibetrag,
    pfaendbarerBetrag,
    verbleibendesEinkommen,
  };
}
