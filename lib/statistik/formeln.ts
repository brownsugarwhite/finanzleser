/**
 * Formeln für den Regler einer Statistik: Allowlist der Rechner aus lib/calculators.
 * Ein Regler darf nur rechnen, was ein Rechner der Seite auch rechnet (gleiche Zahlen
 * wie die Werkzeugkarte, gleiche Kurse aus useRates). Typ „faktor“ skaliert linear.
 */
import { RATES, type Rates } from "@/lib/calculators/rates";
import * as kindergeld from "@/lib/calculators/kindergeld";
import * as unterhalt from "@/lib/calculators/unterhalt";
import * as elterngeld from "@/lib/calculators/elterngeld";
import * as zinseszins from "@/lib/calculators/zinseszins";
import * as inflation from "@/lib/calculators/inflation";
import * as tilgung from "@/lib/calculators/tilgung";
import * as rente from "@/lib/calculators/rente";
import * as rentenbesteuerung from "@/lib/calculators/rentenbesteuerung";
import type { StatistikFormel } from "@/lib/types";

type Eingaben = Record<string, number | string | boolean>;
interface Formel { berechne: (p: Eingaben, rates: Rates) => Record<string, unknown>; standard: Eingaben }

/* eslint-disable @typescript-eslint/no-explicit-any */
export const FORMELN: Record<string, Formel> = {
  kindergeld: { berechne: (p, r) => kindergeld.berechne(p as any, r) as any, standard: { anzahlKinder: 1 } },
  unterhalt: { berechne: (p, r) => unterhalt.berechne(p as any, r) as any, standard: { nettoEinkommen: 3000, sonstigeAbzuege: 0, kindAlter: 8, unterhaltsberechtigte: 1, erwerbstaetig: true } },
  elterngeld: { berechne: (p, r) => elterngeld.berechne(p as any, r) as any, standard: { monatsBrutto: 3000, zvEJahr: 36000 } },
  zinseszins: { berechne: (p, r) => zinseszins.berechne(p as any, r) as any, standard: { startkapital: 10000, monatlicheSparrate: 100, zinssatzPa: 4, laufzeitJahre: 10 } },
  inflation: { berechne: (p, r) => inflation.berechne(p as any, r) as any, standard: { betrag: 10000, inflationsrateProzent: 2, jahre: 10 } },
  tilgung: { berechne: (p, r) => tilgung.berechne(p as any, r) as any, standard: { darlehensbetrag: 300000, zinssatzPa: 3.5, anfangstilgungPa: 2, sondertilgungJahr: 0 } },
  rente: { berechne: (p, r) => rente.berechne(p as any, r) as any, standard: { geburtsjahr: 1975, beitragsjahre: 45, jahresBrutto: 50000, bekannteEntgeltpunkte: 0 } },
  rentenbesteuerung: { berechne: (p, r) => rentenbesteuerung.berechne(p as any, r) as any, standard: { monatlicheRente: 1500, rentenBeginnJahr: 2026 } },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const FORMEL_RECHNER = Object.keys(FORMELN);

/** Reglerwert → Ausgabe des Rechners; null, wenn Rechner, Eingabe oder Ausgabe unbekannt sind. */
export function rechne(f: StatistikFormel, wert: number, rates: Rates = RATES): number | null {
  if (f.typ !== "rechner" || !f.rechner || !f.eingabe || !f.ausgabe) return null;
  const formel = FORMELN[f.rechner];
  if (!formel) return null;
  try {
    const out = formel.berechne({ ...formel.standard, ...(f.basis || {}), [f.eingabe]: wert }, rates);
    const v = out[f.ausgabe];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Zahl mit Einheit auf Deutsch: 1.234 €, 12,5 %, 3,7 Monate. */
export function formatWert(wert: number, einheit?: string): string {
  const e = (einheit || "").trim();
  const abs = Math.abs(wert);
  const dezimal = e === "%" ? (Number.isInteger(wert) ? 0 : 1) : abs >= 100 ? 0 : Number.isInteger(wert) ? 0 : 1;
  const zahl = wert.toLocaleString("de-DE", { minimumFractionDigits: dezimal, maximumFractionDigits: dezimal });
  if (!e) return zahl;
  if (e === "%" || e === "€") return `${zahl} ${e}`;
  return `${zahl} ${e}`;
}
