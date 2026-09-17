/**
 * PayPal-Gebührenrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/PaypalRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/paypal.ts. Neu ist nur der Satz.
 */
import { berechne, type PaypalParams, type PaypalResult } from "@/lib/calculators/paypal";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = PaypalParams & Record<string, number | string | boolean>;

export const paypalSchema: RechnerSchema<W, PaypalResult> = {
  slug: "paypal",
  titel: "PayPal-Gebührenrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · PayPal-Gebührenrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { betrag: 100, typ: "haendler_inland" } as W,

  felder: [
    { baustein: "setzzeile", key: "betrag", label: "Betrag", min: 0, max: 5000, schritt: 10, einheit: "€" },
    { baustein: "register", key: "typ", label: "Transaktionstyp", optionen: [{ wert: "haendler_inland", label: "Händler Inland (2,49% + 0,35€)" }, { wert: "haendler_international", label: "Händler International (3,49% + 0,35€)" }, { wert: "freunde_kreditkarte", label: "Freunde / Kreditkarte (2,9% + 0,35€)" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gebühr", wert: e.gebuehr, text: fmtGeld, haupt: true },
        { label: "Nettobetrag", wert: e.nettoBetrag, text: fmtGeld },
        { label: "Effektive Gebühr", wert: e.gebuehrProzent, text: (v) => fmtProzent(v, 2) },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Bruttobetrag", v: fmtGeld(e.bruttoBetrag) },
        { k: "PayPal-Gebühr", v: fmtGeld(e.gebuehr) },
        { k: "Nettobetrag", v: fmtGeld(e.nettoBetrag) },
        { k: "Effektiver Gebührensatz", v: fmtProzent(e.gebuehrProzent) },
      ],
    },
    { art: "hinweis", text: "Die Gebühren entsprechen den aktuellen PayPal-AGB für Deutschland. Bei Währungsumrechnungen fallen zusätzliche Gebühren an." },
  ],
};
