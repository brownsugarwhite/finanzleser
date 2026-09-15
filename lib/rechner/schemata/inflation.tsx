/**
 * Inflationsrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/InflationRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/inflation.ts. Neu ist nur der Satz.
 */
import { berechne, type InflationParams, type InflationResult } from "@/lib/calculators/inflation";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = InflationParams & Record<string, number | string | boolean>;

export const inflationSchema: RechnerSchema<W, InflationResult> = {
  slug: "inflation",
  titel: "Inflationsrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Inflationsrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { betrag: 1000, inflationsrateProzent: 2.5, jahre: 10 } as W,

  felder: [
    { baustein: "setzzeile", key: "betrag", label: "Betrag", min: 1, max: 100000, schritt: 100, einheit: "€" },
    { baustein: "zaehlwerk", key: "inflationsrateProzent", label: "Inflationsrate", min: 0, max: 15, schritt: 0.1, einheit: "%", dez: 1 },
    { baustein: "drehring", key: "jahre", label: "Zeitraum", min: 1, max: 50, schritt: 1, einheit: "Jahre", gross: 5 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Reeller Wert", wert: e.reellerWert, text: fmtGeld, haupt: true },
        { label: "Kaufkraftverlust", wert: e.kaufkraftVerlust, text: fmtGeld },
        { label: "Benötigter Betrag", wert: e.benoetigt, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Heutiger Betrag", v: fmtGeld(w.betrag) },
        { k: "Inflationsrate", v: fmtProzent(w.inflationsrateProzent) },
        { k: "Zeitraum", v: `${w.jahre} Jahre` },
        { k: "Reeller Wert", v: fmtGeld(e.reellerWert) },
        { k: "Kaufkraftverlust", v: `${fmtGeld(e.kaufkraftVerlust)} (${fmtProzent(e.verlustProzent)})` },
        { k: "Benötigter Betrag für gleiche Kaufkraft", v: fmtGeld(e.benoetigt) },
      ],
    },
    {
      art: "tabelle",
      titel: "Aufstellung",
      spalten: [{ key: "jahr", label: "Jahr" }, { key: "reellerWert", label: "Reeller Wert", rechts: true }, { key: "kaufkraftVerlust", label: "Kaufkraftverlust", rechts: true }, { key: "benoetigt", label: "Benötigt", rechts: true }],
      zeilen: e.jahresplan.map((row) => ({ jahr: String(row.jahr), reellerWert: fmtGeld(row.reellerWert), kaufkraftVerlust: fmtGeld(row.kaufkraftVerlust), benoetigt: fmtGeld(row.benoetigt), })),
    },
    { art: "zeiger", label: "Kaufkraftverlust", wert: Math.max(0, Math.min(100, Math.round(e.verlustProzent))) },
    { art: "hinweis", text: "Zeigt, wie viel Kaufkraft ein Betrag durch Inflation verliert. Der „benötigte Betrag„ ist der Wert, den Sie in Zukunft brauchen, um die gleiche Kaufkraft wie heute zu haben." },
  ],
};
