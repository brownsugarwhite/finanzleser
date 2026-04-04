import { rund } from "./utils";

export interface KfwStudienkreditParams {
  auszahlungMonat: number;
  auszahlungMonate: number;
  zinssatzPa: number;
  karenzMonate: number;
  tilgungMonate: number;
}

export interface KfwStudienkreditResult {
  gesamtAuszahlung: number;
  gesamtZinsen: number;
  monatsrate: number;
  gesamtRueckzahlung: number;
}

export function berechne({
  auszahlungMonat,
  auszahlungMonate,
  zinssatzPa,
  karenzMonate,
  tilgungMonate,
}: KfwStudienkreditParams): KfwStudienkreditResult {
  const monatsZins = zinssatzPa / 100 / 12;

  const gesamtAuszahlung = rund(auszahlungMonat * auszahlungMonate);

  // Zinsen waehrend Auszahlungsphase (auf laufend steigendes Kapital)
  let kapital = 0;
  let zinsenAuszahlung = 0;
  for (let m = 0; m < auszahlungMonate; m++) {
    kapital += auszahlungMonat;
    zinsenAuszahlung += kapital * monatsZins;
  }

  // Zinsen waehrend Karenzphase (Kapital bleibt, Zinsen laufen)
  const kapitalNachAuszahlung = kapital + zinsenAuszahlung;
  const zinsenKarenz = kapitalNachAuszahlung * monatsZins * karenzMonate;

  // Schuld zu Beginn der Tilgung
  const schuldBeiTilgung = kapitalNachAuszahlung + zinsenKarenz;

  // Annuitaetische Tilgung
  let monatsrate = 0;
  if (monatsZins > 0 && tilgungMonate > 0) {
    monatsrate = rund(
      (schuldBeiTilgung * monatsZins) /
        (1 - Math.pow(1 + monatsZins, -tilgungMonate))
    );
  } else if (tilgungMonate > 0) {
    monatsrate = rund(schuldBeiTilgung / tilgungMonate);
  }

  const gesamtRueckzahlung = rund(monatsrate * tilgungMonate);
  const gesamtZinsen = rund(gesamtRueckzahlung - gesamtAuszahlung);

  return {
    gesamtAuszahlung,
    gesamtZinsen,
    monatsrate,
    gesamtRueckzahlung,
  };
}
