/**
 * Pendlerpauschale-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/PendlerpauschaleRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/pendlerpauschale.ts. Neu ist nur der Satz.
 */
import { berechne, type PendlerpauschaleParams, type PendlerpauschaleResult } from "@/lib/calculators/pendlerpauschale";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = PendlerpauschaleParams & Record<string, number | string | boolean>;

export const pendlerpauschaleSchema: RechnerSchema<W, PendlerpauschaleResult> = {
  slug: "pendlerpauschale",
  titel: "Pendlerpauschale-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Pendlerpauschale-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { entfernungKm: 30, arbeitstage: 220 } as W,

  felder: [
    { baustein: "setzzeile", key: "entfernungKm", label: "Entfernung Wohnung - Arbeitsplatz (einfach)", min: 1, max: 200, schritt: 1, einheit: "km" },
    { baustein: "setzzeile", key: "arbeitstage", label: "Arbeitstage pro Jahr", min: 1, max: 365, schritt: 1, einheit: "Tage" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Pendlerpauschale/Jahr", wert: e.pauschale, text: fmtGeld },
        { label: "Steuererstattung (ca. 30 %)", wert: e.steuererstattungCa, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Km 1-20 (0,30 EUR)", v: fmtGeld(e.km1Bis20) },
        { k: "Km ab 21 (0,38 EUR)", v: fmtGeld(e.km21Plus) },
        { k: "Pauschale gesamt", v: fmtGeld(e.pauschale) },
        { k: "Steuererstattung (ca.)", v: fmtGeld(e.steuererstattungCa) },
      ],
    },
    { art: "hinweis", text: "Obergrenze erreicht: Die Pauschale ist auf 4.500 EUR/Jahr gedeckelt." },
    { art: "hinweis", text: "Der erhoehte Satz von 0,38 EUR/km ab 21 km gilt bis 31.12.2026." },
  ],
};
