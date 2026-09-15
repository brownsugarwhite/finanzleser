/**
 * Das Feld- und Ergebnis-Schema der Kursblatt-Rechner.
 *
 * Statt in jeder der 56 Rechner-Dateien Gerüst, Felder und Ergebnis von Hand zu setzen,
 * beschreibt ein Schema, WAS der Rechner braucht; `KursblattRechner` setzt es.
 *
 * 🚨 Anders als `DefLite` bei den Vergleichen darf hier alles stehen, auch Funktionen:
 * Rechner-Inseln tragen nur den Slug (components/faden/kette/InselnBeleben.tsx:50), das
 * Schema reist nie als JSON durch den Browser, sondern liegt im Bündel.
 */
import type { RATES } from "@/lib/calculators/rates";
import type { ReactNode } from "react";

export type Baustein = "lineal" | "drehring" | "zaehlwerk" | "setzzeile" | "register" | "schalter";

export type Werte = Record<string, number | string | boolean>;

interface FeldBasis {
  key: string;
  label: string;
  /** Kleine Zeile rechts neben der Bezeichnung: „500 – 200.000 €“, „am Ring drehen“. */
  bereich?: string;
  einheit?: string;
  min?: number;
  max?: number;
  schritt?: number;
  dez?: number;
  /** Volle Satzbreite statt einer der beiden Spalten. */
  breit?: boolean;
  hinweis?: string;
  /** Ersetzt RechnerConditionalGroup: Feld erscheint nur, wenn die Bedingung hält. */
  wenn?: (w: Werte) => boolean;
}

export interface FeldLineal extends FeldBasis {
  baustein: "lineal";
  px: number;
  major: number;
  mittel?: number;
  marken?: { wert: number; label: string }[];
}
export interface FeldDrehring extends FeldBasis {
  baustein: "drehring";
  gross?: number;
  beschriftet?: number[];
  unter?: (v: number) => string;
}
export interface FeldZaehlwerk extends FeldBasis {
  baustein: "zaehlwerk";
  schnellwahl?: number[];
}
export interface FeldSetzzeile extends FeldBasis {
  baustein: "setzzeile";
  vorschlaege?: number[];
  vorschlaegeImmer?: boolean;
  stepper?: boolean;
  platzhalter?: string;
}
export interface FeldRegister extends FeldBasis {
  baustein: "register";
  optionen: { wert: string | number; label: string; meta?: string | ((w: Werte) => string) }[];
  maxHoehe?: string;
}
export interface FeldSchalter extends FeldBasis {
  baustein: "schalter";
}
export type Feld = FeldLineal | FeldDrehring | FeldZaehlwerk | FeldSetzzeile | FeldRegister | FeldSchalter;

/** Ein Baustein des Ergebnisses. Wächst mit jeder Rechner-Tranche um die Formen, die dort nötig sind. */
export type ErgebnisBlock =
  | { art: "kacheln"; kacheln: { label: string; wert: number; text: (v: number) => string; haupt?: boolean }[] }
  | { art: "anteilsband"; titel: string; teile: { label: string; anteil: number; ton: "ink" | "magenta" }[] }
  | { art: "kurve"; titel: string; werte: number[]; jahresTicks?: boolean; xText: (i: number) => string; scrubText: (i: number, v: number) => string }
  | { art: "tabelle"; titel: string; spalten: { key: string; label: string; rechts?: boolean; ton?: "magenta" }[]; zeilen: Record<string, string>[]; letzteBetont?: boolean }
  | { art: "punktzeilen"; titel?: string; zeilen: { k: string; v: string; ton?: "gut" | "warnung" }[] }
  | { art: "hinweis"; text: ReactNode };

export interface Preset<W extends Werte> {
  id: string;
  label: string;
  sub: string;
  werte: Partial<W>;
  neigung: string;
}

/**
 * Was der Vergleich für die Eingaben des Rechners gerade hergibt — die Zahlen der Brücke
 * („aktuell 20 Angebote ab 0,68 %, das wären ab 339 € im Monat“).
 */
export interface MarktKurz {
  titel: string;
  mehrzahl: string;
  anzahl: number;
  href: string;
  bestwert: { anbieter: string; wert: string; label: string; total: string | null; totalLabel: string | null } | null;
}

export interface RechnerSchema<W extends Werte = Werte, E = unknown> {
  slug: string;
  /** „Kreditrechner“ — steht als H2 im Kursblatt. */
  titel: string;
  /** „Rechner · Kredit“ — Werkzeug-Kicker mit magentafarbenem Punkt. */
  kicker: string;
  /** Pfad links oben im Zeitungskopf. */
  pfad: string;
  vorspann: string;
  start: W;
  presets?: Preset<W>[];
  felder: Feld[];
  /** „Leo rechnet mit: ≈ 387 € im Monat · unverbindlich“ — rollt live mit. */
  vorschau?: (w: W) => { vor: string; zahl: string; nach: string };
  rechne: (w: W, rates: typeof RATES) => E;
  ergebnis: (e: E, w: W) => ErgebnisBlock[];
  /** Pflichthinweis unter dem Ergebnis. */
  hinweis?: string;
  /** Brücke in den Vergleich: übernimmt die Werte in den Hash der Vergleichsseite. */
  bruecke?: {
    slug: string;
    titel: string;
    /**
     * Der Satz über der Pille. `markt` trägt die Zahlen, die der Vergleich für GENAU
     * diese Eingaben nennt (`/api/vergleich-daten/<slug>?kurz=1&…`) — er fehlt, solange
     * sie laden, und bleibt weg, wenn der Partner nicht antwortet. Der Satz muss deshalb
     * auch ohne ihn stehen können.
     */
    satz: (w: W, e: E, markt?: MarktKurz) => ReactNode;
    uebernimm: (w: W) => Record<string, string | number>;
    /** Beschriftung im Aktenkoffer; fehlt sie, steht der Titel des Rechners da. */
    koffer?: (w: W, e: E) => string;
  };
}
