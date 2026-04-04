import { RATES } from "./rates";
import { rund } from "./utils";

export interface GerichtskostenParams {
  streitwert: number;
  instanz: "ag_lg" | "olg" | "bgh";
}

export interface GerichtskostenResult {
  gerichtsgebuehr: number;
  anwaltsVerfahren: number;
  anwaltsTermin: number;
  anwaltsPostpauschale: number;
  anwaltsMwSt: number;
  anwaltsGesamt: number;
  gesamtKosten: number;
}

/**
 * Vereinfachte GKG/RVG-Gebuehrentabelle (Anlage 2)
 * Gibt die einfache Gebuehr fuer den Streitwert zurueck.
 */
function gebuehrTabelle(streitwert: number): number {
  const tabelle: [number, number][] = [
    [500, 38],
    [1000, 58],
    [1500, 78],
    [2000, 98],
    [3000, 119],
    [4000, 140],
    [5000, 161],
    [6000, 182],
    [7000, 203],
    [8000, 224],
    [9000, 245],
    [10000, 266],
    [13000, 295],
    [16000, 324],
    [19000, 353],
    [22000, 382],
    [25000, 411],
    [30000, 449],
    [35000, 487],
    [40000, 525],
    [45000, 563],
    [50000, 601],
    [65000, 733],
    [80000, 865],
    [95000, 997],
    [110000, 1129],
    [125000, 1261],
    [140000, 1393],
    [155000, 1525],
    [170000, 1657],
    [185000, 1789],
    [200000, 1921],
    [230000, 2119],
    [260000, 2317],
    [290000, 2515],
    [320000, 2713],
    [350000, 2911],
    [380000, 3109],
    [410000, 3307],
    [440000, 3505],
    [470000, 3703],
    [500000, 3901],
  ];

  for (const [bis, gebuehr] of tabelle) {
    if (streitwert <= bis) return gebuehr;
  }
  // Ueber 500.000: letzte Stufe + 198 je 30.000
  const ueber = streitwert - 500000;
  const zusatzStufen = Math.ceil(ueber / 30000);
  return 3901 + zusatzStufen * 198;
}

export function berechne(
  { streitwert, instanz }: GerichtskostenParams,
  rates = RATES
): GerichtskostenResult {
  const r = rates.gerichtskosten;

  const einfacheGebuehr = gebuehrTabelle(streitwert);

  // Gerichtsfaktor je Instanz
  let gerichtFaktor: number;
  switch (instanz) {
    case "olg":
      gerichtFaktor = r.gericht_faktor_olg;
      break;
    case "bgh":
      gerichtFaktor = r.gericht_faktor_bgh;
      break;
    default:
      gerichtFaktor = r.gericht_faktor_ag_lg;
  }

  const gerichtsgebuehr = rund(einfacheGebuehr * gerichtFaktor);

  // Anwaltskosten (ein Anwalt) nach RVG
  const anwaltsVerfahren = rund(einfacheGebuehr * r.rvg_verfahrensgebuehr_faktor);
  const anwaltsTermin = rund(einfacheGebuehr * r.rvg_terminsgebuehr_faktor);
  const anwaltsPostpauschale = r.rvg_postpauschale;
  const anwaltsNetto = anwaltsVerfahren + anwaltsTermin + anwaltsPostpauschale;
  const anwaltsMwSt = rund(anwaltsNetto * (r.mwst_prozent / 100));
  const anwaltsGesamt = rund(anwaltsNetto + anwaltsMwSt);

  const gesamtKosten = rund(gerichtsgebuehr + anwaltsGesamt);

  return {
    gerichtsgebuehr,
    anwaltsVerfahren,
    anwaltsTermin,
    anwaltsPostpauschale,
    anwaltsMwSt,
    anwaltsGesamt,
    gesamtKosten,
  };
}
