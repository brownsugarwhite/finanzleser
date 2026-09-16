/**
 * Steuererstattungs-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/SteuererstattungRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/steuererstattung.ts. Neu ist nur der Satz.
 */
import { berechne, type SteuererstattungParams, type SteuererstattungResult } from "@/lib/calculators/steuererstattung";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = SteuererstattungParams & Record<string, number | string | boolean>;

export const steuererstattungSchema: RechnerSchema<W, SteuererstattungResult> = {
  slug: "steuererstattung",
  titel: "Steuererstattungs-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Steuererstattungs-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { jahresBrutto: 42000, gezahlteLohnsteuer: 7500, gezahlterSoli: 0, werbungskostenTatsaechlich: 0, homeofficeTage: 0, sonderausgabenTatsaechlich: 0, aussergewoehnlicheBelastungen: 0, handwerkerkosten: 0 } as W,

  felder: [
    { baustein: "lineal", key: "jahresBrutto", label: "Jahres-Bruttolohn", min: 0, max: 200000, schritt: 1000, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "setzzeile", key: "gezahlteLohnsteuer", label: "Gezahlte Lohnsteuer", min: 0, max: 80000, schritt: 100, einheit: "€" },
    { baustein: "setzzeile", key: "gezahlterSoli", label: "Gezahlter Solidaritätszuschlag", min: 0, max: 5000, schritt: 10, einheit: "€" },
    { baustein: "lineal", key: "werbungskostenTatsaechlich", label: "Werbungskosten (tatsächlich)", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "setzzeile", key: "homeofficeTage", label: "Homeoffice-Tage", min: 0, schritt: 1, einheit: "Tage" },
    { baustein: "lineal", key: "sonderausgabenTatsaechlich", label: "Sonderausgaben (tatsächlich)", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "aussergewoehnlicheBelastungen", label: "Außergewöhnliche Belastungen", min: 0, max: 20000, schritt: 100, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "lineal", key: "handwerkerkosten", label: "Handwerkerleistungen (Lohnkosten)", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e, w) => [
    {
      art: "kacheln",
      kacheln: [
        { label: e.istErstattung ? "Voraussichtliche Erstattung" : "Voraussichtliche Nachzahlung", wert: Math.abs(e.erstattungGesamt), text: fmtGeld, haupt: true },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Jahres-Bruttolohn", v: fmtGeld(e.jahresBrutto) },
        { k: "Werbungskosten (angesetzt)", v: fmtGeld(e.werbungskosten) },
        { k: "Homeoffice-Pauschale", v: fmtGeld(e.homeofficePauschale) },
        { k: "Sonderausgaben", v: fmtGeld(e.sonderausgaben) },
        { k: "Außergewöhnliche Belastungen", v: fmtGeld(e.aussergewoehnlicheBelastungen) },
        { k: "Zu versteuerndes Einkommen", v: fmtGeld(e.zvE) },
        { k: "Einkommensteuer (Soll)", v: fmtGeld(e.estSoll) },
        { k: "Handwerker-Ermäßigung (§35a)", v: `–${fmtGeld(e.handwerkerErmaessigung)}` },
        { k: "Soli (Soll)", v: fmtGeld(e.soliSoll) },
        { k: "Gezahlte Lohnsteuer", v: fmtGeld(w.gezahlteLohnsteuer) },
        { k: "Gezahlter Soli", v: fmtGeld(w.gezahlterSoli) },
      ],
    },
    { art: "hinweis", text: "Vereinfachte Berechnung. Kirchensteuer, Kinderfreibeträge und individuelle Sonderausgabenabzüge sind nicht berücksichtigt." },
  ],
};
