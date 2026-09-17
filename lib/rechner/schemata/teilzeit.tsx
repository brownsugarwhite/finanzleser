/**
 * Teilzeit-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/TeilzeitRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/teilzeit.ts. Neu ist nur der Satz.
 */
import { berechne, type TeilzeitParams, type TeilzeitResult } from "@/lib/calculators/teilzeit";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** Beschäftigungsarten, wortgleich aus components/rechner/TeilzeitRechner.tsx. */
const typLabels: Record<string, string> = { minijob: "Minijob", midijob: "Midijob (Gleitzone)", regulaer: "Regulär versicherungspflichtig" };

type W = TeilzeitParams & Record<string, number | string | boolean>;

export const teilzeitSchema: RechnerSchema<W, TeilzeitResult> = {
  slug: "teilzeit",
  titel: "Teilzeit-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Teilzeit-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { stundenlohn: 15, wochenstunden: 20, vollzeitStundenWoche: 40 } as W,

  felder: [
    { baustein: "setzzeile", key: "stundenlohn", label: "Stundenlohn", min: 0, max: 100, schritt: 0.5, einheit: "€/Std.", dez: 1 },
    { baustein: "setzzeile", key: "wochenstunden", label: "Wochenstunden (Teilzeit)", min: 1, max: 60, schritt: 1, einheit: "Std./Woche" },
    { baustein: "setzzeile", key: "vollzeitStundenWoche", label: "Vollzeit-Wochenstunden", min: 1, max: 60, schritt: 1, einheit: "Std./Woche" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Brutto monatlich", wert: e.bruttoMonatlich, text: fmtGeld },
        { label: "Teilzeitquote", wert: e.teilzeitProzent, text: (v) => fmtProzent(v, 2) },
        { label: "Netto-Schätzung", wert: e.nettoSchaetzung, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Stundenlohn", v: `${e.stundenlohn.toFixed(2)} €/Std.` },
        { k: "Wochenstunden (Teilzeit)", v: `${e.wochenstunden} Std.` },
        { k: "Vollzeit-Wochenstunden", v: `${e.vollzeitStundenWoche} Std.` },
        { k: "Teilzeitquote", v: fmtProzent(e.teilzeitProzent) },
        { k: "Monatsstunden (Ø)", v: `${e.monatsStunden.toFixed(1)} Std.` },
        { k: "Brutto monatlich", v: fmtGeld(e.bruttoMonatlich) },
        { k: "Beschäftigungstyp", v: String(typLabels[e.typ] || e.typ) },
        { k: "Netto-Schätzung", v: fmtGeld(e.nettoSchaetzung) },
        { k: "Mindestlohn konform", v: e.mindestlohnKonform ? "Ja" : "Nein" },
      ],
    },
    { art: "zeiger", label: "Teilzeitquote", wert: Math.min(100, Math.max(0, Math.round(e.teilzeitProzent))) },
    { art: "hinweis", text: "Die Netto-Schätzung ist vereinfacht und beruecksichtigt pauschalierte SV-Abzüge. Die tatsaechliche Netto-Differenz haengt von Steuerklasse, Kirchensteuer und Kinderfreibetraegen ab. Bei Einkommen unter der Midijob-Grenze gelten reduzierte SV-Beiträge (SS 20 Abs. 2 SGB IV)." },
  ],
};
