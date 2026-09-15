/**
 * Unterhalts-Rechner 2026 im Kursblatt-Satz.
 *
 * Felder, Ergebniszeilen und Hinweis stammen 1:1 aus components/rechner/UnterhaltRechner.tsx —
 * gerechnet wird weiterhin mit lib/calculators/unterhalt.ts. Neu ist nur der Satz.
 */
import { berechne, type UnterhaltParams, type UnterhaltResult } from "@/lib/calculators/unterhalt";
import { fmtGeld } from "@/lib/kursblatt/zahl";
import type { RechnerSchema } from "../schema";

/** Altersstufen der Düsseldorfer Tabelle, wortgleich aus UnterhaltRechner.tsx. */
const ALTERSSTUFEN_LABELS = ["0–5 Jahre", "6–11 Jahre", "12–17 Jahre", "ab 18 Jahre"];

type W = UnterhaltParams & Record<string, number | string | boolean>;

export const unterhaltSchema: RechnerSchema<W, UnterhaltResult> = {
  slug: "unterhalt",
  titel: "Unterhalts-Rechner 2026",
  kicker: "Rechner",
  pfad: "Finanztools · Rechner · Unterhalts-Rechner 2026",
  vorspann: "Werte eintragen – der Knopf öffnet das vollständige Ergebnis.",

  start: { nettoEinkommen: 2800, sonstigeAbzuege: 0, kindAlter: 8, unterhaltsberechtigte: 2, erwerbstaetig: true } as W,

  felder: [
    { baustein: "lineal", key: "nettoEinkommen", label: "Nettoeinkommen", min: 0, max: 10000, schritt: 100, einheit: "€", px: 18, major: 10, mittel: 5, breit: true },
    { baustein: "lineal", key: "sonstigeAbzuege", label: "Sonstige Abzuege", min: 0, max: 3000, schritt: 50, einheit: "€", px: 30, major: 5, mittel: 0, breit: true },
    { baustein: "register", key: "kindAlter", label: "Alter des Kindes", optionen: [{ wert: "0", label: "0 Jahre" }, { wert: "1", label: "1 Jahre" }, { wert: "2", label: "2 Jahre" }, { wert: "3", label: "3 Jahre" }, { wert: "4", label: "4 Jahre" }, { wert: "5", label: "5 Jahre" }, { wert: "6", label: "6 Jahre" }, { wert: "7", label: "7 Jahre" }, { wert: "8", label: "8 Jahre" }, { wert: "9", label: "9 Jahre" }, { wert: "10", label: "10 Jahre" }, { wert: "11", label: "11 Jahre" }, { wert: "12", label: "12 Jahre" }, { wert: "13", label: "13 Jahre" }, { wert: "14", label: "14 Jahre" }, { wert: "15", label: "15 Jahre" }, { wert: "16", label: "16 Jahre" }, { wert: "17", label: "17 Jahre" }, { wert: "18", label: "18 Jahre" }, { wert: "19", label: "19 Jahre" }, { wert: "20", label: "20 Jahre" }, { wert: "21", label: "21 Jahre" }, { wert: "22", label: "22 Jahre" }, { wert: "23", label: "23 Jahre" }, { wert: "24", label: "24 Jahre" }, { wert: "25", label: "25 Jahre" }] },
    { baustein: "register", key: "unterhaltsberechtigte", label: "Anzahl Unterhaltsberechtigte", optionen: [{ wert: "1", label: "1" }, { wert: "2", label: "2" }, { wert: "3", label: "3" }, { wert: "4", label: "4" }, { wert: "5", label: "5" }] },
    { baustein: "schalter", key: "erwerbstaetig", label: "Unterhaltspflichtiger ist erwerbstaetig" },
  ],

  rechne: (w, rates) => berechne(w, rates),

  ergebnis: (e) => [
    {
      art: "kacheln",
      kacheln: [
        { label: "Zahlbetrag / Monat", wert: e.zahlbetrag, text: fmtGeld, haupt: true },
        { label: "Verbleibend", wert: e.verbleibtNachUnterhalt, text: fmtGeld },
      ],
    },
    {
      art: "punktzeilen",
      zeilen: [
        { k: "Bereinigtes Netto", v: fmtGeld(e.bereinigteNetto) },
        { k: "Einkommensgruppe (Basis)", v: `Gruppe ${e.basisGruppe}` },
        { k: "Korrigierte Gruppe", v: `Gruppe ${e.korrigierteGruppe}` },
        { k: "Altersstufe", v: String(ALTERSSTUFEN_LABELS[e.altersstufe]) },
        { k: "Tabellenbetrag", v: fmtGeld(e.tabellenbetrag) },
        { k: "Kindergeld-Abzug", v: `- ${fmtGeld(e.kgAbzug)}` },
        { k: "Selbstbehalt", v: fmtGeld(e.selbstbehalt) },
        { k: "Verbleibt nach Unterhalt", v: fmtGeld(e.verbleibtNachUnterhalt) },
        { k: "Leistungsfaehig", v: e.leistungsfaehig ? "Ja" : "Nein" },
        { k: "Bedarfskontrollbetrag (BKB)", v: fmtGeld(e.bkb) },
        { k: "BKB eingehalten", v: e.bkbEingehalten ? "Ja" : "Nein" },
      ],
    },
    { art: "hinweis", text: "Achtung: Nach Abzug des Unterhalts verbleibt weniger als der notwendige Selbstbehalt (). Der Zahlbetrag muesste ggf. gekuerzt werden." },
    { art: "hinweis", text: "Basis: Dueseldorfer Tabelle 2026 (OLG Duesseldorf). Berufspauschale 5 % vom Netto (min. 50 EUR, max. 150 EUR). Tabellengruppe wird bei abweichender Anzahl Unterhaltsberechtigter korrigiert. Fuer die tatsaechliche Unterhaltspflicht sollten Sie einen Anwalt oder das Jugendamt konsultieren." },
  ],
};
