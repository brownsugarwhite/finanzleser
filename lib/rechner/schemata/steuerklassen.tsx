/**
 * Steuerklassen-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/SteuerklassenRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/steuerklassen.ts. Neu ist nur der Satz.
 */
import { berechne, type SteuerklassenParams, type SteuerklassenResult } from "@/lib/calculators/steuerklassen";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = SteuerklassenParams & Record<string, number | string | boolean>;

export const steuerklassenSchema: RechnerSchema<W, SteuerklassenResult> = {
  slug: "steuerklassen",
  titel: "Steuerklassen-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Steuerklassen-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: {  } as W,

  felder: [
    { baustein: "register", key: "modus", label: "Familienstand", optionen: [{ wert: "single", label: "Einzelperson" }, { wert: "paar", label: "Ehepaar / Lebenspartnerschaft" }] },
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 15000, schritt: 100, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "monatsBruttoPartner", label: "Bruttogehalt Partner/in", min: 0, max: 15000, schritt: 100, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Empfehlung", v: String(e.empfehlung) },
      ],
    },
    {
      art: "tabelle",
      titel: "Aufstellung",
      spalten: [{ key: "beschreibung", label: "Steuerklasse" }, { key: "netto", label: "Netto", rechts: true }, { key: "lohnsteuer", label: "Lohnsteuer", rechts: true }, { key: "soli", label: "Soli", rechts: true }],
      zeilen: e.vergleich.map((v) => ({ beschreibung: v.beschreibung, netto: fmtGeld(v.netto), lohnsteuer: fmtGeld(v.lohnsteuer), soli: fmtGeld(v.soli), })),
    },
    { art: "hinweis", text: "Berechnung nach §38b EStG / §32a EStG 2026. Kirchensteuer und individueller KV-Zusatzbeitrag sind hier nicht berücksichtigt." },
  ],
};
