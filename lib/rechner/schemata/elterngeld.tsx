/**
 * Elterngeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/ElterngeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/elterngeld.ts. Neu ist nur der Satz.
 */
import { berechne, type ElterngeldParams, type ElterngeldResult } from "@/lib/calculators/elterngeld";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = ElterngeldParams & Record<string, number | string | boolean>;

export const elterngeldSchema: RechnerSchema<W, ElterngeldResult> = {
  slug: "elterngeld",
  titel: "Elterngeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Elterngeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3000, zvEJahr: 36000 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Durchschnittliches Monatsbrutto", min: 0, max: 15000, schritt: 100, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "zvEJahr", label: "Zu versteuerndes Jahreseinkommen", min: 0, max: 200000, schritt: 1000, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Basiselterngeld / Monat", wert: e.basisElterngeld, text: fmtGeld, haupt: true },
        { label: "ElterngeldPlus / Monat", wert: e.elterngeldPlus, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Kein Anspruch", v: "Einkommen über 175.000 EUR" },
        { k: "Monatsbrutto", v: fmtGeld(e.monatsBrutto) },
        { k: "BEEG-Netto", v: fmtGeld(e.beegNetto) },
        { k: "Ersatzrate", v: fmtProzent(e.ersatzrateProzent) },
        { k: "Basiselterngeld (12 Mon.)", v: fmtGeld(e.gesamtBasis) },
        { k: "ElterngeldPlus (24 Mon.)", v: fmtGeld(e.gesamtPlus) },
      ],
    },
    { art: "zeiger", label: "Ersatzrate", wert: e.ersatzrateProzent },
    { art: "messlatte", wert: Math.round(e.basisElterngeld), schnitt: 870, einheit: " €", wertLabel: "Dein Basiselterngeld", schnittLabel: "Ø Deutschland" },
    { art: "hinweis", text: "Berechnung nach BEEG 2026. BEEG-Netto = Brutto minus 21,9 % SV-Pauschale minus progressiver Lohnsteuer. Ersatzrate 65-67 % je nach Nettoeinkommen. Min. 300 EUR, max. 1.800 EUR (Basis) bzw. 150-900 EUR (Plus)." },
  ],
};
