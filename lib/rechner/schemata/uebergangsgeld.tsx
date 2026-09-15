/**
 * Uebergangsgeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/UebergangsgeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/uebergangsgeld.ts. Neu ist nur der Satz.
 */
import { berechne, type UebergangsgeldParams, type UebergangsgeldResult } from "@/lib/calculators/uebergangsgeld";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = UebergangsgeldParams & Record<string, number | string | boolean>;

export const uebergangsgeldSchema: RechnerSchema<W, UebergangsgeldResult> = {
  slug: "uebergangsgeld",
  titel: "Übergangsgeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Übergangsgeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, hatKind: false } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 15000, schritt: 100, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "schalter", key: "hatKind", label: "Hat Kind (erhoehter Leistungssatz)" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Übergangsgeld taeglich", wert: e.uebergangsgeldTaeglich, text: fmtGeld },
        { label: "Übergangsgeld monatlich", wert: e.uebergangsgeldMonatlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Monatsbrutto", v: `${fmtGeld(e.monatsBrutto)}${e.istBegrenzt ? " (über BBG)" : ""}` },
        { k: "Brutto (begrenzt auf BBG)", v: fmtGeld(e.bruttoBegrenzt) },
        { k: "Netto standardisiert", v: fmtGeld(e.nettoStandardisiert) },
        { k: "Netto (taeglich)", v: fmtGeld(e.nettoTaeglich) },
        { k: "Leistungssatz", v: fmtProzent(e.satzProzent) },
        { k: "Übergangsgeld (taeglich)", v: fmtGeld(e.uebergangsgeldTaeglich) },
      ],
    },
    { art: "zeiger", label: "Leistungssatz", wert: e.satzProzent },
    { art: "hinweis", text: "Übergangsgeld betraegt % des Nettoentgelts (). Es wird waehrend medizinischer oder beruflicher Rehabilitation gezahlt. Rechtsgrundlage: SS 20-21 SGB VI / SS 49-52 SGB IX." },
  ],
};
