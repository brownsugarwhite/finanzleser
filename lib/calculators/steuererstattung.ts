import { RATES } from "./rates";
import { rund } from "./utils";

export interface StuerundererstattungParams {
  jahresbrutto: number;
  steuervorauszahlung: number;
  steuerklasse: number;
}

export interface StuerundererstattungResult {
  jahresbrutto: number;
  steuervorauszahlung: number;
  steuerklasse: number;
  ungefaehre_jahressteuer: number;
  steuererstattung: number;
  hinweis: string;
}

export function berechne(
  {
    jahresbrutto,
    steuervorauszahlung,
    steuerklasse
  }: StuerundererstattungParams,
  rates: typeof RATES = RATES
): StuerundererstattungResult {
  // Vereinfachte Steuerberechnung (Steuerklasse 1) from rates.json
  const grundfreibetrag = rates.lohnsteuer.grundfreibetrag;
  const zvE = Math.max(0, jahresbrutto - grundfreibetrag - 1000); // 1000 € Sonderausgaben

  // Durchschnittlicher Steuersatz bei verschiedenen Klassen
  let steuersatz = 0.19;
  if (steuerklasse === 3) steuersatz = 0.15; // günstiger
  else if (steuerklasse === 5) steuersatz = 0.25; // ungünstiger
  else if (steuerklasse === 6) steuersatz = 0.28; // sehr ungünstiger

  const ungefaehre_jahressteuer = rund(zvE * steuersatz);
  const steuererstattung = Math.max(
    0,
    steuervorauszahlung - ungefaehre_jahressteuer
  );

  const hinweis =
    steuererstattung > 100
      ? "Steuererklärung könnte sich lohnen"
      : "Keine oder geringfügige Erstattung";

  return {
    jahresbrutto,
    steuervorauszahlung,
    steuerklasse,
    ungefaehre_jahressteuer,
    steuererstattung: rund(steuererstattung),
    hinweis
  };
}
