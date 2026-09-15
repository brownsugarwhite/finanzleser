/**
 * Stundenlohnrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/StundenlohnRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/stundenlohn.ts. Neu ist nur der Satz.
 */
import { berechne, type StundenlohnParams, type StundenlohnResult } from "@/lib/calculators/stundenlohn";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = StundenlohnParams & Record<string, number | string | boolean>;

export const stundenlohnSchema: RechnerSchema<W, StundenlohnResult> = {
  slug: "stundenlohn",
  titel: "Stundenlohnrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Stundenlohnrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { jahresgehalt: 42000, wochenstunden: 40, urlaubstage: 30, feiertage: 10 } as W,

  felder: [
    { baustein: "lineal", key: "jahresgehalt", label: "Jahresgehalt (brutto)", min: 0, max: 150000, schritt: 1000, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "setzzeile", key: "wochenstunden", label: "Wochenstunden", min: 1, max: 60, schritt: 1, einheit: "h" },
    { baustein: "setzzeile", key: "urlaubstage", label: "Urlaubstage", min: 0, max: 40, schritt: 1, einheit: "Tage" },
    { baustein: "setzzeile", key: "feiertage", label: "Feiertage", min: 0, max: 20, schritt: 1, einheit: "Tage" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w, rates) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Stundenlohn", wert: e.stundenlohn, text: fmtGeld, haupt: true },
        { label: "Monatsgehalt", wert: e.monatsgehalt, text: fmtGeld },
        { label: "result.überMindestlohn ? \"Über Mindestlohn\" : \"Unter Mindestlohn\"", wert: Math.abs(e.differenzZuMindestlohn), text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Jahresgehalt", v: fmtGeld(w.jahresgehalt) },
        { k: "Monatsgehalt", v: fmtGeld(e.monatsgehalt) },
        { k: "Arbeitstage / Jahr", v: `${e.arbeitstageJahr} Tage` },
        { k: "Arbeitsstunden / Jahr", v: `${e.arbeitsstundenJahr} Stunden` },
        { k: "Stundenlohn", v: fmtGeld(e.stundenlohn) },
        { k: "Mindestlohn (2026)", v: fmtGeld(rates.mindestlohn.stundensatz) },
        { k: "Differenz zum Mindestlohn", v: fmtGeld(e.differenzZuMindestlohn) },
      ],
    },
    { art: "messlatte", wert: Math.round(e.stundenlohn * 100) / 100, schnitt: 25, einheit: " €", wertLabel: "Dein Stundenlohn", schnittLabel: "Ø Deutschland" },
    { art: "hinweis", text: "Berechnung basiert auf dem gesetzlichen Mindestlohn 2026 (/h). Wochenenden (104 Tage) werden automatisch abgezogen." },
  ],
};
