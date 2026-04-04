import { RATES } from "./rates";
import { rund } from "./utils";

export type Verwandtschaft = "ehegatte" | "kind" | "enkel" | "geschwister" | "sonstige";

export interface ErbschaftsteuerParams {
  erbschaftswert: number;
  verwandtschaft: Verwandtschaft;
  alterKind: number; // 0–27, nur relevant bei kind
  istErbschaft: boolean;
  bereitsEmpfangen: number;
}

export interface ErbschaftsteuerResult {
  steuerklasse: number;
  verwandtschaftText: string;
  persoenlichFreibetrag: number;
  versorgungsfreibetrag: number;
  gesamtFreibetrag: number;
  verfuegbarerFreibetrag: number;
  steuerpflichtigerErwerb: number;
  steuersatzProzent: number;
  erbschaftsteuer: number;
  nettowert: number;
  effektiverSatzProzent: number;
}

function getSteuerklasse(verwandtschaft: Verwandtschaft): number {
  switch (verwandtschaft) {
    case "ehegatte":
    case "kind":
    case "enkel":
      return 1;
    case "geschwister":
      return 2;
    case "sonstige":
      return 3;
  }
}

function getVerwandtschaftText(verwandtschaft: Verwandtschaft): string {
  switch (verwandtschaft) {
    case "ehegatte": return "Ehegatte / Lebenspartner";
    case "kind": return "Kind / Stiefkind";
    case "enkel": return "Enkel";
    case "geschwister": return "Geschwister";
    case "sonstige": return "Sonstige Personen";
  }
}

function getFreibetrag(verwandtschaft: Verwandtschaft, rates: typeof RATES): number {
  const fb = rates.erbschaftsteuer.freibetraege;
  switch (verwandtschaft) {
    case "ehegatte": return fb.ehegatte_lebenspartner;
    case "kind": return fb.kinder_stiefkinder;
    case "enkel": return fb.enkel_elternteil_lebt;
    case "geschwister": return fb.steuerklasse_2;
    case "sonstige": return fb.steuerklasse_3;
  }
}

function getVersorgungsfreibetrag(
  verwandtschaft: Verwandtschaft,
  alterKind: number,
  istErbschaft: boolean,
  rates: typeof RATES
): number {
  // Versorgungsfreibetrag gilt nur bei Erbschaft (nicht bei Schenkung)
  if (!istErbschaft) return 0;

  const vfb = rates.erbschaftsteuer.versorgungsfreibetrag;

  if (verwandtschaft === "ehegatte") return vfb.ehegatte;
  if (verwandtschaft === "kind") {
    if (alterKind < 5) return vfb.kind_bis_5_jahre;
    if (alterKind < 10) return vfb.kind_5_10_jahre;
    if (alterKind < 15) return vfb.kind_10_15_jahre;
    if (alterKind < 20) return vfb.kind_15_20_jahre;
    if (alterKind <= 27) return vfb.kind_20_27_jahre;
    return 0;
  }
  return 0;
}

function getSteuersatz(
  steuerpflichtigerErwerb: number,
  steuerklasse: number,
  rates: typeof RATES
): number {
  const tabellen = rates.erbschaftsteuer.steuersaetze_prozent;

  let tabelle: Array<{ bis: number; satz: number }>;
  switch (steuerklasse) {
    case 1: tabelle = tabellen.steuerklasse_1; break;
    case 2: tabelle = tabellen.steuerklasse_2; break;
    case 3: tabelle = tabellen.steuerklasse_3; break;
    default: tabelle = tabellen.steuerklasse_3;
  }

  for (const stufe of tabelle) {
    if (steuerpflichtigerErwerb <= stufe.bis) {
      return stufe.satz;
    }
  }
  return tabelle[tabelle.length - 1].satz;
}

export function berechne(
  { erbschaftswert, verwandtschaft, alterKind, istErbschaft, bereitsEmpfangen }: ErbschaftsteuerParams,
  rates: typeof RATES = RATES
): ErbschaftsteuerResult {
  const steuerklasse = getSteuerklasse(verwandtschaft);
  const verwandtschaftText = getVerwandtschaftText(verwandtschaft);
  const persoenlichFreibetrag = getFreibetrag(verwandtschaft, rates);
  const versorgungsfreibetrag = getVersorgungsfreibetrag(verwandtschaft, alterKind, istErbschaft, rates);
  const gesamtFreibetrag = persoenlichFreibetrag + versorgungsfreibetrag;
  const verfuegbarerFreibetrag = Math.max(0, gesamtFreibetrag - bereitsEmpfangen);
  const steuerpflichtigerErwerb = Math.max(0, erbschaftswert - verfuegbarerFreibetrag);

  let steuersatzProzent = 0;
  let erbschaftsteuer = 0;

  if (steuerpflichtigerErwerb > 0) {
    steuersatzProzent = getSteuersatz(steuerpflichtigerErwerb, steuerklasse, rates);
    // Stufentarif: der Satz gilt auf den gesamten Betrag
    erbschaftsteuer = rund(steuerpflichtigerErwerb * steuersatzProzent / 100);
  }

  const nettowert = rund(erbschaftswert - erbschaftsteuer);
  const effektiverSatzProzent = erbschaftswert > 0
    ? rund((erbschaftsteuer / erbschaftswert) * 100)
    : 0;

  return {
    steuerklasse,
    verwandtschaftText,
    persoenlichFreibetrag,
    versorgungsfreibetrag,
    gesamtFreibetrag,
    verfuegbarerFreibetrag,
    steuerpflichtigerErwerb,
    steuersatzProzent,
    erbschaftsteuer,
    nettowert,
    effektiverSatzProzent,
  };
}
