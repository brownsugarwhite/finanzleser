/**
 * Krankengeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KrankengeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/krankengeld.ts. Neu ist nur der Satz.
 */
import { berechne, type KrankengeldParams, type KrankengeldResult } from "@/lib/calculators/krankengeld";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KrankengeldParams & Record<string, number | string | boolean>;

export const krankengeldSchema: RechnerSchema<W, KrankengeldResult> = {
  slug: "krankengeld",
  titel: "Krankengeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Krankengeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, monatsNetto: 2400 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 12000, schritt: 100, einheit: "€", px: 15, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "monatsNetto", label: "Monatliches Nettogehalt", min: 0, max: 8000, schritt: 100, einheit: "€", px: 23, major: 5, mittel: 0, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Krankengeld taeglich", wert: e.kgTaeglich, text: fmtGeld },
        { label: "Krankengeld monatlich", wert: e.kgMonatlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Monatsbrutto", v: `${fmtGeld(e.monatsBrutto)}${e.istBegrenzt ? " (über BBG)" : ""}` },
        { k: "Brutto (begrenzt auf BBG)", v: fmtGeld(e.bruttoBegrenzt) },
        { k: "Regelentgelt (taeglich)", v: fmtGeld(e.regelentgeltTaeglich) },
        { k: "70% Brutto (taeglich)", v: fmtGeld(e.kgBruttoTaeglich) },
        { k: "90% Netto-Grenze (taeglich)", v: fmtGeld(e.kgNettoGrenze) },
        { k: "Krankengeld (taeglich)", v: fmtGeld(e.kgTaeglich) },
        { k: "Krankengeld (woechentlich)", v: fmtGeld(e.kgWoechentlich) },
        { k: "Krankengeld (monatlich)", v: fmtGeld(e.kgMonatlich) },
        { k: "Max. Bezugsdauer", v: `${e.maxBezugsdauerWochen} Wochen` },
      ],
    },
    { art: "hinweis", text: "Krankengeld betraegt 70% des Bruttogehalts, max. 90% des Nettogehalts (SS 47 SGB V). Die maximale Bezugsdauer betraegt Wochen für dieselbe Erkrankung innerhalb von 3 Jahren." },
  ],
};
