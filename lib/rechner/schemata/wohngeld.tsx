/**
 * Wohngeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/WohngeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/wohngeld.ts. Neu ist nur der Satz.
 */
import { berechne, type WohngeldParams, type WohngeldResult } from "@/lib/calculators/wohngeld";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = WohngeldParams & Record<string, number | string | boolean>;

export const wohngeldSchema: RechnerSchema<W, WohngeldResult> = {
  slug: "wohngeld",
  titel: "Wohngeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Wohngeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { haushaltsmitglieder: 3, bruttoMiete: 600, mietenstufe: 3, monatsEinkommen: 2000 } as W,

  felder: [
    { baustein: "register", key: "haushaltsmitglieder", label: "Haushaltsmitglieder", optionen: [{ wert: "1", label: "1 Person" }, { wert: "2", label: "2 Personen" }, { wert: "3", label: "3 Personen" }, { wert: "4", label: "4 Personen" }, { wert: "5", label: "5 Personen" }, { wert: "6", label: "6 Personen" }, { wert: "7", label: "7 Personen" }, { wert: "8", label: "8 Personen" }, { wert: "9", label: "9 Personen" }, { wert: "10", label: "10 Personen" }, { wert: "11", label: "11 Personen" }, { wert: "12", label: "12 Personen" }] },
    { baustein: "lineal", key: "bruttoMiete", label: "Bruttokaltmiete inkl. Nebenkosten", min: 0, max: 3000, schritt: 50, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "register", key: "mietenstufe", label: "Mietenstufe", optionen: [{ wert: "1", label: "Stufe I (niedrig)" }, { wert: "2", label: "Stufe II" }, { wert: "3", label: "Stufe III" }, { wert: "4", label: "Stufe IV" }, { wert: "5", label: "Stufe V" }, { wert: "6", label: "Stufe VI" }, { wert: "7", label: "Stufe VII (hoch)" }] },
    { baustein: "lineal", key: "monatsEinkommen", label: "Monatliches Gesamteinkommen", min: 0, max: 6000, schritt: 100, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Wohngeld monatlich", wert: e.wohngeldMonatlich, text: fmtGeld, haupt: true },
        { label: "Wohngeld jaehrlich", wert: e.wohngeldJaehrlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Anrechenbare Miete (M)", v: fmtGeld(e.anrechenbareMiete) },
        { k: "Höchstbetrag (Anlage 1)", v: fmtGeld(e.hoechstbetrag) },
        { k: "Angerechnetes Einkommen (Y)", v: fmtGeld(e.monatsEinkommen) },
        { k: "Wohngeld / Monat", v: fmtGeld(e.wohngeldMonatlich) },
        { k: "Wohngeld / Jahr", v: fmtGeld(e.wohngeldJaehrlich) },
      ],
    },
    { art: "hinweis", text: "Berechnung nach WoGG-Formel: W = 1,15 x (M - (a + b*M + c*Y) * Y). Die Mietenstufe haengt vom Wohnort ab (Stufe I = guenstig, VII = teuer). Grundlage: WoGG mit Anlagen 1-3, inkl. Klimakomponente." },
  ],
};
