/**
 * Mutterschutz-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/MutterschutzRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/mutterschutz.ts. Neu ist nur der Satz.
 */
import { berechne, type MutterschutzParams, type MutterschutzResult } from "@/lib/calculators/mutterschutz";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** Voreinstellung ist der Monat in drei Monaten — wie in MutterschutzRechner.tsx. */
const now = new Date();
const defaultMonth = now.getMonth() + 3 > 12 ? now.getMonth() + 3 - 12 : now.getMonth() + 3;
const defaultYear = now.getMonth() + 3 > 12 ? now.getFullYear() + 1 : now.getFullYear();

type W = MutterschutzParams & Record<string, number | string | boolean>;

export const mutterschutzSchema: RechnerSchema<W, MutterschutzResult> = {
  slug: "mutterschutz",
  titel: "Mutterschutz-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Mutterschutz-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { entbindungYear: defaultYear, entbindungMonth: defaultMonth, entbindungDay: 15, monatsNetto: 2500, istGKV: true } as W,

  felder: [
    { baustein: "setzzeile", key: "entbindungYear", label: "Entbindungstermin: Jahr", min: 2024, max: 2030 },
    { baustein: "register", key: "entbindungMonth", label: "Monat", optionen: [{ wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }, { wert: "6", label: "6" }, { wert: "7", label: "7" }, { wert: "8", label: "8" }, { wert: "9", label: "9" }, { wert: "10", label: "10" }, { wert: "11", label: "11" }, { wert: "12", label: "12" }] },
    { baustein: "setzzeile", key: "entbindungDay", label: "Tag", min: 1, max: 31, schritt: 1 },
    { baustein: "lineal", key: "monatsNetto", label: "Monatliches Nettoeinkommen", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "schalter", key: "istGKV", label: "Gesetzlich krankenversichert (GKV)" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamtleistung", wert: e.gesamtLeistung, text: fmtGeld, haupt: true },
        { label: "Tagessatz gesamt", wert: e.gesamtTagessatz, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Schutzfrist von", v: String(e.schutzfristVon) },
        { k: "Schutzfrist bis", v: String(e.schutzfristBis) },
        { k: "Schutztage gesamt", v: `${e.schutzTageGesamt} Tage` },
        { k: "Krankenkasse pro Tag", v: fmtGeld(e.mutterschaftsgeldTag) },
        { k: "Arbeitgeberzuschuss pro Tag", v: fmtGeld(e.arbeitgeberZuschussTag) },
        { k: "Krankenkasse gesamt", v: fmtGeld(e.gesamtMutterschaftsgeld) },
        { k: "Arbeitgeberzuschuss gesamt", v: fmtGeld(e.gesamtArbeitgeberzuschuss) },
      ],
    },
    { art: "hinweis", text: "Die Krankenkasse zahlt max. 13 EUR/Tag. Der Arbeitgeber stockt die Differenz zum durchschnittlichen Nettolohn auf. Grundlage: MuSchG 2026." },
  ],
};
