import { RATES } from "./rates";
import { rund } from "./utils";

export interface KreditParams {
  kreditsumme: number;
  laufzeitMonate: number;
  jahreszins: number;
}

export interface KreditTilgungsplanRow {
  monat: number;
  zinsen: number;
  tilgung: number;
  restschuld: number;
}

export interface KreditJahrRow {
  jahr: number;
  zinsen: number;
  tilgung: number;
  restschuld: number;
}

export interface KreditResult {
  monatsrate: number;
  gesamtbetrag: number;
  gesamtzinsen: number;
  effektivzins: number;
  tilgungsplan: KreditTilgungsplanRow[];
  /**
   * Jahresaggregation für die Jahresübersicht des Kursblatts
   * („Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:337-341, Rechnung :442).
   * Das letzte Jahr ist angebrochen, wenn `laufzeitMonate % 12 !== 0`.
   * Summiert die GERUNDETEN Monatswerte, damit Jahres- und Monatstabelle übereinstimmen.
   */
  jahresplan: KreditJahrRow[];
  /**
   * Restschuld je Monat für die Kurve (K:318-335), Index 0 = Kreditsumme,
   * Länge laufzeitMonate + 1.
   * 🚨 UNGERUNDET. Die auf Cent gerundete Restschuld der Tabelle erzeugt in einer
   * 640 px breiten Kurve sichtbare Stufen.
   */
  verlauf: number[];
}

export function berechne(
  { kreditsumme, laufzeitMonate, jahreszins }: KreditParams,
  rates: typeof RATES = RATES
): KreditResult {
  const r = jahreszins / 100 / 12;

  let monatsrate: number;
  if (r === 0) {
    monatsrate = kreditsumme / laufzeitMonate;
  } else {
    monatsrate =
      (kreditsumme * (r * Math.pow(1 + r, laufzeitMonate))) /
      (Math.pow(1 + r, laufzeitMonate) - 1);
  }

  const gesamtbetrag = rund(monatsrate * laufzeitMonate);
  const gesamtzinsen = rund(gesamtbetrag - kreditsumme);
  const effektivzins = rund(jahreszins); // Vereinfacht: gleich Nominalzins

  // Tilgungsplan
  const tilgungsplan: KreditTilgungsplanRow[] = [];
  const jahresplan: KreditJahrRow[] = [];
  const verlauf: number[] = [kreditsumme];
  let restschuld = kreditsumme;
  let restGenau = kreditsumme;
  let jahrZinsen = 0;
  let jahrTilgung = 0;

  for (let monat = 1; monat <= laufzeitMonate; monat++) {
    const zinsen = rund(restschuld * r);
    const tilgung = rund(Math.min(monatsrate - zinsen, restschuld));
    restschuld = rund(Math.max(0, restschuld - tilgung));
    tilgungsplan.push({ monat, zinsen, tilgung, restschuld });

    // Zweite, ungerundete Spur allein für die Kurve.
    restGenau = Math.max(0, restGenau - (monatsrate - restGenau * r));
    verlauf.push(restGenau);

    jahrZinsen += zinsen;
    jahrTilgung += tilgung;
    if (monat % 12 === 0 || monat === laufzeitMonate) {
      jahresplan.push({
        jahr: Math.ceil(monat / 12),
        zinsen: rund(jahrZinsen),
        tilgung: rund(jahrTilgung),
        restschuld,
      });
      jahrZinsen = 0;
      jahrTilgung = 0;
    }
  }

  return {
    monatsrate: rund(monatsrate),
    gesamtbetrag,
    gesamtzinsen,
    effektivzins,
    tilgungsplan,
    jahresplan,
    verlauf,
  };
}
