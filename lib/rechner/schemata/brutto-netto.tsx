/**
 * Brutto-Netto-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/BruttoNettoRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/brutto-netto.ts. Neu ist nur der Satz.
 */
import { berechne, type BruttoNettoParams, type BruttoNettoResult } from "@/lib/calculators/brutto-netto";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

type W = BruttoNettoParams & Record<string, number | string | boolean>;

export const bruttoNettoSchema: RechnerSchema<W, BruttoNettoResult> = {
  slug: "brutto-netto",
  titel: "Brutto-Netto-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Brutto-Netto-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { monatsBrutto: 3000, steuerklasse: 1, bundesland: "Nordrhein-Westfalen", kirchenmitglied: false, kinderAnzahl: 1, kinderlosUeber23: false, kvZusatzbeitrag: 2.9 } as W,

  felder: [
    { baustein: "setzzeile", key: "monatsBrutto", label: "Monatliches Bruttogehalt", min: 1, max: 150000, schritt: 100, einheit: "€" },
    { baustein: "register", key: "steuerklasse", label: "Steuerklasse", optionen: [{ wert: "1", label: "I – Ledig" }, { wert: "2", label: "II – Alleinerziehend" }, { wert: "3", label: "III – Verheiratet (höheres Einkommen)" }, { wert: "4", label: "IV – Verheiratet (ähnliches Einkommen)" }, { wert: "5", label: "V – Verheiratet (Ehegatte hat III)" }, { wert: "6", label: "VI – Zweitjob" }] },
    { baustein: "register", key: "bundesland", label: "Bundesland", optionen: [{ wert: "Baden-Württemberg", label: "Baden-Württemberg" }, { wert: "Bayern", label: "Bayern" }, { wert: "Berlin", label: "Berlin" }, { wert: "Brandenburg", label: "Brandenburg" }, { wert: "Bremen", label: "Bremen" }, { wert: "Hamburg", label: "Hamburg" }, { wert: "Hessen", label: "Hessen" }, { wert: "Mecklenburg-Vorpommern", label: "Mecklenburg-Vorpommern" }, { wert: "Niedersachsen", label: "Niedersachsen" }, { wert: "Nordrhein-Westfalen", label: "Nordrhein-Westfalen" }, { wert: "Rheinland-Pfalz", label: "Rheinland-Pfalz" }, { wert: "Saarland", label: "Saarland" }, { wert: "Sachsen", label: "Sachsen" }, { wert: "Sachsen-Anhalt", label: "Sachsen-Anhalt" }, { wert: "Schleswig-Holstein", label: "Schleswig-Holstein" }, { wert: "Thüringen", label: "Thüringen" }] },
    { baustein: "schalter", key: "kirchenmitglied", label: "Kirchenmitglied" },
    { baustein: "register", key: "kinderAnzahl", label: "Kinder unter 25", optionen: [{ wert: "0", label: "0" }, { wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5+" }] },
    { baustein: "schalter", key: "kinderlosÜber23", label: "Kinderlos und über 23 Jahre" },
    { baustein: "zaehlwerk", key: "kvZusatzbeitrag", label: "KV-Zusatzbeitrag", min: 0, max: 10, schritt: 0.1, einheit: "%", dez: 1 },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Nettolohn", wert: e.netto, text: fmtGeld, haupt: true },
        { label: "Netto (jährlich)", wert: e.nettoJahr, text: fmtGeld },
      ],
    },
    {
      art: "tabelle",
      titel: "Aufstellung",
      spalten: [{ key: "position", label: "Position" }, { key: "monatlich", label: "Monatlich", rechts: true }, { key: "jaehrlich", label: "Jährlich", rechts: true }],
      zeilen: [ { position: "Bruttogehalt", monatlich: fmtGeld(e.monatsBrutto), jaehrlich: fmtGeld(e.jahresBrutto) }, { position: "Rentenversicherung", monatlich: fmtGeld(e.sv.rv), jaehrlich: fmtGeld(e.svJahr.rv) }, { position: "Krankenversicherung", monatlich: fmtGeld(e.sv.kv), jaehrlich: fmtGeld(e.svJahr.kv) }, { position: "Pflegeversicherung", monatlich: fmtGeld(e.sv.pv), jaehrlich: fmtGeld(e.svJahr.pv) }, { position: "Arbeitslosenversicherung", monatlich: fmtGeld(e.sv.alv), jaehrlich: fmtGeld(e.svJahr.alv) }, { position: "Sozialversicherung gesamt", monatlich: fmtGeld(e.sv.gesamt), jaehrlich: fmtGeld(e.svJahr.gesamt) }, { position: "Lohnsteuer", monatlich: fmtGeld(e.lohnsteuer), jaehrlich: fmtGeld(e.lohnsteuerJahr) }, { position: "Solidaritätszuschlag", monatlich: fmtGeld(e.solidaritaetszuschlag), jaehrlich: fmtGeld(e.solidaritaetszuschlagJahr) }, { position: "Kirchensteuer", monatlich: fmtGeld(e.kirchensteuer), jaehrlich: fmtGeld(e.kirchensteuerJahr) }, { position: "Steuern gesamt", monatlich: fmtGeld(e.steuernGesamt), jaehrlich: fmtGeld(e.steuernGesamtJahr) }, { position: "Gesamtabzüge", monatlich: fmtGeld(e.gesamtAbzuege), jaehrlich: fmtGeld(e.gesamtAbzuegeJahr) }, { position: "Nettolohn", monatlich: fmtGeld(e.netto), jaehrlich: fmtGeld(e.nettoJahr) }, ],
      letzteBetont: true,
    },
    { art: "zeiger", label: "Nettoquote", wert: Math.round((e.netto / e.monatsBrutto) * 100) },
    { art: "messlatte", wert: Math.round(e.netto), schnitt: 2200, einheit: " €", wertLabel: "Dein Netto", schnittLabel: "Ø Deutschland" },
    { art: "hinweis", text: "Kirchensteuer und eigener KV-Zusatzbeitrag berücksichtigt. Individuelle Freibeträge und Sonderausgaben sind nicht enthalten." },
  ],
};
