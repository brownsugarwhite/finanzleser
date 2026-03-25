import { RATES } from "./rates";
import { rund } from "./utils";

export interface AltersteilzeitParams {
  vollzeit_brutto: number;
  aufstockung_prozent: number;
  modus: "block" | "gleichmaessig";
}

export interface AltersteilzeitResult {
  vollzeit_brutto: number;
  atz_brutto: number;
  vollzeit_netto: number;
  atz_netto_basis: number;
  aufstockung_prozent: number;
  aufstockungsbetrag: number;
  gesamt_netto: number;
  netto_verlust: number;
  rv_aufstockung_ag: number;
  modus: string;
  teilzeit_anteil_prozent: number;
}

export function berechne(
  {
    vollzeit_brutto,
    aufstockung_prozent,
    modus
  }: AltersteilzeitParams,
  rates: typeof RATES = RATES
): AltersteilzeitResult {
  const sv_pauschale_an = 0.20725;
  const teilzeit_anteil = 0.5;

  // Halbierung der Arbeitszeit / des Gehalts
  const atz_brutto = vollzeit_brutto * teilzeit_anteil;

  // Netto-Schätzung (ohne individuelle Lohnsteuer)
  const vollzeit_netto = vollzeit_brutto * (1 - sv_pauschale_an);
  const atz_netto_basis = atz_brutto * (1 - sv_pauschale_an);

  // Aufstockung (auf Basis des Vollzeit-Nettos)
  const aufstockung_faktor = aufstockung_prozent / 100;
  const ziel_netto = vollzeit_netto * aufstockung_faktor;
  const aufstockungsbetrag = Math.max(0, ziel_netto - atz_netto_basis);

  // Gesamtnetto mit Aufstockung
  const gesamt_netto = atz_netto_basis + aufstockungsbetrag;

  // Netto-Verlust gegenüber Vollzeit
  const netto_verlust = vollzeit_netto - gesamt_netto;

  // RV-Aufstockung: AG zahlt zusätzlich RV auf fiktives Vollzeitgehalt
  const rv_aufstockung_ag = vollzeit_brutto * 0.186 - atz_brutto * 0.186;

  return {
    vollzeit_brutto,
    atz_brutto: rund(atz_brutto),
    vollzeit_netto: rund(vollzeit_netto),
    atz_netto_basis: rund(atz_netto_basis),
    aufstockung_prozent,
    aufstockungsbetrag: rund(aufstockungsbetrag),
    gesamt_netto: rund(gesamt_netto),
    netto_verlust: rund(netto_verlust),
    rv_aufstockung_ag: rund(rv_aufstockung_ag),
    modus,
    teilzeit_anteil_prozent: 50
  };
}
