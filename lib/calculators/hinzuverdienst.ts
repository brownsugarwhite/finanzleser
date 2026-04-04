/**
 * Hinzuverdienstrechner 2026
 * Berechnet die Kuerzung der Rente bei Hinzuverdienst
 * vor und nach Erreichen der Regelaltersgrenze.
 * Alle Werte aus RATES.
 */

import { RATES } from "./rates";
import { rund } from "./utils";

type RatesType = typeof RATES;

export interface HinzuverdienstParams {
  monatlicheRente: number;
  monatlichesEinkommen: number;
  istVorzeitigeRente: boolean;
}

export interface HinzuverdienstResult {
  hinzuverdienstGrenze: number;
  kuerzungsBetrag: number;
  verbleibendeRente: number;
  gesamtEinkommen: number;
}

export function berechne(
  params: HinzuverdienstParams,
  rates: RatesType = RATES
): HinzuverdienstResult {
  const { monatlicheRente, monatlichesEinkommen, istVorzeitigeRente } = params;

  // Bei Regelaltersrente: unbegrenzt hinzuverdienen
  // Bei vorzeitiger Rente: Jahresgrenze (50.700 EUR / Jahr -> monatlich)
  const hinzuverdienstGrenzeJahr = rates.hinzuverdienst.hinzuverdienst_grenze_vorzeitig_jahr;
  const hinzuverdienstGrenzeMonat = rund(hinzuverdienstGrenzeJahr / 12);
  const kuerzungProzent = rates.hinzuverdienst.kuerzung_prozent;

  let kuerzungsBetrag = 0;

  if (istVorzeitigeRente && monatlichesEinkommen > hinzuverdienstGrenzeMonat) {
    // 40% des uebersteigenden Betrags wird von der Rente abgezogen
    const ueberstieg = monatlichesEinkommen - hinzuverdienstGrenzeMonat;
    kuerzungsBetrag = rund(ueberstieg * kuerzungProzent / 100);
    kuerzungsBetrag = Math.min(kuerzungsBetrag, monatlicheRente); // max. Rente wird auf 0 gekuerzt
  }

  const verbleibendeRente = rund(monatlicheRente - kuerzungsBetrag);
  const gesamtEinkommen = rund(verbleibendeRente + monatlichesEinkommen);

  const hinzuverdienstGrenze = istVorzeitigeRente ? hinzuverdienstGrenzeMonat : 0; // 0 = unbegrenzt

  return {
    hinzuverdienstGrenze,
    kuerzungsBetrag,
    verbleibendeRente,
    gesamtEinkommen,
  };
}
