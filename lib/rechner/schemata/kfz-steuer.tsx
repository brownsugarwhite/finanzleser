/**
 * Kfz-Steuer-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KfzSteuerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/utils.ts. Neu ist nur der Satz.
 */
import { berechne, type KfzSteuerParams, type KfzSteuerResult } from "@/lib/calculators/kfz_steuer";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KfzSteuerParams & Record<string, number | string | boolean>;

export const kfzSteuerSchema: RechnerSchema<W, KfzSteuerResult> = {
  slug: "kfz-steuer",
  titel: "Kfz-Steuer-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Kfz-Steuer-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { antriebsart: "benzin", hubraum_ccm: 1600, co2_g_km: 120, erstzulassung_jahr: 2020 } as W,

  felder: [
    { baustein: "register", key: "antriebsart", label: "Antriebsart", optionen: [{ wert: "benzin", label: "Benzin" }, { wert: "diesel", label: "Diesel" }, { wert: "elektro", label: "Elektro" }] },
    { baustein: "setzzeile", key: "hubraum_ccm", label: "Hubraum", min: 0, max: 6000, schritt: 100, einheit: "ccm" },
    { baustein: "setzzeile", key: "co2_g_km", label: "CO2-Ausstoss", min: 0, max: 400, schritt: 5, einheit: "g/km" },
    { baustein: "drehring", key: "erstzulassung_jahr", label: "Erstzulassungsjahr", min: 1990, max: 2026, schritt: 1, einheit: "Jahr", gross: 4 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Jahressteuer", wert: e.jahressteuer, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Hubraum-Steuer", v: fmtGeld(e.hubraumSteuer) },
        { k: "CO2-Steuer", v: fmtGeld(e.co2Steuer) },
        { k: "Jahressteuer", v: fmtGeld(e.jahressteuer) },
      ],
    },
    { art: "hinweis", text: "Elektrofahrzeug: Steuerbefreiung aktiv (bis zu 10 Jahre ab Erstzulassung)." },
    { art: "hinweis", text: "Berechnung nach Paragraph 9 KraftStG. Benzin: 2,00 EUR/100 ccm. Diesel: 9,50 EUR/100 ccm. CO2-Freibetrag: 95 g/km. Elektro-Befreiung bei Neuzulassung bis 2030 (max. 10 Jahre, laengstens bis 2035)." },
  ],
};
