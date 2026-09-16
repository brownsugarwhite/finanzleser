/**
 * Erbschaftsteuerrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/ErbschaftsteuerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/erbschaftsteuer.ts. Neu ist nur der Satz.
 */
import { berechne, type ErbschaftsteuerParams, type ErbschaftsteuerResult } from "@/lib/calculators/erbschaftsteuer";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = ErbschaftsteuerParams & Record<string, number | string | boolean>;

export const erbschaftsteuerSchema: RechnerSchema<W, ErbschaftsteuerResult> = {
  slug: "erbschaftsteuer",
  titel: "Erbschaftsteuerrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Erbschaftsteuerrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { erbschaftswert: 300000, verwandtschaft: "kind", alterKind: 10, istErbschaft: true, bereitsEmpfangen: 0 } as W,

  felder: [
    { baustein: "lineal", key: "erbschaftswert", label: "Erbschaftswert", min: 0, max: 1000000, schritt: 10000, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "register", key: "verwandtschaft", label: "Verwandtschaftsverhältnis", optionen: [{ wert: "ehegatte", label: "Ehegatte / Lebenspartner" }, { wert: "kind", label: "Kind / Stiefkind" }, { wert: "enkel", label: "Enkel" }, { wert: "geschwister", label: "Geschwister" }, { wert: "sonstige", label: "Sonstige Personen" }] },
    { baustein: "drehring", key: "alterKind", label: "Alter des Kindes", min: 0, max: 27, schritt: 1, einheit: "Jahre", gross: 3 },
    { baustein: "schalter", key: "istErbschaft", label: "Erbschaft (nicht Schenkung)" },
    { baustein: "lineal", key: "bereitsEmpfangen", label: "Bereits empfangene Schenkungen (10 Jahre)", min: 0, max: 1000000, schritt: 10000, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Erbschaftsteuer", wert: e.erbschaftsteuer, text: fmtGeld, haupt: true },
        { label: "Nettowert", wert: e.nettowert, text: fmtGeld },
        { label: "Effektiver Steuersatz", wert: e.effektiverSatzProzent, text: (v) => fmtProzent(v, 2) },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Verwandtschaft", v: String(e.verwandtschaftText) },
        { k: "Steuerklasse", v: String(e.steuerklasse) },
        { k: "Erbschaftswert", v: fmtGeld(w.erbschaftswert) },
        { k: "Persönlicher Freibetrag", v: fmtGeld(e.persoenlichFreibetrag) },
        { k: "Versorgungsfreibetrag", v: fmtGeld(e.versorgungsfreibetrag) },
        { k: "Gesamtfreibetrag", v: fmtGeld(e.gesamtFreibetrag) },
        { k: "Verfügbarer Freibetrag", v: fmtGeld(e.verfuegbarerFreibetrag) },
        { k: "Steuerpflichtiger Erwerb", v: fmtGeld(e.steuerpflichtigerErwerb) },
        { k: "Steuersatz", v: fmtProzent(e.steuersatzProzent) },
        { k: "Erbschaftsteuer", v: fmtGeld(e.erbschaftsteuer) },
        { k: "Nettowert", v: fmtGeld(e.nettowert) },
        { k: "Effektiver Steuersatz", v: fmtProzent(e.effektiverSatzProzent) },
      ],
    },
    { art: "zeiger", label: "Effektiver Steuersatz", wert: e.effektiverSatzProzent },
    { art: "hinweis", text: "Die Erbschaftsteuer verwendet einen Stufentarif (nicht progressiv). Der Steuersatz gilt auf den gesamten steuerpflichtigen Erwerb. Der Versorgungsfreibetrag gilt nur bei Erbschaften, nicht bei Schenkungen. Konsultieren Sie einen Steuerberater." },
  ],
};
