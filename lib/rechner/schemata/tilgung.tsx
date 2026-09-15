/**
 * Tilgungsrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/TilgungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/tilgung.ts. Neu ist nur der Satz.
 */
import { berechne, type TilgungParams, type TilgungResult } from "@/lib/calculators/tilgung";
import { fmtDe, fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = TilgungParams & Record<string, number | string | boolean>;

export const tilgungSchema: RechnerSchema<W, TilgungResult> = {
  slug: "tilgung",
  titel: "Tilgungsrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Tilgungsrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { darlehensbetrag: 300000, zinssatzPa: 3.5, anfangstilgungPa: 2.0, sondertilgungJahr: 0 } as W,

  felder: [
    { baustein: "lineal", key: "darlehensbetrag", label: "Darlehensbetrag", min: 0, max: 1000000, schritt: 5000, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "zaehlwerk", key: "zinssatzPa", label: "Sollzinssatz p.a.", min: 0, max: 10, schritt: 0.05, einheit: "%", dez: 2 },
    { baustein: "zaehlwerk", key: "anfangstilgungPa", label: "Anfängliche Tilgung p.a.", min: 0, max: 10, schritt: 0.1, einheit: "%", dez: 1 },
    { baustein: "lineal", key: "sondertilgungJahr", label: "Sondertilgung pro Jahr", min: 0, max: 50000, schritt: 500, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatsrate", wert: e.monatsrate, text: fmtGeld, haupt: true },
        { label: "Laufzeit", wert: e.laufzeitJahre, text: (v) => `${fmtDe(v)} Jahre` },
        { label: "Gesamtzinsen", wert: e.gesamtZinsen, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Darlehensbetrag", v: fmtGeld(w.darlehensbetrag) },
        { k: "Monatsrate", v: fmtGeld(e.monatsrate) },
        { k: "Laufzeit", v: `${e.laufzeitJahre} Jahre` },
        { k: "Gesamtzinsen", v: fmtGeld(e.gesamtZinsen) },
        { k: "Gesamttilgung", v: fmtGeld(e.gesamtTilgung) },
      ],
    },
    {
      art: "tabelle",
      titel: "Jahresübersicht",
      spalten: [{ key: "jahr", label: "Jahr" }, { key: "rateJahr", label: "Rate (Jahr)", rechts: true }, { key: "zinsen", label: "Zinsen", rechts: true }, { key: "tilgung", label: "Tilgung", rechts: true }, { key: "sondertilgung", label: "Sondertilgung" }, { key: "restschuld", label: "Restschuld", rechts: true }],
      zeilen: e.jahresplan.map((row) => ({ jahr: String(row.jahr), rateJahr: fmtGeld(row.rateJahr), zinsen: fmtGeld(row.zinsen), tilgung: fmtGeld(row.tilgung), sondertilgung: fmtGeld(row.sondertilgung), restschuld: fmtGeld(row.restschuld), })),
      letzteBetont: true,
    },
    { art: "hinweis", text: "Annuität = Darlehensbetrag x (Zinssatz + Tilgungssatz) / 12. Die Sondertilgung wird am Jahresende verrechnet und verkürzt die Laufzeit." },
  ],
};
