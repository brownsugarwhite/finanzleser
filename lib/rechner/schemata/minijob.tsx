/**
 * Minijob-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/MinijobRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/minijob.ts. Neu ist nur der Satz.
 */
import { berechne, type MinijobParams, type MinijobResult } from "@/lib/calculators/minijob";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** Beschäftigungsarten, wortgleich aus components/rechner/MinijobRechner.tsx. */
const typLabels: Record<string, string> = { minijob: "Minijob", midijob: "Midijob (Gleitzone)", regulaer: "Regulär versicherungspflichtig" };

type W = MinijobParams & Record<string, number | string | boolean>;

export const minijobSchema: RechnerSchema<W, MinijobResult> = {
  slug: "minijob",
  titel: "Minijob-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Minijob-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 520, rvBefreiung: false } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatlicher Verdienst", min: 0, max: 2500, schritt: 10, einheit: "€", px: 7, major: 20, mittel: 10, breit: true },
    { baustein: "schalter", key: "rvBefreiung", label: "RV-Befreiung (Rentenversicherung befreit)" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Netto Arbeitnehmer", wert: e.netto, text: fmtGeld },
        { label: "Kosten Arbeitgeber", wert: e.agGesamt, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Beschäftigungstyp", v: String(typLabels[e.typ] || e.typ) },
        { k: "Monatsbrutto", v: fmtGeld(e.monatsBrutto) },
        { k: "Typ", v: String(typLabels[e.typ] || e.typ) },
        { k: "RV-Aufstockung AN", v: fmtGeld(e.anRVAufstockung) },
        { k: "SV-Beitrag (reduziert)", v: fmtGeld(e.anSVReduziert) },
        { k: "SV-Beitrag (normal)", v: fmtGeld(e.anSVNormal) },
        { k: "Ersparnis", v: fmtGeld(e.anErsparnis) },
        { k: "Netto", v: fmtGeld(e.netto) },
        { k: "Stunden bei Mindestlohn", v: `${e.stundenBeiMindestlohn} h/Monat` },
        { k: "KV-Pauschale (AG)", v: fmtGeld(e.agKV) },
        { k: "RV-Pauschale (AG)", v: fmtGeld(e.agRV) },
        { k: "Steuerpauschale (AG)", v: fmtGeld(e.agSteuer) },
      ],
    },
    { art: "hinweis", text: "Bei Minijobs zahlt der Arbeitgeber Pauschalabgaeben. Der Arbeitnehmer kann sich von der RV-Aufstockung (3,6%) befreien lassen, verliert dann aber Rentenansprueche. Midijob-Grenze 2026: 538,01 bis 2.000 EUR." },
  ],
};
