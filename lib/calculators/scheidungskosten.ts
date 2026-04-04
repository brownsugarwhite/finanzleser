import { rund } from "./utils";

export interface ScheidungskostenParams {
  nettoeinkommenBeide: number;
  vermoegen: number;
  versorgungsausgleich: boolean;
}

export interface ScheidungskostenResult {
  verfahrenswert: number;
  gerichtskosten: number;
  anwaltskosten: number; // fuer 2 Anwaelte
  gesamtkosten: number;
}

/**
 * Vereinfachte GKG-Gebuehrentabelle (einfache Gebuehr)
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
  ];

  for (const [bis, gebuehr] of tabelle) {
    if (streitwert <= bis) return gebuehr;
  }
  return 1921 + Math.ceil((streitwert - 200000) / 30000) * 198;
}

export function berechne({
  nettoeinkommenBeide,
  vermoegen,
  versorgungsausgleich,
}: ScheidungskostenParams): ScheidungskostenResult {
  // Verfahrenswert = 3 x Nettoeinkommen + 5 % Vermoegen
  let verfahrenswert = nettoeinkommenBeide * 3 + vermoegen * 0.05;

  // Versorgungsausgleich: 10 % Aufschlag
  if (versorgungsausgleich) {
    verfahrenswert = verfahrenswert * 1.1;
  }

  verfahrenswert = Math.round(verfahrenswert);

  const einfacheGebuehr = gebuehrTabelle(verfahrenswert);

  // Gerichtskosten: 2-fache Gebuehr fuer Scheidung (GKG KV Nr. 1110)
  const gerichtskosten = rund(einfacheGebuehr * 2);

  // Anwaltskosten pro Anwalt: Verfahrensgebuehr (1,3) + Terminsgebuehr (1,2) + Post (20) + MwSt
  const verfahrensgebuehr = einfacheGebuehr * 1.3;
  const terminsgebuehr = einfacheGebuehr * 1.2;
  const anwaltNetto = verfahrensgebuehr + terminsgebuehr + 20;
  const anwaltBrutto = rund(anwaltNetto * 1.19);

  // 2 Anwaelte
  const anwaltskosten = rund(anwaltBrutto * 2);

  const gesamtkosten = rund(gerichtskosten + anwaltskosten);

  return {
    verfahrenswert,
    gerichtskosten,
    anwaltskosten,
    gesamtkosten,
  };
}
