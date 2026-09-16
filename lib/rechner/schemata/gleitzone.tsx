/**
 * Gleitzone/Midijob-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/GleitzoneRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/gleitzone.ts. Neu ist nur der Satz.
 */
import { berechne, type GleitzoneParams, type GleitzoneResult } from "@/lib/calculators/gleitzone";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** Beschäftigungsarten, wortgleich aus components/rechner/GleitzoneRechner.tsx. */
const typLabels: Record<string, string> = { minijob: "Minijob", gleitzone: "Gleitzone (Midijob)", regulaer: "Regulär versicherungspflichtig" };

type W = GleitzoneParams & Record<string, number | string | boolean>;

export const gleitzoneSchema: RechnerSchema<W, GleitzoneResult> = {
  slug: "gleitzone",
  titel: "Gleitzone/Midijob-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Gleitzone/Midijob-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 1200 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 3000, schritt: 50, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Netto nach SV", wert: e.nettoNachSV, text: fmtGeld },
        { label: "SV-Ersparnis", wert: e.ersparnisAbsolut, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Beschäftigungstyp", v: String(typLabels[e.typ] || e.typ) },
        { k: "Monatsbrutto", v: fmtGeld(e.monatsBrutto) },
        { k: "Beitragspflichtiges Entgelt", v: fmtGeld(e.beitragsAE) },
        { k: "SV-Beitrag AN (Gleitzone)", v: fmtGeld(e.svANGleitzone) },
        { k: "SV-Beitrag AN (normal)", v: fmtGeld(e.svANNormal) },
        { k: "Ersparnis", v: fmtGeld(e.ersparnisAbsolut) },
        { k: "Ersparnis (%)", v: fmtProzent(e.ersparnisProzent) },
        { k: "Netto nach SV", v: fmtGeld(e.nettoNachSV) },
        { k: "RV-Aufstockung AN", v: fmtGeld(e.rvAufstockung) },
      ],
    },
    { art: "zeiger", label: "Nettoquote", wert: e.monatsBrutto > 0 ? Math.round((e.nettoNachSV / e.monatsBrutto) * 100) : 0 },
    { art: "hinweis", text: "In der Gleitzone (538,01-2.000 EUR) zahlen Arbeitnehmer reduzierte SV-Beiträge (SS 20 Abs. 2 SGB IV). Die Ersparnis ist bei niedrigem Einkommen am groessten." },
  ],
};
