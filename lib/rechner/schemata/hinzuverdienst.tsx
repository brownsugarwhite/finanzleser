/**
 * Hinzuverdienst-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/HinzuverdienstRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/hinzuverdienst.ts. Neu ist nur der Satz.
 */
import { berechne, type HinzuverdienstParams, type HinzuverdienstResult } from "@/lib/calculators/hinzuverdienst";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = HinzuverdienstParams & Record<string, number | string | boolean>;

export const hinzuverdienstSchema: RechnerSchema<W, HinzuverdienstResult> = {
  slug: "hinzuverdienst",
  titel: "Hinzuverdienst-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Hinzuverdienst-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatlicheRente: 1500, monatlichesEinkommen: 2000, istVorzeitigeRente: false } as W,

  felder: [
    { baustein: "drehring", key: "monatlicheRente", label: "Monatliche Rente", min: 0, max: 5000, schritt: 100, einheit: "€/Monat", gross: 5 },
    { baustein: "drehring", key: "monatlichesEinkommen", label: "Monatliches Einkommen (Hinzuverdienst)", min: 0, max: 8000, schritt: 100, einheit: "€/Monat", gross: 8 },
    { baustein: "schalter", key: "istVorzeitigeRente", label: "Vorzeitige Rente (vor Regelaltersgrenze)" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Verbleibende Rente", wert: e.verbleibendeRente, text: fmtGeld },
        { label: "Gesamteinkommen", wert: e.gesamtEinkommen, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Monatliche Rente", v: fmtGeld(w.monatlicheRente) },
        { k: "Monatliches Einkommen", v: fmtGeld(w.monatlichesEinkommen) },
        { k: "Hinzuverdienstgrenze (monatlich)", v: String(e.hinzuverdienstGrenze > 0
                  ? fmtGeld(e.hinzuverdienstGrenze)
                  : "unbegrenzt") },
        { k: "Kuerzungsbetrag", v: fmtGeld(e.kuerzungsBetrag) },
      ],
    },
    { art: "hinweis", text: "monatlich. 40 % des übersteigenden Einkommens werden von der Rente abgezogen.` : \"Bei der Regelaltersrente gibt es seit 2023 keine Hinzuverdienstgrenze mehr. Sie koennen unbegrenzt hinzuverdienen.\" } Quelle: § 34 SGB VI." },
  ],
};
