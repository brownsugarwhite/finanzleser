/**
 * Rentenbeginnrechner 2026
 * Berechnet Regelaltersgrenze, fruehesten Rentenbeginn und Abschlaege
 * basierend auf Geburtsjahr, Schwerbehinderung und langjähriger Versicherung.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface RentenbeginnParams {
  geburtsjahr: number;
  schwerbehinderung: boolean;
  langjVersichert: boolean; // 45+ Beitragsjahre
}

export interface RentenbeginnResult {
  regelaltersgrenze: { jahre: number; monate: number };
  fruehesterRentenbeginn: { jahre: number; monate: number };
  abschlagMonate: number;
  abschlagProzent: number;
}

/**
 * Regelaltersgrenze nach Geburtsjahr (stufenweise Anhebung)
 * Ab Jahrgang 1964: 67 Jahre, 0 Monate
 */
function getRegelaltersgrenze(geburtsjahr: number, rates: RatesType): { jahre: number; monate: number } {
  if (geburtsjahr >= 1964) {
    return { jahre: rates.rente.regelaltersgrenze_ab_jahrgang_1964, monate: 0 };
  }

  // Stufenweise Anhebung von 65 auf 67 (Jahrgang 1947-1963)
  const stufen: Record<number, { jahre: number; monate: number }> = {
    1947: { jahre: 65, monate: 1 },
    1948: { jahre: 65, monate: 2 },
    1949: { jahre: 65, monate: 3 },
    1950: { jahre: 65, monate: 4 },
    1951: { jahre: 65, monate: 5 },
    1952: { jahre: 65, monate: 6 },
    1953: { jahre: 65, monate: 7 },
    1954: { jahre: 65, monate: 8 },
    1955: { jahre: 65, monate: 9 },
    1956: { jahre: 65, monate: 10 },
    1957: { jahre: 65, monate: 11 },
    1958: { jahre: 66, monate: 0 },
    1959: { jahre: 66, monate: 2 },
    1960: { jahre: 66, monate: 4 },
    1961: { jahre: 66, monate: 6 },
    1962: { jahre: 66, monate: 8 },
    1963: { jahre: 66, monate: 10 },
  };

  return stufen[geburtsjahr] ?? { jahre: 65, monate: 0 };
}

/**
 * Fruehester Rentenbeginn:
 * - Regelaltersrente: Regelaltersgrenze
 * - Schwerbehinderung: RAG - 5 Jahre (mit Abschlag: RAG - 8 Jahre)
 * - Langjährig Versichert (45+ J): 65 Jahre (abschlagsfrei, bzw. 63 ab 1964)
 * - Besonders langjährig Versichert (45+ J, ab 1964): 65 Jahre abschlagsfrei
 * - Normaler Frührentner: 63 Jahre (mit Abschlag)
 */
function getFruehesterBeginn(
  geburtsjahr: number,
  rag: { jahre: number; monate: number },
  schwerbehinderung: boolean,
  langjVersichert: boolean
): { jahre: number; monate: number } {
  if (langjVersichert) {
    // Besonders langjährig Versicherte (45+ Jahre): abschlagsfrei ab 65
    // Für Jahrgänge ab 1964: 65 Jahre, 0 Monate
    if (geburtsjahr >= 1964) return { jahre: 65, monate: 0 };
    // Stufenweise Anhebung von 63 auf 65
    if (geburtsjahr <= 1952) return { jahre: 63, monate: 0 };
    const extra = geburtsjahr - 1952;
    return { jahre: 63 + Math.floor(extra * 2 / 12), monate: (extra * 2) % 12 };
  }

  if (schwerbehinderung) {
    // 5 Jahre vor Regelaltersgrenze (mit Abschlag bis zu 3 weitere Jahre)
    let jahre = rag.jahre - 5;
    let monate = rag.monate;
    if (monate < 0) { jahre -= 1; monate += 12; }
    return { jahre, monate };
  }

  // Normaler Frührentner: ab 63 Jahre (mit Abschlag)
  return { jahre: 63, monate: 0 };
}

export function berechne(
  params: RentenbeginnParams,
  rates: RatesType = RATES
): RentenbeginnResult {
  const { geburtsjahr, schwerbehinderung, langjVersichert } = params;

  const rag = getRegelaltersgrenze(geburtsjahr, rates);
  const frueh = getFruehesterBeginn(geburtsjahr, rag, schwerbehinderung, langjVersichert);

  // Abschlag in Monaten: Differenz zwischen RAG und fruehestem Beginn
  const ragMonate = rag.jahre * 12 + rag.monate;
  const fruehMonate = frueh.jahre * 12 + frueh.monate;
  const abschlagMonate = Math.max(0, ragMonate - fruehMonate);

  // Abschlag-Prozent (0,3% pro Monat, max 14,4%)
  const abschlagProMonat = rates.rentenabschlag.abschlag_pro_monat_prozent;
  const maxAbschlag = rates.rentenabschlag.max_abschlag_prozent;

  // Langjährig Versicherte haben keinen Abschlag
  const abschlagProzent = langjVersichert
    ? 0
    : rund(Math.min(abschlagMonate * abschlagProMonat, maxAbschlag));

  return {
    regelaltersgrenze: rag,
    fruehesterRentenbeginn: frueh,
    abschlagMonate: langjVersichert ? 0 : abschlagMonate,
    abschlagProzent,
  };
}
