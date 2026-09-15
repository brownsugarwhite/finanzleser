/**
 * Kurzarbeitergeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KurzarbeitssgeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/kurzarbeitsgeld.ts. Neu ist nur der Satz.
 */
import { berechne, type KurzarbeitsgeldParams, type KurzarbeitsgeldResult } from "@/lib/calculators/kurzarbeitsgeld";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KurzarbeitsgeldParams & Record<string, number | string | boolean>;

export const kurzarbeitsgeldSchema: RechnerSchema<W, KurzarbeitsgeldResult> = {
  slug: "kurzarbeitsgeld",
  titel: "Kurzarbeitergeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Kurzarbeitergeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { sollEntgelt: 3000, istEntgelt: 0, steuerklasse: 1, hatKind: false, kinderlosUeber23: false } as W,

  felder: [
    { baustein: "lineal", key: "sollEntgelt", label: "Soll-Entgelt (normales Bruttogehalt)", min: 0, max: 12000, schritt: 100, einheit: "€", px: 15, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "istEntgelt", label: "Ist-Entgelt (reduziertes Bruttogehalt)", min: 0, max: 12000, schritt: 100, einheit: "€", px: 15, major: 10, mittel: 5, breit: true },
    { baustein: "register", key: "steuerklasse", label: "Steuerklasse", optionen: [{ wert: "1", label: "Klasse 1" }, { wert: "2", label: "Klasse 2" }, { wert: "3", label: "Klasse 3" }, { wert: "4", label: "Klasse 4" }, { wert: "5", label: "Klasse 5" }, { wert: "6", label: "Klasse 6" }] },
    { baustein: "schalter", key: "hatKind", label: "Hat Kind (Leistungssatz 67%)" },
    { baustein: "schalter", key: "kinderlosÜber23", label: "Kinderlos und über 23 Jahre" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Kurzarbeitergeld", wert: e.kurzarbeitergeld, text: fmtGeld },
        { label: "Gesamteinkommen", wert: e.gesamtEinkommen, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Soll-Brutto", v: fmtGeld(e.sollBrutto) },
        { k: "Ist-Brutto", v: fmtGeld(e.istBrutto) },
        { k: "Netto (Soll)", v: fmtGeld(e.nettoSoll) },
        { k: "Netto (Ist)", v: fmtGeld(e.nettoIst) },
        { k: "Netto-Entgeltdifferenz", v: fmtGeld(e.nettoEntgeltDifferenz) },
        { k: "Leistungssatz", v: fmtProzent(e.leistungssatzProzent) },
        { k: "Kurzarbeitergeld", v: fmtGeld(e.kurzarbeitergeld) },
        { k: "Ausfallquote", v: fmtProzent(e.ausfallQuoteProzent) },
      ],
    },
    { art: "zeiger", label: "Ausfallquote", wert: e.ausfallQuoteProzent },
    { art: "hinweis", text: "Kurzarbeitergeld ersetzt % der Netto-Entgeltdifferenz. Voraussetzung: angemeldete Kurzarbeit bei der Agentur für Arbeit. Rechtsgrundlage: SS 95-111 SGB III." },
  ],
};
