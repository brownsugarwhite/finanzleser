/**
 * Rentenrechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/RenteRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/rente.ts. Neu ist nur der Satz.
 */
import { berechne, type RenteParams, type RenteResult } from "@/lib/calculators/rente";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import { punkte } from "@/lib/calculators/utils";
import type { RechnerSchema } from "../schema";

type W = RenteParams & Record<string, number | string | boolean>;

export const renteSchema: RechnerSchema<W, RenteResult> = {
  slug: "rente",
  titel: "Rentenrechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Rentenrechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { geburtsjahr: 1975, beitragsjahre: 30, jahresBrutto: 40000, bekannteEntgeltpunkte: 0 } as W,

  felder: [
    { baustein: "setzzeile", key: "geburtsjahr", label: "Geburtsjahr", min: 1940, max: 2000, schritt: 1 },
    { baustein: "drehring", key: "beitragsjahre", label: "Beitragsjahre", min: 1, max: 50, schritt: 1, einheit: "Jahre", gross: 5 },
    { baustein: "drehring", key: "jahresBrutto", label: "Jahresbruttoeinkommen", min: 0, max: 120000, schritt: 1000, einheit: "€/Jahr", gross: 12 },
    { baustein: "setzzeile", key: "bekannteEntgeltpunkte", label: "Bekannte Entgeltpunkte (optional)", min: 0, max: 100, schritt: 0.5, einheit: "EP", dez: 1 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Monatliche Rente", wert: e.renteMonatlich, text: fmtGeld },
        { label: "Jährliche Rente", wert: e.renteJaehrlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Entgeltpunkte", v: String(punkte(e.entgeltpunkte)) },
        { k: "Zugangsfaktor", v: String(e.zugangsfaktor.toFixed(2)) },
        { k: "Aktueller Rentenwert", v: fmtGeld(e.rentenwertAktuell) },
        { k: "Regelaltersgrenze", v: `${e.regelaltersgrenze} Jahre` },
        { k: "Verbleibende Jahre", v: `${e.verbleibendeJahre} Jahre` },
        { k: "Standardrente (45 EP)", v: fmtGeld(e.standardrente) },
      ],
    },
    { art: "messlatte", wert: Math.round(e.renteMonatlich), schnitt: Math.round(e.standardrente), einheit: " €", wertLabel: "Deine Rente", schnittLabel: "Standardrente (45 EP)" },
    { art: "hinweis", text: "Die Berechnung basiert auf dem aktuellen Rentenwert () und einem Zugangsfaktor von (Regelaltersgrenze). Die tatsaechliche Rente haengt von Ihren individuellen Versicherungszeiten ab. Quelle: Deutsche Rentenversicherung, SGB VI." },
  ],
};
