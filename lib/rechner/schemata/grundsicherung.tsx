/**
 * Grundsicherung-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/GrundsicherungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/grundsicherung.ts. Neu ist nur der Satz.
 */
import { berechne, type GrundsicherungParams, type GrundsicherungResult } from "@/lib/calculators/grundsicherung";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = GrundsicherungParams & Record<string, number | string | boolean>;

export const grundsicherungSchema: RechnerSchema<W, GrundsicherungResult> = {
  slug: "grundsicherung",
  titel: "Grundsicherung-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Grundsicherung-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { alleinstehend: true, monatlicheRente: 800, sonstigesEinkommen: 0 } as W,

  felder: [
    { baustein: "schalter", key: "alleinstehend", label: "Alleinstehend" },
    { baustein: "lineal", key: "monatlicheRente", label: "Monatliche Rente", min: 0, max: 2000, schritt: 50, einheit: "€", px: 40, major: 2, mittel: 1, breit: true },
    { baustein: "lineal", key: "sonstigesEinkommen", label: "Sonstiges Einkommen", min: 0, max: 2000, schritt: 50, einheit: "€", px: 40, major: 2, mittel: 1, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Grundsicherung / Monat", wert: e.anspruch, text: fmtGeld, haupt: true },
        { label: "Regelbedarf", wert: e.regelbedarf, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Regelbedarf", v: fmtGeld(e.regelbedarf) },
        { k: "Freibetrag auf Rente", v: fmtGeld(e.freibetragRente) },
        { k: "Anrechenbare Rente", v: `- ${fmtGeld(e.anrechenbareRente)}` },
        { k: "Sonstiges anrechenbar", v: `- ${fmtGeld(e.anrechenbaresSonstiges)}` },
      ],
    },
    { art: "hinweis", text: "Grundsicherung im Alter (ab Regelaltersgrenze) und bei voller Erwerbsminderung. Freibetrag auf Rente: 30 %, max. Haelfte des Regelsatzes. Grundlage: SGB XII." },
  ],
};
