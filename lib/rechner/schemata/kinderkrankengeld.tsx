/**
 * Kinderkrankengeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KinderkrangengeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/kinderkrankengeld.ts. Neu ist nur der Satz.
 */
import { berechne, type KinderkrankengeldParams, type KinderkrankengeldResult } from "@/lib/calculators/kinderkrankengeld";
import { fmtDe, fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KinderkrankengeldParams & Record<string, number | string | boolean>;

export const kinderkrankengeldSchema: RechnerSchema<W, KinderkrankengeldResult> = {
  slug: "kinderkrankengeld",
  titel: "Kinderkrankengeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Kinderkrankengeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, monatsNetto: 2400, anzahlKinder: 1, alleinerziehend: false, bereitsGenutzteTage: 0 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 12000, schritt: 100, einheit: "€", px: 15, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "monatsNetto", label: "Monatliches Nettogehalt", min: 0, max: 8000, schritt: 100, einheit: "€", px: 23, major: 5, mittel: 0, breit: true },
    { baustein: "register", key: "anzahlKinder", label: "Anzahl Kinder", optionen: [{ wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }] },
    { baustein: "schalter", key: "alleinerziehend", label: "Alleinerziehend" },
    { baustein: "setzzeile", key: "bereitsGenutzteTage", label: "Bereits genutzte Tage in diesem Jahr", min: 0, max: 70, schritt: 1, einheit: "Tage" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Kinderkrankengeld täglich", wert: e.kgTaeglich, text: fmtGeld },
        { label: "Verbleibende Tage", wert: e.verbleibendeTage, text: (v) => `${fmtDe(v)} Tage` },
        { label: "Gesamtbetrag", wert: e.gesamtbetrag, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Brutto (begrenzt auf BBG)", v: `${fmtGeld(e.bruttoBegrenzt)}${e.istBegrenzt ? " (gedeckelt)" : ""}` },
        { k: "70% Brutto (täglich)", v: fmtGeld(e.kgBruttoTaeglich) },
        { k: "90% Netto-Grenze (täglich)", v: fmtGeld(e.kgNettoGrenze) },
        { k: "Kinderkrankengeld (täglich)", v: fmtGeld(e.kgTaeglich) },
        { k: "Jahresanspruch", v: `${e.jahresanspruchTage} Tage` },
        { k: "Verbleibende Tage", v: `${e.verbleibendeTage} Tage` },
      ],
    },
    { art: "hinweis", text: "Kinderkrankengeld: 70% des Brutto, max. 90% des Netto (SS 45 SGB V). Der Jahresanspruch haengt von der Anzahl der Kinder und dem Familienstatus ab." },
  ],
};
