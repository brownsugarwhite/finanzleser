/**
 * Kirchensteuer-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/KirchensteuerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/kirchensteuer.ts. Neu ist nur der Satz.
 */
import { berechne, type KirchensteuerParams, type KirchensteuerResult } from "@/lib/calculators/kirchensteuer";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = KirchensteuerParams & Record<string, number | string | boolean>;

export const kirchensteuerSchema: RechnerSchema<W, KirchensteuerResult> = {
  slug: "kirchensteuer",
  titel: "Kirchensteuer-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Kirchensteuer-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { lohnsteuerJahr: 3000, bundesland: "Nordrhein-Westfalen" } as W,

  felder: [
    { baustein: "setzzeile", key: "lohnsteuerJahr", label: "Jährliche Lohn-/Einkommensteuer", min: 0, max: 100000, schritt: 100, einheit: "€" },
    { baustein: "register", key: "bundesland", label: "Bundesland", optionen: [{ wert: "Baden-Württemberg", label: "Baden-Württemberg" }, { wert: "Bayern", label: "Bayern" }, { wert: "Berlin", label: "Berlin" }, { wert: "Brandenburg", label: "Brandenburg" }, { wert: "Bremen", label: "Bremen" }, { wert: "Hamburg", label: "Hamburg" }, { wert: "Hessen", label: "Hessen" }, { wert: "Mecklenburg-Vorpommern", label: "Mecklenburg-Vorpommern" }, { wert: "Niedersachsen", label: "Niedersachsen" }, { wert: "Nordrhein-Westfalen", label: "Nordrhein-Westfalen" }, { wert: "Rheinland-Pfalz", label: "Rheinland-Pfalz" }, { wert: "Saarland", label: "Saarland" }, { wert: "Sachsen", label: "Sachsen" }, { wert: "Sachsen-Anhalt", label: "Sachsen-Anhalt" }, { wert: "Schleswig-Holstein", label: "Schleswig-Holstein" }, { wert: "Thüringen", label: "Thüringen" }] },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Kirchensteuer (jährlich)", wert: e.kirchensteuerJahr, text: fmtGeld, haupt: true },
        { label: "Kirchensteuer (monatlich)", wert: e.kirchensteuerMonat, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Einkommensteuer", v: fmtGeld(e.lohnsteuerJahr) },
        { k: "Kirchensteuersatz (${result.bundesland})", v: `${e.satzProzent} %` },
        { k: "Kirchensteuer (jährlich)", v: fmtGeld(e.kirchensteuerJahr) },
        { k: "Kirchensteuer (monatlich)", v: fmtGeld(e.kirchensteuerMonat) },
      ],
    },
    { art: "hinweis", text: "Bayern und Baden-Württemberg: 8 %. Alle anderen Bundesländer: 9 %. Die Kirchensteuer wird auf die Einkommensteuer berechnet." },
  ],
};
