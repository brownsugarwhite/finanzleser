/**
 * BAfoeg-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/BafoegRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/bafoeg.ts. Neu ist nur der Satz.
 */
import { berechne, type BafoegParams, type BafoegResult } from "@/lib/calculators/bafoeg";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = BafoegParams & Record<string, number | string | boolean>;

export const bafoegSchema: RechnerSchema<W, BafoegResult> = {
  slug: "bafoeg",
  titel: "BAföG-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · BAföG-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { wohnform: "extern", hatKV: true, elternEinkommen: 3000, elternVerheiratet: true, geschwisterInAusbildung: 0 } as W,

  felder: [
    { baustein: "register", key: "wohnform", label: "Wohnform", optionen: [{ wert: "extern", label: "Eigene Wohnung" }, { wert: "eltern", label: "Bei den Eltern" }] },
    { baustein: "schalter", key: "hatKV", label: "Kranken-/Pflegeversicherungszuschlag" },
    { baustein: "lineal", key: "elternEinkommen", label: "Monatliches Netto der Eltern", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "schalter", key: "elternVerheiratet", label: "Eltern verheiratet" },
    { baustein: "register", key: "geschwisterInAusbildung", label: "Geschwister in Ausbildung", optionen: [{ wert: "0", label: "0" }, { wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "BAföG-Anspruch / Monat", wert: e.bafoegAnspruch, text: fmtGeld, haupt: true },
        { label: "Max. Darlehen gesamt", wert: e.darlehensMax, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        ...(e.hatAnspruch ? [] : [{ k: "Kein BAföG-Anspruch", v: "Elterneinkommen zu hoch" }]),  // bedingt
        ...(e.hatAnspruch ? [{ k: "Maximaler Bedarfssatz", v: fmtGeld(e.bedarfMax) }] : []),  // bedingt
        ...(e.hatAnspruch ? [{ k: "Eltern-Freibetrag", v: fmtGeld(e.elternFreibetrag) }] : []),  // bedingt
        ...(e.hatAnspruch ? [{ k: "Anrechenb. Elterneinkommen", v: fmtGeld(e.anrechenbaresElternEinkommen) }] : []),  // bedingt
        { k: "Elternanrechnung (50 %)", v: `- ${fmtGeld(e.elternAnrechnung)}` },
      ],
    },
    { art: "hinweis", text: "BAföG wird zur Hälfte als Zuschuss, zur Hälfte als zinsloses Darlehen gewaehrt (max. 10.010 EUR Rückzahlung). Grundlage: BAföG 2024/2026." },
  ],
};
