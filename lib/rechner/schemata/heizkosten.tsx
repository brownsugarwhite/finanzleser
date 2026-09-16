/**
 * Heizkosten-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/HeizkostenRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/heizkosten.ts. Neu ist nur der Satz.
 */
import { berechne, type HeizkostenParams, type HeizkostenResult } from "@/lib/calculators/heizkosten";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = HeizkostenParams & Record<string, number | string | boolean>;

export const heizkostenSchema: RechnerSchema<W, HeizkostenResult> = {
  slug: "heizkosten",
  titel: "Heizkosten-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Heizkosten-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { wohnflaeche: 80, energietraeger: "gas", verbrauchKwh: 0 } as W,

  felder: [
    { baustein: "setzzeile", key: "wohnflaeche", label: "Wohnfläche", min: 10, max: 500, schritt: 5, einheit: "m2" },
    { baustein: "register", key: "energietraeger", label: "Energieträger", optionen: [{ wert: "gas", label: "Erdgas" }, { wert: "oel", label: "Heizöl" }, { wert: "fernwaerme", label: "Fernwärme" }, { wert: "waermepumpe", label: "Wärmepumpe (Strom)" }] },
    { baustein: "setzzeile", key: "verbrauchKwh", label: "Verbrauch (0 = automatisch)", min: 0, max: 40000, schritt: 100, einheit: "kWh/Jahr" },
  ],

  rechne: (w) => berechne(w),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Heizkosten / Jahr", wert: e.kostenJahr, text: fmtGeld },
        { label: "Heizkosten / Monat", wert: e.kostenMonat, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Jahresverbrauch", v: `${e.jahresverbrauch.toLocaleString("de-DE")} kWh` },
        { k: "Kosten / Jahr", v: fmtGeld(e.kostenJahr) },
        { k: "Kosten / Monat", v: fmtGeld(e.kostenMonat) },
        { k: "CO2-Ausstoss / Jahr", v: `${e.co2Ausstoss.toLocaleString("de-DE")} kg` },
      ],
    },
    { art: "hinweis", text: "Bei Verbrauch = 0 wird ein Durchschnittswert basierend auf Wohnfläche und Energieträger berechnet. Die Kosten sind Durchschnittswerte für Deutschland 2026." },
  ],
};
