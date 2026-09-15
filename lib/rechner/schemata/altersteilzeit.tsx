/**
 * Altersteilzeit-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/AltersteilzeitRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/altersteilzeit.ts. Neu ist nur der Satz.
 */
import { berechne, type AltersteilzeitParams, type AltersteilzeitResult } from "@/lib/calculators/altersteilzeit";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = AltersteilzeitParams & Record<string, number | string | boolean>;

export const altersteilzeitSchema: RechnerSchema<W, AltersteilzeitResult> = {
  slug: "altersteilzeit",
  titel: "Altersteilzeit-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Altersteilzeit-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 4000, alter: 58 } as W,

  felder: [
    { baustein: "setzzeile", key: "monatsBrutto", label: "Monatliches Brutto (Vollzeit)", min: 0, max: 12000, schritt: 100, einheit: "EUR" },
    { baustein: "drehring", key: "alter", label: "Alter", min: 50, max: 67, schritt: 1, einheit: "Jahre", gross: 2 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Teilzeit-Brutto (50 %)", wert: e.teilzeitBrutto, text: fmtGeld },
        { label: "Aufstockung (20 % Vollzeit)", wert: e.aufstockung, text: fmtGeld },
        { label: "Gesamt Teilzeit", wert: e.gesamtTeilzeit, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Vollzeit-Brutto", v: fmtGeld(w.monatsBrutto) },
        { k: "Teilzeit-Brutto (50 %)", v: fmtGeld(e.teilzeitBrutto) },
        { k: "Aufstockung AG (20 %)", v: fmtGeld(e.aufstockung) },
        { k: "Gesamt Altersteilzeit", v: fmtGeld(e.gesamtTeilzeit) },
        { k: "Nettovergleich (geschaetzt)", v: fmtGeld(e.nettovergleich) },
      ],
    },
    { art: "hinweis", text: "Mindestalter für Altersteilzeit: 55 Jahre. Aktuelles Alter liegt darunter." },
    { art: "hinweis", text: "Die Aufstockung (hier 20 % des Vollzeit-Brutto) richtet sich nach Tarif- oder Betriebsvereinbarung. Grundlage: Paragraph 2 AltTZG. Mindestalter: 55 Jahre." },
  ],
};
