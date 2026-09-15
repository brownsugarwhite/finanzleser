/**
 * Rentenschaetzer 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/RentenschaetzerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/rentenschaetzer.ts. Neu ist nur der Satz.
 */
import { berechne, type RentenschaetzerParams, type RentenschaetzerResult } from "@/lib/calculators/rentenschaetzer";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import { punkte } from "@/lib/calculators/utils";
import type { RechnerSchema } from "../schema";

type W = RentenschaetzerParams & Record<string, number | string | boolean>;

export const rentenschaetzerSchema: RechnerSchema<W, RentenschaetzerResult> = {
  slug: "rentenschaetzer",
  titel: "Rentenschaetzer 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Rentenschaetzer 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatlichesEinkommen: 3500, versicherungsjahre: 35 } as W,

  felder: [
    { baustein: "drehring", key: "monatlichesEinkommen", label: "Durchschnittliches monatliches Bruttoeinkommen", min: 0, max: 8000, schritt: 100, einheit: "€/Monat", gross: 8 },
    { baustein: "drehring", key: "versicherungsjahre", label: "Versicherungsjahre", min: 1, max: 50, schritt: 1, einheit: "Jahre", gross: 5 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Geschaetzte monatliche Rente", wert: e.renteMonatlichGeschaetzt, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Entgeltpunkte (geschaetzt)", v: String(punkte(e.entgeltpunkteGeschaetzt)) },
        { k: "Monatliches Bruttoeinkommen", v: fmtGeld(w.monatlichesEinkommen) },
        { k: "Versicherungsjahre", v: `${w.versicherungsjahre} Jahre` },
        { k: "Entgeltpunkte (geschaetzt)", v: String(punkte(e.entgeltpunkteGeschaetzt)) },
      ],
    },
    { art: "hinweis", text: "Dies ist eine unverbindliche Schaetzung. Die tatsaechliche Rente haengt von den genauen Versicherungszeiten und Einkommen ab. Luecken oder unterdurchschnittliche Einkommen reduzieren die Rente. Nutzen Sie die offizielle Rentenauskunft der Deutschen Rentenversicherung für praezise Werte." },
  ],
};
