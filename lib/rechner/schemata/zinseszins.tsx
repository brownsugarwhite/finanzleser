/**
 * Zinseszinsrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/ZinseszinsRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/zinseszins.ts. Neu ist nur der Satz.
 */
import { berechne, type ZinseszinsParams, type ZinseszinsResult } from "@/lib/calculators/zinseszins";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = ZinseszinsParams & Record<string, number | string | boolean>;

export const zinseszinsSchema: RechnerSchema<W, ZinseszinsResult> = {
  slug: "zinseszins",
  titel: "Zinseszinsrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Zinseszinsrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { startkapital: 10000, monatlicheSparrate: 200, zinssatzPa: 5.0, laufzeitJahre: 10 } as W,

  felder: [
    { baustein: "setzzeile", key: "startkapital", label: "Startkapital", min: 0, max: 500000, schritt: 1000, einheit: "€" },
    { baustein: "lineal", key: "monatlicheSparrate", label: "Monatliche Sparrate", min: 0, max: 5000, schritt: 50, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "zaehlwerk", key: "zinssatzPa", label: "Zinssatz p.a.", min: 0, max: 15, schritt: 0.1, einheit: "%", dez: 1 },
    { baustein: "drehring", key: "laufzeitJahre", label: "Laufzeit", min: 1, max: 50, schritt: 1, einheit: "Jahre", gross: 5 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Endkapital", wert: e.endkapital, text: fmtGeld, haupt: true },
        { label: "Einzahlungen", wert: e.gesamtEinzahlungen, text: fmtGeld },
        { label: "Zinserträge", wert: e.gesamtZinsertraege, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Startkapital", v: fmtGeld(w.startkapital) },
        { k: "Monatliche Sparrate", v: fmtGeld(w.monatlicheSparrate) },
        { k: "Zinssatz p.a.", v: fmtProzent(w.zinssatzPa) },
        { k: "Laufzeit", v: `${w.laufzeitJahre} Jahre` },
        { k: "Gesamteinzahlungen", v: fmtGeld(e.gesamtEinzahlungen) },
        { k: "Zinserträge", v: fmtGeld(e.gesamtZinsertraege) },
        { k: "Endkapital", v: fmtGeld(e.endkapital) },
      ],
    },
    {
      art: "tabelle",
      titel: "Aufstellung",
      spalten: [{ key: "jahr", label: "Jahr" }, { key: "kapital", label: "Kapital", rechts: true }, { key: "einzahlungen", label: "Einzahlungen", rechts: true }, { key: "zinsertraege", label: "Zinserträge", rechts: true }],
      zeilen: e.jahresplan.map((row) => ({ jahr: String(row.jahr), kapital: fmtGeld(row.kapital), einzahlungen: fmtGeld(row.einzahlungen), zinsertraege: fmtGeld(row.zinsertraege), })),
    },
    { art: "hinweis", text: "Der Zinseszinseffekt zeigt, wie Zinsen auf Zinsen wachsen. Die Berechnung geht von einer jährlichen Verzinsung aus." },
  ],
};
