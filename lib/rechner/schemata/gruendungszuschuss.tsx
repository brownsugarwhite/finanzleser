/**
 * Gruendungszuschuss-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/GruendungszuschussRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/gruendungszuschuss.ts. Neu ist nur der Satz.
 */
import { berechne, type GruendungszuschussParams, type GruendungszuschussResult } from "@/lib/calculators/gruendungszuschuss";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = GruendungszuschussParams & Record<string, number | string | boolean>;

export const gruendungszuschussSchema: RechnerSchema<W, GruendungszuschussResult> = {
  slug: "gruendungszuschuss",
  titel: "Gruendungszuschuss-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Gruendungszuschuss-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { algMonatlich: 1200 } as W,

  felder: [
    { baustein: "setzzeile", key: "algMonatlich", label: "ALG I monatlich", min: 0, max: 3000, schritt: 50, einheit: "EUR" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamtförderung", wert: e.gesamtFoerderung, text: fmtGeld },
        { label: "Phase 1 / Monat", wert: e.phase1Monatlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "ALG I + Pauschale (300 EUR)", v: fmtGeld(e.phase1Monatlich) },
        { k: "Phase 1 gesamt", v: fmtGeld(e.phase1Gesamt) },
        { k: "Pauschale / Monat", v: fmtGeld(e.phase2Monatlich) },
        { k: "Phase 2 gesamt", v: fmtGeld(e.phase2Gesamt) },
      ],
    },
    { art: "hinweis", text: "Phase 1: ALG I + 300 EUR Pauschale für 6 Monate. Phase 2: 300 EUR Pauschale für weitere 9 Monate (Bewilligung auf Antrag). Grundlage: Paragraph 93 SGB III." },
  ],
};
