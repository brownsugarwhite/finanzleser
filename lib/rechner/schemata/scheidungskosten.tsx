/**
 * Scheidungskosten-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/ScheidungskostenRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/scheidungskosten.ts. Neu ist nur der Satz.
 */
import { berechne, type ScheidungskostenParams, type ScheidungskostenResult } from "@/lib/calculators/scheidungskosten";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = ScheidungskostenParams & Record<string, number | string | boolean>;

export const scheidungskostenSchema: RechnerSchema<W, ScheidungskostenResult> = {
  slug: "scheidungskosten",
  titel: "Scheidungskosten-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Scheidungskosten-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { nettoeinkommenBeide: 5000, vermoegen: 50000, versorgungsausgleich: true } as W,

  felder: [
    { baustein: "setzzeile", key: "nettoeinkommenBeide", label: "Nettoeinkommen beider Ehegatten", min: 0, max: 15000, schritt: 100, einheit: "EUR/Monat" },
    { baustein: "setzzeile", key: "vermoegen", label: "Vermögen (gemeinsam)", min: 0, max: 1000000, schritt: 1000, einheit: "EUR" },
    { baustein: "schalter", key: "versorgungsausgleich", label: "Versorgungsausgleich" },
  ],

  rechne: (w) => berechne(w),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamtkosten Scheidung", wert: e.gesamtkosten, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Verfahrenswert", v: fmtGeld(e.verfahrenswert) },
        { k: "Gerichtskosten", v: fmtGeld(e.gerichtskosten) },
        { k: "Anwaltskosten (2 Anwaelte)", v: fmtGeld(e.anwaltskosten) },
      ],
    },
    { art: "hinweis", text: "Verfahrenswert = 3 x Nettoeinkommen + 5 % Vermögen. Bei Versorgungsausgleich wird der Verfahrenswert um 10 % erhoeht. Anwaltskosten berechnet für 2 Anwaelte nach RVG (Verfahrens- und Terminsgebuehr + Post + MwSt)." },
  ],
};
