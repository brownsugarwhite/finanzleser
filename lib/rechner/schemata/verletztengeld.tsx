/**
 * Verletztengeld-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/VerletztensgeldRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/verletztengeld.ts. Neu ist nur der Satz.
 */
import { berechne, type VerletztengeldParams, type VerletztengeldResult } from "@/lib/calculators/verletztengeld";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = VerletztengeldParams & Record<string, number | string | boolean>;

export const verletztengeldSchema: RechnerSchema<W, VerletztengeldResult> = {
  slug: "verletztengeld",
  titel: "Verletztengeld-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Verletztengeld-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3500, monatsNetto: 2400 } as W,

  felder: [
    { baustein: "lineal", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 0, max: 15000, schritt: 100, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "monatsNetto", label: "Monatliches Nettogehalt", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Verletztengeld täglich", wert: e.vgTaeglich, text: fmtGeld },
        { label: "Verletztengeld monatlich", wert: e.vgMonatlich, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Monatsbrutto", v: `${fmtGeld(e.monatsBrutto)}${e.istBegrenzt ? " (über JAV-Höchstbetrag)" : ""}` },
        { k: "Brutto (begrenzt)", v: fmtGeld(e.bruttoBegrenzt) },
        { k: "Regelentgelt (täglich)", v: fmtGeld(e.regelentgeltTaeglich) },
        { k: "80% Brutto (täglich)", v: fmtGeld(e.vgBruttoTaeglich) },
        { k: "Netto (täglich)", v: fmtGeld(e.nettoTaeglich) },
        { k: "Verletztengeld (täglich)", v: fmtGeld(e.vgTaeglich) },
        { k: "Verletztengeld (wöchentlich)", v: fmtGeld(e.vgWoechentlich) },
      ],
    },
    { art: "hinweis", text: "Verletztengeld betraegt 80% des Regelentgelts, max. Nettoverdienst (SS 45-52 SGB VII). Es wird bei Arbeitsunfaellen und Berufskrankheiten gezahlt." },
  ],
};
