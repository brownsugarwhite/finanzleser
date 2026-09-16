/**
 * ALG I-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/Alg1Rechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/alg1.ts. Neu ist nur der Satz.
 */
import { berechne, type Alg1Params, type Alg1Result } from "@/lib/calculators/alg1";
import { fmtDe, fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = Alg1Params & Record<string, number | string | boolean>;

export const alg1Schema: RechnerSchema<W, Alg1Result> = {
  slug: "alg1",
  titel: "ALG I-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · ALG I-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, steuerklasse: 1, hatKinder: false, versicherungsmonate: 24, alter: 40 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 12000, schritt: 100, einheit: "€", px: 15, major: 10, mittel: 5, breit: true },
    { baustein: "register", key: "steuerklasse", label: "Steuerklasse", optionen: [{ wert: "1", label: "Klasse 1" }, { wert: "2", label: "Klasse 2" }, { wert: "3", label: "Klasse 3" }, { wert: "4", label: "Klasse 4" }, { wert: "5", label: "Klasse 5" }, { wert: "6", label: "Klasse 6" }] },
    { baustein: "schalter", key: "hatKinder", label: "Hat Kinder (Leistungssatz 67%)" },
    { baustein: "drehring", key: "versicherungsmonate", label: "Versicherungsmonate (letzte 30 Monate)", min: 0, max: 30, schritt: 1, einheit: "Monate", gross: 3 },
    { baustein: "drehring", key: "alter", label: "Alter", min: 16, max: 67, schritt: 1, einheit: "Jahre", gross: 5 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "ALG I monatlich", wert: e.algMonatlich, text: fmtGeld },
        { label: "Bezugsdauer", wert: e.bezugsdauerMonate, text: (v) => `${fmtDe(v)} Monate` },
        { label: "Gesamtbetrag", wert: e.gesamtbetrag, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Bemessungsentgelt", v: `${fmtGeld(e.bemessungsentgelt)}${e.bemessungsentgeltBegrenzt ? " (gedeckelt)" : ""}` },
        { k: "SV-Pauschale", v: fmtGeld(e.svPauschale) },
        { k: "LSt-Pauschale", v: fmtGeld(e.lstPauschale) },
        { k: "Leistungsentgelt (täglich)", v: fmtGeld(e.leistungsentgeltTaeglich) },
        { k: "Leistungsentgelt (monatlich)", v: fmtGeld(e.leistungsentgeltMonatlich) },
        { k: "Leistungssatz", v: fmtProzent(e.satzProzent) },
        { k: "ALG I (täglich)", v: fmtGeld(e.algTaeglich) },
        { k: "ALG I (monatlich)", v: fmtGeld(e.algMonatlich) },
        { k: "Bezugsdauer", v: `${e.bezugsdauerMonate} Monate` },
      ],
    },
    { art: "zeiger", label: "Leistungssatz", wert: e.satzProzent },
    { art: "hinweis", text: "ALG I betraegt % des Leistungsentgelts (). Rechtsgrundlage: SS 149-153 SGB III. Die Berechnung ist vereinfacht und ersetzt keine individuelle Beratung durch die Agentur für Arbeit." },
  ],
};
