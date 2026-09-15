/**
 * Witwenrente-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/WitwenrenteRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/witwenrente.ts. Neu ist nur der Satz.
 */
import { berechne, type WitwenrenteParams, type WitwenrenteResult } from "@/lib/calculators/witwenrente";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = WitwenrenteParams & Record<string, number | string | boolean>;

export const witwenrenteSchema: RechnerSchema<W, WitwenrenteResult> = {
  slug: "witwenrente",
  titel: "Witwenrente-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Witwenrente-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { entgeltpunkteVerstorbener: 40, eigeneEntgeltpunkte: 15, grosseWR: true, eigenesEinkommen: 1000 } as W,

  felder: [
    { baustein: "setzzeile", key: "entgeltpunkteVerstorbener", label: "Entgeltpunkte des Verstorbenen", min: 0, max: 100, schritt: 0.5, einheit: "EP", dez: 1 },
    { baustein: "setzzeile", key: "eigeneEntgeltpunkte", label: "Eigene Entgeltpunkte", min: 0, max: 100, schritt: 0.5, einheit: "EP", dez: 1 },
    { baustein: "schalter", key: "grosseWR", label: "Grosse Witwenrente (55 %)" },
    { baustein: "drehring", key: "eigenesEinkommen", label: "Eigenes monatliches Nettoeinkommen", min: 0, max: 8000, schritt: 100, einheit: "€/Monat", gross: 8 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Witwenrente (nach Anrechnung)", wert: e.witwenrenteNachAnrechnung, text: fmtGeld },
        { label: "Witwenrente (vor Anrechnung)", wert: e.witwenrenteVorAnrechnung, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Rente des Verstorbenen", v: fmtGeld(e.renteVerstorbener) },
        { k: "Witwenrente (${params.grosseWR ? \"55 %\" : \"25 %\"})", v: fmtGeld(e.witwenrenteVorAnrechnung) },
        { k: "Freibetrag", v: fmtGeld(e.freibetrag) },
        { k: "Anrechenbare Einkuenfte", v: fmtGeld(e.anrechenbareEinkuenfte) },
        { k: "Kuerzung (40 %)", v: fmtGeld(e.kuerzung) },
      ],
    },
    { art: "hinweis", text: "Eigenes Einkommen über dem Freibetrag () wird zu 40 % angerechnet. Quelle: §§ 46, 97 SGB VI." },
  ],
};
