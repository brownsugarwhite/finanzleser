/**
 * Mindestlohn-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/MindestlohnRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/mindestlohn.ts. Neu ist nur der Satz.
 */
import { berechne, type MindestlohnParams, type MindestlohnResult } from "@/lib/calculators/mindestlohn";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = MindestlohnParams & Record<string, number | string | boolean>;

export const mindestlohnSchema: RechnerSchema<W, MindestlohnResult> = {
  slug: "mindestlohn",
  titel: "Mindestlohn-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Mindestlohn-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { stundenlohn: 13.90, wochenstunden: 40 } as W,

  felder: [
    { baustein: "setzzeile", key: "stundenlohn", label: "Stundenlohn", min: 0, max: 50, schritt: 0.1, einheit: "€/Std.", dez: 1 },
    { baustein: "setzzeile", key: "wochenstunden", label: "Wochenstunden", min: 1, max: 60, schritt: 1, einheit: "Std./Woche" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatliches Brutto", wert: e.bruttoMonatlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Mindestlohn-Prüfung", v: e.istKonform ? "Eingehalten" : "Unterschritten" },
        { k: "Stundenlohn", v: `${e.stundenlohn.toFixed(2)} €/Std.` },
        { k: "Gesetzlicher Mindestlohn", v: `${e.mindestlohn.toFixed(2)} €/Std.` },
        { k: "Wochenstunden", v: `${e.wochenstunden} Std.` },
        { k: "Monatsstunden (Ø)", v: `${e.monatsStunden.toFixed(1)} Std.` },
        { k: "Brutto monatlich", v: fmtGeld(e.bruttoMonatlich) },
        { k: "Mindestlohn monatlich", v: fmtGeld(e.mindestlohnMonatlich) },
      ],
    },
    { art: "hinweis", text: "Der Stundenlohn von EUR liegt über dem gesetzlichen Mindestlohn von EUR/Stunde." },
    { art: "hinweis", text: "Der Stundenlohn von EUR liegt unter dem gesetzlichen Mindestlohn von EUR/Stunde." },
    { art: "hinweis", text: "Der gesetzliche Mindestlohn betraegt EUR/Stunde (MiLoG). Berechnungsgrundlage: 4,348 Wochen pro Monat." },
  ],
};
