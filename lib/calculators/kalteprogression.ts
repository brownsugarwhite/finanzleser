import { RATES } from "./rates";
import { rund } from "./utils";

export interface KalteprogressionParams {
  brutto_vorjahr: number;
  steigerung_prozent: number;
}

export interface KalteprogressionResult {
  brutto_vorjahr: number;
  brutto_nachher: number;
  steigerung_prozent: number;
  steigerung_absolut: number;
  kaufkraft_vergleich: number;
  kalte_progression_prozent: number;
  hinweis: string;
}

export function berechne(
  { brutto_vorjahr, steigerung_prozent }: KalteprogressionParams,
  rates: typeof RATES = RATES
): KalteprogressionResult {
  const brutto_nachher = brutto_vorjahr * (1 + steigerung_prozent / 100);
  const steigerung_absolut = brutto_nachher - brutto_vorjahr;

  // Vereinfachte Steuerberechnung (keine genaue EST)
  const est_satz_alt = 0.25; // Durchschnittlicher Steuersatz
  const est_satz_neu = 0.27; // Erhöht durch progressive Staffel

  const kaufkraft_vergleich =
    (brutto_nachher * (1 - est_satz_neu)) /
    (brutto_vorjahr * (1 - est_satz_alt));
  const kalte_progression_prozent = rund(
    (1 - kaufkraft_vergleich) * 100
  );

  const hinweis =
    kalte_progression_prozent > 0.5
      ? `Trotz ${steigerung_prozent}% Gehaltserhöhung sinkt die Kaufkraft real um ca. ${kalte_progression_prozent}%`
      : "Kalte Progression ist minimal";

  return {
    brutto_vorjahr,
    brutto_nachher: rund(brutto_nachher),
    steigerung_prozent,
    steigerung_absolut: rund(steigerung_absolut),
    kaufkraft_vergleich: rund(kaufkraft_vergleich * 100),
    kalte_progression_prozent,
    hinweis
  };
}
