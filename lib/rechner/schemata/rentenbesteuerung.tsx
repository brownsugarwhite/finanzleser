/**
 * Rentenbesteuerung-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/RentenbesteuerungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/rentenbesteuerung.ts. Neu ist nur der Satz.
 */
import { berechne, type RentenbesteuerungParams, type RentenbesteuerungResult } from "@/lib/calculators/rentenbesteuerung";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = RentenbesteuerungParams & Record<string, number | string | boolean>;

export const rentenbesteuerungSchema: RechnerSchema<W, RentenbesteuerungResult> = {
  slug: "rentenbesteuerung",
  titel: "Rentenbesteuerung-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Rentenbesteuerung-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatlicheRente: 1500, rentenBeginnJahr: 2026 } as W,

  felder: [
    { baustein: "drehring", key: "monatlicheRente", label: "Monatliche Rente (brutto)", min: 0, max: 6000, schritt: 100, einheit: "€/Monat", gross: 6 },
    { baustein: "setzzeile", key: "rentenBeginnJahr", label: "Rentenbeginn (Jahr)", min: 2005, max: 2058, schritt: 1 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Einkommensteuer auf Rente", wert: e.estAufRente, text: fmtGeld },
        { label: "Besteuerungsanteil", wert: e.besteuerungsanteilProzent, text: (v) => fmtProzent(v, 2) },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Rente jaehrlich", v: fmtGeld(w.monatlicheRente * 12) },
        { k: "Besteuerungsanteil", v: fmtProzent(e.besteuerungsanteilProzent) },
        { k: "Steuerpflichtiger Anteil", v: fmtGeld(e.steuerpflichtigAnteil) },
        { k: "Werbungskosten-Pauschbetrag", v: fmtGeld(e.wkPauschbetrag) },
        { k: "Zu versteuerndes Einkommen", v: fmtGeld(e.zvEAusRente) },
      ],
    },
    { art: "zeiger", label: "Besteuerungsanteil", wert: Math.round(e.besteuerungsanteilProzent) },
    { art: "hinweis", text: "Der Besteuerungsanteil für Rentenbeginn betraegt . Bis 2058 steigt der Besteuerungsanteil auf 100 %. Die Berechnung beruecksichtigt den Werbungskosten-Pauschbetrag von und die ESt nach § 32a EStG. Soli und Kirchensteuer sind nicht enthalten. Quelle: § 22 Nr. 1 Satz 3 Buchst. a EStG." },
  ],
};
