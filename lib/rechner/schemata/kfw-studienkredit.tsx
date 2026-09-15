/**
 * KfW-Studienkredit-Rechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KfwStudienkreditRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/kfw-studienkredit.ts. Neu ist nur der Satz.
 */
import { berechne, type KfwStudienkreditParams, type KfwStudienkreditResult } from "@/lib/calculators/kfw-studienkredit";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KfwStudienkreditParams & Record<string, number | string | boolean>;

export const kfwStudienkreditSchema: RechnerSchema<W, KfwStudienkreditResult> = {
  slug: "kfw-studienkredit",
  titel: "KfW-Studienkredit-Rechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · KfW-Studienkredit-Rechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { auszahlungMonat: 650, auszahlungMonate: 14, zinssatzPa: 6.85, karenzMonate: 18, tilgungMonate: 120 } as W,

  felder: [
    { baustein: "setzzeile", key: "auszahlungMonat", label: "Monatliche Auszahlung", min: 100, max: 650, schritt: 50, einheit: "EUR" },
    { baustein: "drehring", key: "auszahlungMonate", label: "Auszahlungsdauer", min: 1, max: 84, schritt: 1, einheit: "Monate", gross: 8 },
    { baustein: "zaehlwerk", key: "zinssatzPa", label: "Zinssatz p.a.", min: 0, max: 15, schritt: 0.01, einheit: "%", dez: 2 },
    { baustein: "drehring", key: "karenzMonate", label: "Karenzphase", min: 0, max: 23, schritt: 1, einheit: "Monate", gross: 2 },
    { baustein: "setzzeile", key: "tilgungMonate", label: "Tilgungsdauer", min: 1, max: 300, schritt: 1, einheit: "Monate" },
  ],

  rechne: (w) => berechne(w),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatsrate Tilgung", wert: e.monatsrate, text: fmtGeld },
        { label: "Gesamtrueckzahlung", wert: e.gesamtRueckzahlung, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Gesamte Auszahlung", v: fmtGeld(e.gesamtAuszahlung) },
        { k: "Gesamte Zinsen", v: fmtGeld(e.gesamtZinsen) },
        { k: "Monatsrate (Tilgung)", v: fmtGeld(e.monatsrate) },
        { k: "Gesamtrueckzahlung", v: fmtGeld(e.gesamtRueckzahlung) },
      ],
    },
    { art: "hinweis", text: "KfW-Studienkredit (Programm 174): Zinssatz wird halbjaehrlich angepasst. Waehrend Auszahlung und Karenzphase fallen Zinsen an, die zum Kapital addiert werden." },
  ],
};
