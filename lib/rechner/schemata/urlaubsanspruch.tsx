/**
 * Urlaubsanspruch-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/UrlaubsanspruchRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/urlaubsanspruch.ts. Neu ist nur der Satz.
 */
import { berechne, type UrlaubsanspruchParams, type UrlaubsanspruchResult } from "@/lib/calculators/urlaubsanspruch";
import { fmtDe } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = UrlaubsanspruchParams & Record<string, number | string | boolean>;

export const urlaubsanspruchSchema: RechnerSchema<W, UrlaubsanspruchResult> = {
  slug: "urlaubsanspruch",
  titel: "Urlaubsanspruch-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Urlaubsanspruch-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { arbeitstageWoche: 5, schwerbehinderung: false } as W,

  felder: [
    { baustein: "register", key: "arbeitstageWoche", label: "Arbeitstage pro Woche", optionen: [{ wert: "5", label: "5-Tage-Woche" }, { wert: "6", label: "6-Tage-Woche" }] },
    { baustein: "schalter", key: "schwerbehinderung", label: "Schwerbehinderung (GdB >= 50)" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamter Urlaubsanspruch", wert: e.gesamtAnspruch, text: (v) => `${fmtDe(v)} Tage` },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Gesetzlicher Mindesturlaub (Werktage)", v: `${e.mindesturlaubWerktage} Tage` },
        { k: "Umgerechnet auf Arbeitstage", v: `${e.mindesturlaubArbeitstage} Tage` },
        { k: "Zusatzurlaub Schwerbehinderung", v: `${e.zusatzurlaub} Tage` },
        { k: "Gesamt", v: `${e.gesamtAnspruch} Tage` },
      ],
    },
    { art: "hinweis", text: "Gesetzlicher Mindesturlaub nach BUrlG: 24 Werktage (6-Tage-Woche). Bei Schwerbehinderung (GdB 50): 5 zusätzliche Arbeitstage nach SGB IX." },
  ],
};
