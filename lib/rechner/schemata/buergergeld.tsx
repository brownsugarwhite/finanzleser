/**
 * Buergergeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/BuergergelRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/buergergeld.ts. Neu ist nur der Satz.
 */
import { berechne, type BuergergeldParams, type BuergergeldResult } from "@/lib/calculators/buergergeld";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = BuergergeldParams & Record<string, number | string | boolean>;

export const buergergeldSchema: RechnerSchema<W, BuergergeldResult> = {
  slug: "buergergeld",
  titel: "Buergergeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Buergergeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { haushaltTyp: "alleinstehend", anzahlKinder06: 0, anzahlKinder713: 0, anzahlKinder1417: 0, eigenesEinkommen: 0 } as W,

  felder: [
    { baustein: "register", key: "haushaltTyp", label: "Haushaltstyp", optionen: [{ wert: "alleinstehend", label: "Alleinstehend" }, { wert: "paar", label: "Paar ohne Kinder" }, { wert: "alleinerziehend_kinder", label: "Alleinerziehend mit Kindern" }, { wert: "paar_kinder", label: "Paar mit Kindern" }] },
    { baustein: "register", key: "anzahlKinder06", label: "Kinder 0-6 Jahre", optionen: [{ wert: "0", label: "0" }, { wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }] },
    { baustein: "register", key: "anzahlKinder713", label: "Kinder 7-13 Jahre", optionen: [{ wert: "0", label: "0" }, { wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }] },
    { baustein: "register", key: "anzahlKinder1417", label: "Kinder 14-17 Jahre", optionen: [{ wert: "0", label: "0" }, { wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }] },
    { baustein: "lineal", key: "eigenesEinkommen", label: "Eigenes Erwerbseinkommen", min: 0, max: 3000, schritt: 50, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Buergergeld-Anspruch", wert: e.buergergeldAnspruch, text: fmtGeld, haupt: true },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Regelbedarf (Erwachsene)", v: fmtGeld(e.regelbedarf) },
        { k: "Kinderbedarf", v: fmtGeld(e.kinderBedarf) },
        { k: "Gesamtbedarf", v: fmtGeld(e.gesamtBedarf) },
        { k: "Freibetrag auf Einkommen", v: fmtGeld(e.freibetrag) },
        { k: "Anrechenbares Einkommen", v: `- ${fmtGeld(e.anrechenbaresEinkommen)}` },
      ],
    },
    { art: "hinweis", text: "Richtwert ohne Kosten der Unterkunft (KdU). Die tatsaechliche Bewilligung erfolgt durch das Jobcenter unter Beruecksichtigung aller Vermoegensverhaeltnisse. Grundlage: SGB II." },
  ],
};
