/**
 * Haushaltsrechner im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/HaushaltsrechnerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/haushaltsrechner.ts. Neu ist nur der Satz.
 */
import { berechne, type HaushaltsrechnerParams, type HaushaltsrechnerResult } from "@/lib/calculators/haushaltsrechner";
import { fmtGeld, fmtProzent } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = HaushaltsrechnerParams & Record<string, number | string | boolean>;

export const haushaltsrechnerSchema: RechnerSchema<W, HaushaltsrechnerResult> = {
  slug: "haushaltsrechner",
  titel: "Haushaltsrechner",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Haushaltsrechner",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { einkommen: 3000, miete: 800, nebenkosten: 200, lebensmittel: 400, versicherungen: 200, mobilitaet: 150, freizeit: 200, sonstiges: 100 } as W,

  felder: [
    { baustein: "lineal", key: "einkommen", label: "Netto-Einkommen", min: 0, max: 15000, schritt: 100, einheit: "€", px: 12, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "miete", label: "Miete", min: 0, max: 5000, schritt: 50, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "nebenkosten", label: "Nebenkosten", min: 0, max: 1500, schritt: 25, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "lineal", key: "lebensmittel", label: "Lebensmittel", min: 0, max: 1500, schritt: 25, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "lineal", key: "versicherungen", label: "Versicherungen", min: 0, max: 1500, schritt: 25, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "lineal", key: "mobilitaet", label: "Mobilität", min: 0, max: 1500, schritt: 25, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "lineal", key: "freizeit", label: "Freizeit", min: 0, max: 1500, schritt: 25, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "lineal", key: "sonstiges", label: "Sonstiges", min: 0, max: 1500, schritt: 25, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Sparbetrag / Monat", wert: e.sparBetrag, text: fmtGeld, haupt: true },
        { label: "Sparquote", wert: e.sparQuoteProzent, text: (v) => fmtProzent(v, 2) },
        { label: "Gesamtausgaben", wert: e.gesamtAusgaben, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Netto-Einkommen", v: fmtGeld(w.einkommen) },
        { k: "Gesamtausgaben", v: fmtGeld(e.gesamtAusgaben) },
        { k: "Sparbetrag / Monat", v: fmtGeld(e.sparBetrag) },
        { k: "Sparquote", v: fmtProzent(e.sparQuoteProzent) },
        { k: "Notgroschen reicht für", v: `${e.notgroschenMonate} Monate` },
      ],
    },
    { art: "zeiger", label: "Sparquote", wert: Math.max(0, Math.min(100, Math.round(e.sparQuoteProzent))) },
    { art: "messlatte", wert: Math.round(e.sparQuoteProzent), schnitt: 15, einheit: " %", wertLabel: "Deine Sparquote", schnittLabel: "Empfehlung" },
    { art: "hinweis", text: "Experten empfehlen eine Sparquote von mindestens 10-20% des Nettoeinkommens. Ein Notgroschen von 3-6 Monatsausgaben bietet finanzielle Sicherheit." },
  ],
};
