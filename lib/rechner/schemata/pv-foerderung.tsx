/**
 * PV-Foerderung & Ertrag-Rechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/PvFoerderungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/pv-foerderung.ts. Neu ist nur der Satz.
 */
import { berechne, type PvFoerderungParams, type PvFoerderungResult } from "@/lib/calculators/pv-foerderung";
import { fmtDe, fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = PvFoerderungParams & Record<string, number | string | boolean>;

export const pvFoerderungSchema: RechnerSchema<W, PvFoerderungResult> = {
  slug: "pv-foerderung",
  titel: "PV-Förderung & Ertrag-Rechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · PV-Förderung & Ertrag-Rechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { anlagenLeistungKwp: 10, eigenverbrauchProzent: 30, strompreisCtKwh: 35, einspeiseverguetungCtKwh: 8.03 } as W,

  felder: [
    { baustein: "setzzeile", key: "anlagenLeistungKwp", label: "Anlagenleistung", min: 1, max: 100, schritt: 0.5, einheit: "kWp", dez: 1 },
    { baustein: "zaehlwerk", key: "eigenverbrauchProzent", label: "Eigenverbrauch", min: 0, max: 100, schritt: 5, einheit: "%" },
    { baustein: "lineal", key: "strompreisCtKwh", label: "Strompreis", min: 0, max: 80, schritt: 0.5, einheit: "ct/kWh", dez: 1, px: 11, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "einspeiseverguetungCtKwh", label: "Einspeiseverguetung", min: 0, max: 20, schritt: 0.01, einheit: "ct/kWh", dez: 2, px: 3, major: 200, mittel: 100, breit: true },
  ],

  rechne: (w) => berechne(w),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamtertrag / Jahr", wert: e.gesamtertragJahr, text: fmtGeld },
        { label: "Jahresertrag", wert: e.jahresertrag, text: (v) => `${fmtDe(v)} kWh` },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Jahresertrag", v: `${e.jahresertrag.toLocaleString("de-DE")} kWh` },
        { k: "Eigenverbrauch-Ersparnis", v: fmtGeld(e.eigenverbrauchErsparnis) },
        { k: "Einspeiseverguetung", v: fmtGeld(e.einspeiseverguetung) },
        { k: "Gesamtertrag / Jahr", v: fmtGeld(e.gesamtertragJahr) },
      ],
    },
    { art: "hinweis", text: "Durchschnittlicher PV-Ertrag in Deutschland: ca. 950 kWh pro kWp und Jahr. Einspeiseverguetung nach EEG 2024, Paragraph 48 (Anlagen bis 10 kWp: 8,03 ct/kWh)." },
  ],
};
