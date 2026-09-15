/**
 * Rentenabschlag-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/RentenabschlagRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/rentenabschlag.ts. Neu ist nur der Satz.
 */
import { berechne, type RentenabschlagParams, type RentenabschlagResult } from "@/lib/calculators/rentenabschlag";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = RentenabschlagParams & Record<string, number | string | boolean>;

export const rentenabschlagSchema: RechnerSchema<W, RentenabschlagResult> = {
  slug: "rentenabschlag",
  titel: "Rentenabschlag-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Rentenabschlag-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatlicheRente: 1500, monate_frueher: 12 } as W,

  felder: [
    { baustein: "drehring", key: "monatlicheRente", label: "Monatliche Rente (ohne Abschlag)", min: 0, max: 5000, schritt: 100, einheit: "€/Monat", gross: 5 },
    { baustein: "drehring", key: "monate_frueher", label: "Monate frueher in Rente", min: 1, max: 60, schritt: 1, einheit: "Monate", gross: 6 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Rente nach Abschlag", wert: e.renteNachAbschlag, text: fmtGeld },
        { label: "Abschlag", wert: e.abschlagProzent, text: (v) => fmtProzent(v, 2) },
        { label: "Monatlicher Verlust", wert: e.abschlagBetrag, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Rente ohne Abschlag", v: fmtGeld(w.monatlicheRente) },
        { k: "Monate vorzeitig", v: `${w.monate_frueher} Monate` },
        { k: "Abschlag pro Monat", v: "0,30 %" },
        { k: "Gesamtabschlag", v: fmtProzent(e.abschlagProzent) },
        { k: "Abschlag in Euro", v: fmtGeld(e.abschlagBetrag) },
        { k: "Jaehrlicher Verlust", v: fmtGeld(e.verlustJaehrlich) },
      ],
    },
    { art: "zeiger", label: "Abschlag (max. 14,4 %)", wert: e.abschlagProzent, max: 14.4 },
    { art: "hinweis", text: "Der Abschlag bei vorzeitiger Rente betraegt 0,3 % pro Monat vor der Regelaltersgrenze. Der maximale Abschlag ist auf 14,4 % begrenzt (48 Monate x 0,3 %). Der Abschlag gilt dauerhaft für die gesamte Rentenbezugszeit. Quelle: § 77 Abs. 2 SGB VI." },
  ],
};
