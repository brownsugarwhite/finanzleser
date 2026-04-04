/**
 * Elterngeld-Rechner 2026
 * BEEG-Netto-Berechnung (standardisierte SV 21,9 % + progressive ESt),
 * Ersatzrate 65-67 %, Min/Max-Clamp, ElterngeldPlus.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";
import { berechneESt } from "./shared/estg32a";

type RatesType = typeof RATES;

/* ── Params & Result ─────────────────────────────────── */

export interface ElterngeldParams {
  monatsBrutto: number;   // Durchschnittliches Monatsbrutto der letzten 12 Monate
  zvEJahr: number;        // Zu versteuerndes Einkommen (Jahreswert, für Einkommensprüfung)
}

export interface ElterngeldResult {
  monatsBrutto: number;
  beegNetto: number;
  ersatzrateProzent: number;
  basisElterngeld: number;
  elterngeldPlus: number;
  gesamtBasis: number;    // 12 Monate Basiselterngeld
  gesamtPlus: number;     // 24 Monate ElterngeldPlus
  keinAnspruch: boolean;  // zvE > Einkommensgrenze
}

/* ── Berechnung ──────────────────────────────────────── */

export function berechne(
  { monatsBrutto, zvEJahr }: ElterngeldParams,
  rates: RatesType = RATES,
): ElterngeldResult {
  const r = rates.elterngeld;

  // 1. Einkommensprüfung (§ 1 Abs. 8 BEEG)
  const keinAnspruch = zvEJahr > r.einkommensgrenze_zu_verst_einkommen;

  // 2. BEEG-Netto: standardisierte SV (21,9 %) + progressive Lohnsteuer
  const svPauschale = 0.219; // Standardisierte SV-Pauschale nach BEEG
  const svAbzug = rund(monatsBrutto * svPauschale);
  const jahresBrutto = monatsBrutto * 12;
  const jahreSV = svAbzug * 12;
  const zvEBeeg = Math.max(0, jahresBrutto - jahreSV);
  const estJahr = berechneESt(zvEBeeg, rates);
  const estMonat = rund(estJahr / 12);
  const beegNetto = rund(monatsBrutto - svAbzug - estMonat);

  // 3. Ersatzrate nach § 2 Abs. 2 BEEG (65-67 %)
  let ersatzrateProzent: number;
  if (beegNetto < r.netto_grenze_erhoehen_von) {
    // Unter 1.000 €: Erhöhung um 0,1 % je 2 € unter 1.000 € (max. 67 %)
    const diff = r.netto_grenze_erhoehen_von - beegNetto;
    const erhoehung = Math.floor(diff / 2) * 0.1;
    ersatzrateProzent = Math.min(r.ersatzrate_erhoehen_prozent, r.ersatzrate_standard_prozent + erhoehung);
  } else if (beegNetto > r.netto_grenze_uebergang) {
    // Über 1.240 €: Absenkung um 0,1 % je 2 € über 1.240 € (min. 65 %)
    // Absenkung nur in Theorie bis 65 % — bei normalem Einkommen immer 65 %
    ersatzrateProzent = r.ersatzrate_standard_prozent;
  } else {
    // Übergangszone 1.000-1.240 €: 67 %
    ersatzrateProzent = r.ersatzrate_erhoehen_prozent;
  }

  // 4. Basiselterngeld berechnen und clampen
  let basisElterngeld = rund(beegNetto * (ersatzrateProzent / 100));
  basisElterngeld = Math.max(r.basiselterngeld.min, Math.min(r.basiselterngeld.max, basisElterngeld));

  // 5. ElterngeldPlus = halber Basiswert, eigene Grenzen
  let elterngeldPlus = rund(basisElterngeld / 2);
  elterngeldPlus = Math.max(r.elterngeldplus.min, Math.min(r.elterngeldplus.max, elterngeldPlus));

  // Bei keinem Anspruch alles auf 0
  if (keinAnspruch) {
    return {
      monatsBrutto,
      beegNetto: rund(beegNetto),
      ersatzrateProzent: 0,
      basisElterngeld: 0,
      elterngeldPlus: 0,
      gesamtBasis: 0,
      gesamtPlus: 0,
      keinAnspruch: true,
    };
  }

  return {
    monatsBrutto,
    beegNetto: rund(beegNetto),
    ersatzrateProzent: rund(ersatzrateProzent),
    basisElterngeld,
    elterngeldPlus,
    gesamtBasis: rund(basisElterngeld * 12),
    gesamtPlus: rund(elterngeldPlus * 24),
    keinAnspruch: false,
  };
}
