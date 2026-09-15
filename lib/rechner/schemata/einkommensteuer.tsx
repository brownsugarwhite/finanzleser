/**
 * Einkommensteuer-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/EinkommensteuerRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/einkommensteuer.ts. Neu ist nur der Satz.
 */
import { berechne, type EinkommensteuerParams, type EinkommensteuerResult } from "@/lib/calculators/einkommensteuer";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = EinkommensteuerParams & Record<string, number | string | boolean>;

export const einkommensteuerSchema: RechnerSchema<W, EinkommensteuerResult> = {
  slug: "einkommensteuer",
  titel: "Einkommensteuer-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Einkommensteuer-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { jahresBrutto: 50000, steuerklasse: 1, bundesland: "Nordrhein-Westfalen", kirchenmitglied: false, werbungskosten: 0, sonderausgaben: 0, aussergewoehnlicheBelastungen: 0 } as W,

  felder: [
    { baustein: "lineal", key: "jahresBrutto", label: "Jahresbruttoeinkommen", min: 0, max: 300000, schritt: 1000, einheit: "€", px: 6, major: 25, mittel: 0, breit: true },
    { baustein: "register", key: "steuerklasse", label: "Steuerklasse", optionen: [{ wert: "1", label: "I – Ledig" }, { wert: "2", label: "II – Alleinerziehend" }, { wert: "3", label: "III – Verheiratet (höheres Einkommen)" }, { wert: "4", label: "IV – Verheiratet (ähnliches Einkommen)" }, { wert: "5", label: "V – Verheiratet (Ehegatte hat III)" }, { wert: "6", label: "VI – Zweitjob" }] },
    { baustein: "register", key: "bundesland", label: "Bundesland", optionen: [{ wert: "Baden-Württemberg", label: "Baden-Württemberg" }, { wert: "Bayern", label: "Bayern" }, { wert: "Berlin", label: "Berlin" }, { wert: "Brandenburg", label: "Brandenburg" }, { wert: "Bremen", label: "Bremen" }, { wert: "Hamburg", label: "Hamburg" }, { wert: "Hessen", label: "Hessen" }, { wert: "Mecklenburg-Vorpommern", label: "Mecklenburg-Vorpommern" }, { wert: "Niedersachsen", label: "Niedersachsen" }, { wert: "Nordrhein-Westfalen", label: "Nordrhein-Westfalen" }, { wert: "Rheinland-Pfalz", label: "Rheinland-Pfalz" }, { wert: "Saarland", label: "Saarland" }, { wert: "Sachsen", label: "Sachsen" }, { wert: "Sachsen-Anhalt", label: "Sachsen-Anhalt" }, { wert: "Schleswig-Holstein", label: "Schleswig-Holstein" }, { wert: "Thüringen", label: "Thüringen" }] },
    { baustein: "schalter", key: "kirchenmitglied", label: "Kirchenmitglied" },
    { baustein: "lineal", key: "werbungskosten", label: "Werbungskosten", min: 0, max: 20000, schritt: 100, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "lineal", key: "sonderausgaben", label: "Sonderausgaben", min: 0, max: 20000, schritt: 100, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
    { baustein: "lineal", key: "agb", label: "Außergewöhnliche Belastungen", min: 0, max: 20000, schritt: 100, einheit: "€", px: 9, major: 20, mittel: 10, breit: true },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Gesamtsteuer", wert: e.gesamtsteuer, text: fmtGeld, haupt: true },
        { label: "Netto-Einkommen", wert: e.nettoEinkommen, text: fmtGeld },
      ],
    },
    {
      art: "tabelle",
      titel: "Aufstellung",
      spalten: [{ key: "position", label: "Position" }, { key: "jaehrlich", label: "Jährlich", rechts: true }, { key: "monatlich", label: "Monatlich", rechts: true }],
      zeilen: [ { position: "Zu versteuerndes Einkommen", jaehrlich: fmtGeld(e.zvE), monatlich: fmtGeld(e.zvE / 12) }, { position: "Einkommensteuer", jaehrlich: fmtGeld(e.einkommensteuer), monatlich: fmtGeld(e.einkommensteuerMonatlich) }, { position: "Solidaritätszuschlag", jaehrlich: fmtGeld(e.solidaritaetszuschlag), monatlich: fmtGeld(e.solidaritaetszuschlagMonatlich) }, { position: "Kirchensteuer", jaehrlich: fmtGeld(e.kirchensteuer), monatlich: fmtGeld(e.kirchensteuerMonatlich) }, { position: "Gesamtsteuer", jaehrlich: fmtGeld(e.gesamtsteuer), monatlich: fmtGeld(e.gesamtsteuerMonatlich) }, { position: "Netto-Einkommen", jaehrlich: fmtGeld(e.nettoEinkommen), monatlich: fmtGeld(e.nettoEinkommenMonatlich) }, ],
      letzteBetont: true,
    },
    { art: "zeiger", label: "Effektiver Steuersatz", wert: Math.round(e.effektiverSteuersatz) },
    { art: "hinweis", text: "Berechnung nach §32a EStG 2026. Individuelle Freibeträge, Vorsorgeaufwendungen und Kinderfreibeträge können die tatsächliche Steuerlast verändern." },
  ],
};
