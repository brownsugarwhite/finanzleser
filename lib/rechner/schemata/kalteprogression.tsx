/**
 * Kalte-Progression-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KalteprogressionRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/kalteprogression.ts. Neu ist nur der Satz.
 */
import { berechne, type KalteprogressionParams, type KalteprogressionResult } from "@/lib/calculators/kalteprogression";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KalteprogressionParams & Record<string, number | string | boolean>;

export const kalteprogressionSchema: RechnerSchema<W, KalteprogressionResult> = {
  slug: "kalteprogression",
  titel: "Kalte-Progression-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Kalte-Progression-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, gehaltssteigerungProzent: 3.0, inflationsrateProzent: 2.5 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 20000, schritt: 100, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "zaehlwerk", key: "gehaltssteigerungProzent", label: "Gehaltserhöhung", min: 0, max: 20, schritt: 0.1, einheit: "%", dez: 1 },
    { baustein: "zaehlwerk", key: "inflationsrateProzent", label: "Inflationsrate", min: 0, max: 15, schritt: 0.1, einheit: "%", dez: 1 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "tabelle",
      titel: "Vorher und nachher, je Monat",
      spalten: [{ key: "posten", label: "Posten" }, { key: "a", label: "Vorher", rechts: true }, { key: "b", label: "Nachher", rechts: true }],
      zeilen: [
        { posten: "Bruttogehalt", a: fmtGeld(e.bruttoVorher), b: fmtGeld(e.bruttoNachher) },
        { posten: "Einkommensteuer", a: fmtGeld(e.estVorher), b: fmtGeld(e.estNachher) },
        { posten: "Solidarit\u00e4tszuschlag", a: fmtGeld(e.soliVorher), b: fmtGeld(e.soliNachher) },
        { posten: "Netto", a: fmtGeld(e.nettoVorher), b: fmtGeld(e.nettoNachher) },
        { posten: "Steuerquote", a: fmtProzent(e.steuerquoteVorher), b: fmtProzent(e.steuerquoteNachher) },
      ],
      letzteBetont: true,
    },
    {
      art: "kacheln",
      kacheln: [
        { label: "Realer Nettoanstieg", wert: e.realerNettoAnstiegProzent, text: (v) => fmtProzent(v, 2) },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Kalte Progression", v: fmtGeld(e.kalteProgressionMonat) + " / Monat" },
        { k: "Nominaler Bruttoanstieg", v: `+${fmtGeld(e.bruttoAnstiegAbsolut)} (+${fmtProzent(e.bruttoAnstiegProzent)})` },
        { k: "Nominaler Nettoanstieg", v: `+${fmtGeld(e.nettoAnstiegAbsolut)} (+${fmtProzent(e.nettoAnstiegProzent)})` },
        { k: "Realer Nettoanstieg", v: `${fmtGeld(e.realerNettoAnstiegAbsolut)} (${fmtProzent(e.realerNettoAnstiegProzent)})` },
      ],
    },
    { art: "hinweis", text: "Berechnung nach §32a EStG 2026. Die kalte Progression entsteht, wenn Gehaltserhöhungen durch den progressiven Steuertarif überproportional besteuert werden." },
  ],
};
