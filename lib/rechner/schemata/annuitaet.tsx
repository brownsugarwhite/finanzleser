/**
 * Annuitätenrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/AnnuitaetRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/annuitaet.ts. Neu ist nur der Satz.
 */
import { berechne, type AnnuitaetParams, type AnnuitaetResult } from "@/lib/calculators/annuitaet";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = AnnuitaetParams & Record<string, number | string | boolean>;

export const annuitaetSchema: RechnerSchema<W, AnnuitaetResult> = {
  slug: "annuitaet",
  titel: "Annuitätenrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Annuitätenrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { darlehensbetrag: 250000, zinssatzPa: 3.0, laufzeitJahre: 20 } as W,

  felder: [
    { baustein: "lineal", key: "darlehensbetrag", label: "Darlehensbetrag", min: 0, max: 1000000, schritt: 5000, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "zaehlwerk", key: "zinssatzPa", label: "Jahreszinssatz", min: 0, max: 15, schritt: 0.1, einheit: "%", dez: 1 },
    { baustein: "drehring", key: "laufzeitJahre", label: "Laufzeit", min: 1, max: 50, schritt: 1, einheit: "Jahre", gross: 5 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatsrate", wert: e.monatsrate, text: fmtGeld, haupt: true },
        { label: "Gesamtzinsen", wert: e.gesamtZinsen, text: fmtGeld },
        { label: "Gesamtrückzahlung", wert: e.gesamtRueckzahlung, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Darlehensbetrag", v: fmtGeld(w.darlehensbetrag) },
        { k: "Jahreszinssatz", v: fmtProzent(w.zinssatzPa) },
        { k: "Laufzeit", v: `${w.laufzeitJahre} Jahre` },
        { k: "Monatsrate (Annuität)", v: fmtGeld(e.monatsrate) },
        { k: "Gesamtrückzahlung", v: fmtGeld(e.gesamtRueckzahlung) },
        { k: "Gesamtzinsen", v: fmtGeld(e.gesamtZinsen) },
        { k: "Effektivzins", v: fmtProzent(e.effektivZins) },
      ],
    },
    {
      art: "tabelle",
      titel: "Jahresübersicht",
      spalten: [{ key: "jahr", label: "Jahr" }, { key: "rateJahr", label: "Rate (Jahr)", rechts: true }, { key: "zinsen", label: "Zinsen", rechts: true }, { key: "tilgung", label: "Tilgung", rechts: true }, { key: "restschuld", label: "Restschuld", rechts: true }],
      zeilen: e.jahresplan.map((row) => ({ jahr: String(row.jahr), rateJahr: fmtGeld(row.rateJahr), zinsen: fmtGeld(row.zinsen), tilgung: fmtGeld(row.tilgung), restschuld: fmtGeld(row.restschuld), })),
      letzteBetont: true,
    },
    { art: "hinweis", text: "Annuitätenformel: R = K x [i x (1+i)^n] / [(1+i)^n - 1]. Die Monatsrate bleibt konstant, der Zinsanteil sinkt mit der Zeit." },
  ],
};
