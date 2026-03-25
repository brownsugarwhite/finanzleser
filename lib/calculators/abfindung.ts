import { RATES } from "./rates";
import { rund } from "./utils";

export interface AbfindungParams {
  abfindungssumme: number; // Abfindung in €
  regelmaessiges_jahrseinkommen: number; // Durchschnittliches Jahreseinkommen vor Abfindung
}

export interface AbfindungResult {
  abfindungssumme: number;
  regelmaessiges_jahrseinkommen: number;
  zu_versteuerndes_einkommen: number;
  einkommensteuer: number;
  solidaritaetszuschlag: number;
  kirchensteuer: number;
  sozialversicherung: number;
  netto_abfindung: number;
}

// Vereinfachte Abfindungsbesteuerung mit Fünftelregelung (§34 EStG)
export function berechne({
  abfindungssumme,
  regelmaessiges_jahrseinkommen,
}: AbfindungParams, rates: typeof RATES = RATES): AbfindungResult {
  // Fünftelregelung: Steuerlast wird berechnet, als hätte man 1/5 der Abfindung verteilt
  // über 5 Jahre verteilt bekommen

  // Vereinfachte Berechnung
  const fünftel = abfindungssumme / 5;
  const einkommen_mit_fünftel = regelmaessiges_jahrseinkommen + fünftel;

  // Vereinfachte progressive Steuerberechnung
  let steuersatz = 0.25; // Durchschnittlicher Satz
  if (einkommen_mit_fünftel <= 20000) {
    steuersatz = 0.1;
  } else if (einkommen_mit_fünftel <= 50000) {
    steuersatz = 0.2;
  } else if (einkommen_mit_fünftel <= 100000) {
    steuersatz = 0.32;
  } else {
    steuersatz = 0.42;
  }

  // Steuern auf Fünftel anwenden und mit 5 multiplizieren
  const einkommensteuer = rund(fünftel * steuersatz * 5);

  // Solidaritätszuschlag: 5,5% der Einkommensteuer
  const solidaritaetszuschlag = rund(einkommensteuer * 0.055);

  // Vereinfachte Kirchensteuer: 9% der Einkommensteuer
  const kirchensteuer = rund(einkommensteuer * 0.09);

  // Sozialversicherung: ca. 21% für Kranken-, Pflege-, Renten-, Arbeitslosenversicherung
  const sozialversicherung = rund(abfindungssumme * 0.21);

  const gesamtabgaben = einkommensteuer + solidaritaetszuschlag + kirchensteuer + sozialversicherung;
  const netto_abfindung = rund(abfindungssumme - gesamtabgaben);

  return {
    abfindungssumme,
    regelmaessiges_jahrseinkommen,
    zu_versteuerndes_einkommen: rund(abfindungssumme),
    einkommensteuer,
    solidaritaetszuschlag,
    kirchensteuer,
    sozialversicherung,
    netto_abfindung,
  };
}
