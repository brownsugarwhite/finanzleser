/**
 * Elternzeit-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/ElternzeitRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/elternzeit.ts. Neu ist nur der Satz.
 */
import { berechne, type ElternzeitParams, type ElternzeitResult } from "@/lib/calculators/elternzeit";
import { fmtDe } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** Voreinstellung ist der laufende Monat — wie in ElternzeitRechner.tsx. */
const now = new Date();

type W = ElternzeitParams & Record<string, number | string | boolean>;

export const elternzeitSchema: RechnerSchema<W, ElternzeitResult> = {
  slug: "elternzeit",
  titel: "Elternzeit-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Elternzeit-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { geburtYear: now.getFullYear(), geburtMonth: now.getMonth() + 1, partnerMonate: 0, uebertragMonateSpater: 0 } as W,

  felder: [
    { baustein: "setzzeile", key: "geburtYear", label: "Geburtsjahr des Kindes", min: 2020, max: 2030, schritt: 1 },
    { baustein: "register", key: "geburtMonth", label: "Geburtsmonat", optionen: [{ wert: "1", label: "Januar" }, { wert: "2", label: "Februar" }, { wert: "3", label: "März" }, { wert: "4", label: "April" }, { wert: "5", label: "Mai" }, { wert: "6", label: "Juni" }, { wert: "7", label: "Juli" }, { wert: "8", label: "August" }, { wert: "9", label: "September" }, { wert: "10", label: "Oktober" }, { wert: "11", label: "November" }, { wert: "12", label: "Dezember" }] },
    { baustein: "register", key: "partnerMonate", label: "Partnermonate", optionen: [{ wert: "0", label: "0 Monate" }, { wert: "1", label: "1 Monate" }, { wert: "2", label: "2 Monate" }, { wert: "3", label: "3 Monate" }, { wert: "4", label: "4 Monate" }, { wert: "5", label: "5 Monate" }, { wert: "6", label: "6 Monate" }, { wert: "7", label: "7 Monate" }, { wert: "8", label: "8 Monate" }, { wert: "9", label: "9 Monate" }, { wert: "10", label: "10 Monate" }, { wert: "11", label: "11 Monate" }, { wert: "12", label: "12 Monate" }, { wert: "13", label: "13 Monate" }, { wert: "14", label: "14 Monate" }] },
    { baustein: "register", key: "übertragMonateSpater", label: "Monate auf später übertragen", optionen: [{ wert: "0", label: "0 Monate" }, { wert: "1", label: "1 Monate" }, { wert: "2", label: "2 Monate" }, { wert: "3", label: "3 Monate" }, { wert: "4", label: "4 Monate" }, { wert: "5", label: "5 Monate" }, { wert: "6", label: "6 Monate" }, { wert: "7", label: "7 Monate" }, { wert: "8", label: "8 Monate" }, { wert: "9", label: "9 Monate" }, { wert: "10", label: "10 Monate" }, { wert: "11", label: "11 Monate" }, { wert: "12", label: "12 Monate" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Erster Abschnitt", wert: e.monateErsterAbschnitt, text: (v) => `${fmtDe(v)} Monate`, haupt: true },
        { label: "Später nutzbar", wert: e.monateSpater, text: (v) => `${fmtDe(v)} Monate` },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Maximale Elternzeit", v: `${e.maxMonate} Monate` },
        { k: "Anmeldefrist", v: `${e.anmeldeFristWochen} Wochen vorher` },
        { k: "Ende Mutterschutz", v: String(e.schutzEnde) },
        { k: "Elternzeit ab", v: String(e.elternzeitStart) },
        { k: "Ende erster Abschnitt", v: String(e.elternzeitEnde) },
        { k: "Partnermonate", v: `${e.partnerMonate} Monate` },
      ],
    },
    { art: "hinweis", text: "Elternzeit betraegt max. 36 Monate pro Kind (beide Elternteile gemeinsam). Bis zu 24 Monate koennen auf den Zeitraum bis zum 8. Geburtstag übertragen werden. Anmeldung mind. 7 Wochen vor Beginn. Grundlage: BEEG 2026." },
  ],
};
