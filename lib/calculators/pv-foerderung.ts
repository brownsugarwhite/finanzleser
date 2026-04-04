import { rund } from "./utils";

export interface PvFoerderungParams {
  anlagenLeistungKwp: number;
  eigenverbrauchProzent: number;
  strompreisCtKwh: number;
  einspeiseverguetungCtKwh: number;
}

export interface PvFoerderungResult {
  jahresertrag: number; // kWh
  eigenverbrauchErsparnis: number; // EUR/Jahr
  einspeiseverguetung: number; // EUR/Jahr
  gesamtertragJahr: number; // EUR/Jahr
}

export function berechne({
  anlagenLeistungKwp,
  eigenverbrauchProzent,
  strompreisCtKwh,
  einspeiseverguetungCtKwh,
}: PvFoerderungParams): PvFoerderungResult {
  // Durchschnittlicher Ertrag in Deutschland: ca. 950 kWh pro kWp
  const ertragJeKwp = 950;
  const jahresertrag = Math.round(anlagenLeistungKwp * ertragJeKwp);

  const eigenverbrauchAnteil = eigenverbrauchProzent / 100;
  const eigenverbrauchKwh = jahresertrag * eigenverbrauchAnteil;
  const einspeisungKwh = jahresertrag * (1 - eigenverbrauchAnteil);

  // Eigenverbrauch spart Strombezugskosten
  const eigenverbrauchErsparnis = rund(
    (eigenverbrauchKwh * strompreisCtKwh) / 100
  );

  // Einspeisung bringt Verguetung
  const einspeiseverguetung = rund(
    (einspeisungKwh * einspeiseverguetungCtKwh) / 100
  );

  const gesamtertragJahr = rund(eigenverbrauchErsparnis + einspeiseverguetung);

  return {
    jahresertrag,
    eigenverbrauchErsparnis,
    einspeiseverguetung,
    gesamtertragJahr,
  };
}
