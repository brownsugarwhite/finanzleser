/**
 * Kindergeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KindergeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/kindergeld.ts. Neu ist nur der Satz.
 */
import { berechne, type KindergeldParams, type KindergeldResult } from "@/lib/calculators/kindergeld";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KindergeldParams & Record<string, number | string | boolean>;

export const kindergeldSchema: RechnerSchema<W, KindergeldResult> = {
  slug: "kindergeld",
  titel: "Kindergeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Kindergeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { anzahlKinder: 2 } as W,

  felder: [
    { baustein: "register", key: "anzahlKinder", label: "Anzahl Kinder", optionen: [{ wert: "1", label: "1 Kind" }, { wert: "2", label: "2 Kinder" }, { wert: "3", label: "3 Kinder" }, { wert: "4", label: "4 Kinder" }, { wert: "5", label: "5 Kinder" }, { wert: "6", label: "6 Kinder" }, { wert: "7", label: "7 Kinder" }, { wert: "8", label: "8 Kinder" }, { wert: "9", label: "9 Kinder" }, { wert: "10", label: "10 Kinder" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Kindergeld monatlich", wert: e.kindergeldMonatlich, text: fmtGeld, haupt: true },
        { label: "Kindergeld jährlich", wert: e.kindergeldJaehrlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Anzahl Kinder", v: e.anzahlKinder.toString() },
        { k: "Kindergeld je Kind / Monat", v: fmtGeld(e.kindergeldProKind) },
        { k: "Kindergeld gesamt / Monat", v: fmtGeld(e.kindergeldMonatlich) },
        { k: "Kindergeld gesamt / Jahr", v: fmtGeld(e.kindergeldJaehrlich) },
        { k: "Kinderfreibetrag je Elternteil", v: fmtGeld(e.kinderfreibetragJeElternteil) },
        { k: "Kinderfreibetrag beide Eltern", v: fmtGeld(e.kinderfreibetragBeideEltern) },
      ],
    },
    { art: "hinweis", text: "Ab 2026 betraegt das Kindergeld einheitlich 259 EUR pro Kind und Monat. Das Finanzamt prueft automatisch, ob Kindergeld oder Kinderfreibetrag guenstiger ist (Guenstigerpruefung). Grundlage: BKGG / EStG." },
  ],
};
