/**
 * Leasingrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/LeasingRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/leasing.ts. Neu ist nur der Satz.
 */
import { berechne, type LeasingParams, type LeasingResult } from "@/lib/calculators/leasing";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = LeasingParams & Record<string, number | string | boolean>;

export const leasingSchema: RechnerSchema<W, LeasingResult> = {
  slug: "leasing",
  titel: "Leasingrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Leasingrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { kaufpreis: 30000, laufzeitMonate: 36, restwertProzent: 40, zinssatzPa: 4.0, anzahlung: 0 } as W,

  felder: [
    { baustein: "lineal", key: "kaufpreis", label: "Kaufpreis", min: 0, max: 150000, schritt: 1000, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "drehring", key: "laufzeitMonate", label: "Laufzeit", min: 12, max: 84, schritt: 6, einheit: "Monate", gross: 1 },
    { baustein: "zaehlwerk", key: "restwertProzent", label: "Restwert", min: 0, max: 100, schritt: 5, einheit: "%" },
    { baustein: "zaehlwerk", key: "zinssatzPa", label: "Zinssatz p.a.", min: 0, max: 15, schritt: 0.1, einheit: "%", dez: 1 },
    { baustein: "lineal", key: "anzahlung", label: "Anzahlung", min: 0, max: 30000, schritt: 500, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Leasingrate / Monat", wert: e.leasingrate, text: fmtGeld, haupt: true },
        { label: "Gesamtkosten", wert: e.gesamtKosten, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Kaufpreis", v: fmtGeld(w.kaufpreis) },
        { k: "Anzahlung", v: fmtGeld(w.anzahlung) },
        { k: "Restwert", v: fmtGeld(e.restwert) },
        { k: "Laufzeit", v: `${w.laufzeitMonate} Monate` },
        { k: "Zinssatz p.a.", v: fmtProzent(w.zinssatzPa) },
        { k: "Leasingrate / Monat", v: fmtGeld(e.leasingrate) },
        { k: "Zinskosten", v: fmtGeld(e.zinskosten) },
        { k: "Gesamtkosten", v: fmtGeld(e.gesamtKosten) },
      ],
    },
    { art: "hinweis", text: "Diese Berechnung basiert auf der Annuitätenmethode. Tatsächliche Leasing-Raten können durch Versicherung, Wartung und Kilometerkosten abweichen." },
  ],
};
