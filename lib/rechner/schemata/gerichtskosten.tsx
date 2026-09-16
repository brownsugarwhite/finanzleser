/**
 * Gerichtskosten-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/GerichtsKostenRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/gerichtskosten.ts. Neu ist nur der Satz.
 */
import { berechne, type GerichtskostenParams, type GerichtskostenResult } from "@/lib/calculators/gerichtskosten";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = GerichtskostenParams & Record<string, number | string | boolean>;

export const gerichtskostenSchema: RechnerSchema<W, GerichtskostenResult> = {
  slug: "gerichtskosten",
  titel: "Gerichtskosten-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Gerichtskosten-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { streitwert: 5000, instanz: "ag_lg" } as W,

  felder: [
    { baustein: "setzzeile", key: "streitwert", label: "Streitwert", min: 0, max: 500000, schritt: 1000, einheit: "EUR" },
    { baustein: "register", key: "instanz", label: "Instanz", optionen: [{ wert: "ag_lg", label: "Amts-/Landgericht" }, { wert: "olg", label: "Oberlandesgericht" }, { wert: "bgh", label: "Bundesgerichtshof" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamtkosten", wert: e.gesamtKosten, text: fmtGeld },
        { label: "Gerichtsgebühr", wert: e.gerichtsgebuehr, text: fmtGeld },
        { label: "Anwaltskosten", wert: e.anwaltsGesamt, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Verfahrensgebuehr (1,3-fach)", v: fmtGeld(e.anwaltsVerfahren) },
        { k: "Terminsgebuehr (1,2-fach)", v: fmtGeld(e.anwaltsTermin) },
        { k: "Post-/Telekompauschale", v: fmtGeld(e.anwaltsPostpauschale) },
        { k: "MwSt (19 %)", v: fmtGeld(e.anwaltsMwSt) },
      ],
    },
    { art: "hinweis", text: "Berechnung nach GKG Anlage 2 und RVG. Bei 2 Parteien mit je eigenem Anwalt verdoppeln sich die Anwaltskosten. Gerichtsgebühr je nach Instanz (AG/LG: 3-fach, OLG: 4-fach, BGH: 5-fach)." },
  ],
};
