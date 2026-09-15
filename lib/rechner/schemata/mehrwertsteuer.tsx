/**
 * Mehrwertsteuer-Rechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/MehrwertsteuerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/mehrwertsteuer.ts. Neu ist nur der Satz.
 */
import { berechne, type MehrwertsteuerParams, type MehrwertsteuerResult } from "@/lib/calculators/mehrwertsteuer";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = MehrwertsteuerParams & Record<string, number | string | boolean>;

export const mehrwertsteuerSchema: RechnerSchema<W, MehrwertsteuerResult> = {
  slug: "mehrwertsteuer",
  titel: "Mehrwertsteuer-Rechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Mehrwertsteuer-Rechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { betrag: 100, richtung: "netto", steuersatz: "regelsteuersatz" } as W,

  felder: [
    { baustein: "setzzeile", key: "betrag", label: "Betrag", min: 0, max: 10000, schritt: 10, einheit: "€" },
    { baustein: "register", key: "richtung", label: "Eingabe ist", optionen: [{ wert: "netto", label: "Nettobetrag" }, { wert: "brutto", label: "Bruttobetrag" }] },
    { baustein: "register", key: "steuersatz", label: "Steuersatz", optionen: [{ wert: "regelsteuersatz", label: "… % (Regelsteuersatz)" }, { wert: "ermaessigt", label: "… % (Ermäßigt)" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Bruttobetrag", wert: e.brutto, text: fmtGeld, haupt: true },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Nettobetrag", v: fmtGeld(e.netto) },
        { k: "Mehrwertsteuer (${result.steuersatzProzent} %)", v: fmtGeld(e.mwst) },
        { k: "Bruttobetrag", v: fmtGeld(e.brutto) },
      ],
    },
    { art: "hinweis", text: "Regelsteuersatz % (unverändert seit 2007). Ermäßigter Satz % für Lebensmittel, Bücher, Zeitungen u.a." },
  ],
};
