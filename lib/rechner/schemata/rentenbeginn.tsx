/**
 * Rentenbeginn-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/RentenbeginRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/rentenbeginn.ts. Neu ist nur der Satz.
 */
import { berechne, type RentenbeginnParams, type RentenbeginnResult } from "@/lib/calculators/rentenbeginn";
import { fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** „67 Jahre, 2 Monate“ — wortgleich aus components/rechner/RentenbeginRechner.tsx. */
function formatAlter(alter: { jahre: number; monate: number }): string {
  return alter.monate === 0 ? `${alter.jahre} Jahre` : `${alter.jahre} Jahre, ${alter.monate} Monate`;
}

type W = RentenbeginnParams & Record<string, number | string | boolean>;

export const rentenbeginnSchema: RechnerSchema<W, RentenbeginnResult> = {
  slug: "rentenbeginn",
  titel: "Rentenbeginn-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Rentenbeginn-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { geburtsjahr: 1970, schwerbehinderung: false, langjVersichert: false } as W,

  felder: [
    { baustein: "setzzeile", key: "geburtsjahr", label: "Geburtsjahr", min: 1940, max: 2000, schritt: 1 },
    { baustein: "schalter", key: "schwerbehinderung", label: "Schwerbehinderung (GdB mind. 50)" },
    { baustein: "schalter", key: "langjVersichert", label: "Besonders langjaehrig versichert (45+ Beitragsjahre)" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Regelaltersgrenze", v: String(formatAlter(e.regelaltersgrenze)) },
        { k: "Fruehester Rentenbeginn", v: String(formatAlter(e.fruehesterRentenbeginn)) },
        { k: "Regelaltersgrenze", v: String(formatAlter(e.regelaltersgrenze)) },
        { k: "Fruehester Rentenbeginn", v: String(formatAlter(e.fruehesterRentenbeginn)) },
        { k: "Abschlag (Monate)", v: `${e.abschlagMonate} Monate` },
        { k: "Abschlag (Prozent)", v: fmtProzent(e.abschlagProzent) },
      ],
    },
    { art: "hinweis", text: "ergibt sich ein dauerhafter Abschlag von $ ($ Monate x 0,3%).` : \"Sie koennen abschlagsfrei in Rente gehen.\" } Quelle: § 35, § 236 SGB VI." },
  ],
};
