/**
 * Abfindungsrechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/AbfindungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/abfindung.ts. Neu ist nur der Satz.
 */
import { berechne, type AbfindungParams, type AbfindungResult } from "@/lib/calculators/abfindung";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = AbfindungParams & Record<string, number | string | boolean>;

export const abfindungSchema: RechnerSchema<W, AbfindungResult> = {
  slug: "abfindung",
  titel: "Abfindungsrechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Abfindungsrechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, beschaeftigungsjahre: 10, faktor: 0.5, jahresBruttoEinkommen: 42000 } as W,

  felder: [
    { baustein: "setzzeile", key: "monatsBrutto", label: "Bruttomonatsgehalt", min: 100, max: 100000, schritt: 100, einheit: "€" },
    { baustein: "drehring", key: "beschaeftigungsjahre", label: "Beschäftigungsjahre", min: 1, max: 50, schritt: 1, einheit: "Jahre", gross: 5 },
    { baustein: "setzzeile", key: "faktor", label: "Abfindungsfaktor", min: 0.1, max: 2, schritt: 0.1, dez: 1 },
    { baustein: "lineal", key: "jahresBruttoEinkommen", label: "Jahresbruttoeinkommen (ohne Abfindung)", min: 0, max: 200000, schritt: 1000, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "tabelle",
      titel: "Normale Besteuerung und F\u00fcnftelregelung",
      spalten: [{ key: "posten", label: "Posten" }, { key: "a", label: "Normal", rechts: true }, { key: "b", label: "Fünftelregelung", rechts: true }],
      zeilen: [
        { posten: "Abfindung (brutto)", a: fmtGeld(e.abfindungBrutto), b: fmtGeld(e.abfindungBrutto) },
        { posten: "Einkommensteuer", a: fmtGeld(e.estNormal), b: fmtGeld(e.estFuenftel) },
        { posten: "Abfindung (netto)", a: fmtGeld(e.nettoNormal), b: fmtGeld(e.nettoFuenftel) },
      ],
      letzteBetont: true,
    },
    {
      art: "kacheln",
      kacheln: [
        { label: "Abfindung (brutto)", wert: e.abfindungBrutto, text: fmtGeld, haupt: true },
        { label: "Netto (Fünftelregelung)", wert: e.nettoFuenftel, text: fmtGeld },
        { label: "Steuerersparnis", wert: e.steuerersparnis, text: fmtGeld },
      ],
    },
    { art: "hinweis", text: "Berechnung nach §34 EStG (Fünftelregelung). Solidaritätszuschlag und Kirchensteuer sind in dieser vereinfachten Darstellung nicht separat ausgewiesen. Abfindungen sind grundsätzlich sozialversicherungsfrei." },
  ],
};
