/**
 * Pfaendungsrechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/PfaendungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/pfaendung.ts. Neu ist nur der Satz.
 */
import { berechne, type PfaendungParams, type PfaendungResult } from "@/lib/calculators/pfaendung";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = PfaendungParams & Record<string, number | string | boolean>;

export const pfaendungSchema: RechnerSchema<W, PfaendungResult> = {
  slug: "pfaendung",
  titel: "Pfaendungsrechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Pfaendungsrechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsNetto: 2500, unterhaltspflichten: 1 } as W,

  felder: [
    { baustein: "lineal", key: "monatsNetto", label: "Monatliches Nettoeinkommen", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "register", key: "unterhaltspflichten", label: "Unterhaltspflichten", optionen: [{ wert: "0", label: "0 Personen" }, { wert: "1", label: "1 Person" }, { wert: "2", label: "2 Personen" }, { wert: "3", label: "3 Personen" }, { wert: "4", label: "4 Personen" }, { wert: "5", label: "5 Personen" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Pfaendbarer Betrag", wert: e.pfaendbarerBetrag, text: fmtGeld, haupt: true },
        { label: "Verbleibendes Einkommen", wert: e.verbleibendesEinkommen, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Grundfreibetrag", v: fmtGeld(e.grundfreibetrag) },
        { k: "Erhöhung (Unterhaltspfl.)", v: fmtGeld(e.erhoehung) },
        { k: "Gesamter Freibetrag", v: fmtGeld(e.gesamtFreibetrag) },
        { k: "Pfaendbarer Betrag (70 %)", v: fmtGeld(e.pfaendbarerBetrag) },
      ],
    },
    { art: "hinweis", text: "Pfaendungsfreigrenzen gueltig 01.07.2025 - 30.06.2026. Erste Unterhaltspflicht: +585,23 EUR, weitere: +326,04 EUR. 70 % des überschuessigen Betrags sind pfaendbar. Grundlage: 850c ZPO." },
  ],
};
