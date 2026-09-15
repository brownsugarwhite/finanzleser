/**
 * Flexrenten-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/FlexrenteRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/flexrente.ts. Neu ist nur der Satz.
 */
import { berechne, type FlexrenteParams, type FlexrenteResult } from "@/lib/calculators/flexrente";
import { fmtDe, fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import { punkte } from "@/lib/calculators/utils";
import type { RechnerSchema } from "../schema";

type W = FlexrenteParams & Record<string, number | string | boolean>;

export const flexrenteSchema: RechnerSchema<W, FlexrenteResult> = {
  slug: "flexrente",
  titel: "Flexrenten-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Flexrenten-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { entgeltpunkte: 40, monateVorher: 0, monateNachher: 0 } as W,

  felder: [
    { baustein: "setzzeile", key: "entgeltpunkte", label: "Entgeltpunkte", min: 0, max: 80, schritt: 0.5, einheit: "EP", dez: 1 },
    { baustein: "drehring", key: "monateVorher", label: "Monate vor Regelaltersgrenze (Abschlag)", min: 0, max: 60, schritt: 1, einheit: "Monate", gross: 6 },
    { baustein: "drehring", key: "monateNachher", label: "Monate nach Regelaltersgrenze (Zuschlag)", min: 0, max: 60, schritt: 1, einheit: "Monate", gross: 6 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatliche Rente", wert: e.renteMonatlich, text: fmtGeld },
        { label: "Zugangsfaktor", wert: e.zugangsfaktor, text: (v) => fmtDe(v, 4) },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Entgeltpunkte", v: String(punkte(w.entgeltpunkte)) },
        { k: "Abschlag (vorzeitig)", v: fmtProzent(e.abschlagProzent) },
        { k: "Zuschlag (spaeter)", v: fmtProzent(e.zuschlagProzent) },
        { k: "Zugangsfaktor", v: String(e.zugangsfaktor.toFixed(4)) },
      ],
    },
    { art: "hinweis", text: "Abschlag: 0,3 % pro Monat vor Regelaltersgrenze (max. 14,4 %). Zuschlag: 0,5 % pro Monat nach Regelaltersgrenze. Quelle: §§ 77, 302 SGB VI (Flexirentengesetz)." },
  ],
};
