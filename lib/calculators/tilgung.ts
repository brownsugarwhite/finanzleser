import { RATES } from "./rates";
import { rund } from "./utils";

export interface TilgungParams {
  darlehensbetrag: number;
  zinssatzPa: number;
  anfangstilgungPa: number;
  sondertilgungJahr: number;
}

export interface TilgungJahresplan {
  jahr: number;
  rateJahr: number;
  zinsen: number;
  tilgung: number;
  sondertilgung: number;
  restschuld: number;
}

export interface TilgungResult {
  monatsrate: number;
  laufzeitJahre: number;
  gesamtZinsen: number;
  gesamtTilgung: number;
  jahresplan: TilgungJahresplan[];
}

export function berechne(
  { darlehensbetrag, zinssatzPa, anfangstilgungPa, sondertilgungJahr }: TilgungParams,
  rates: typeof RATES = RATES
): TilgungResult {
  const monatsrate = rund(darlehensbetrag * (zinssatzPa + anfangstilgungPa) / 100 / 12);

  let restschuld = darlehensbetrag;
  let gesamtZinsen = 0;
  let gesamtTilgung = 0;
  const jahresplan: TilgungJahresplan[] = [];
  const zinsMonat = zinssatzPa / 12 / 100;
  const maxMonate = 600;

  let monat = 0;

  while (restschuld > 0.01 && monat < maxMonate) {
    let zinsenJahr = 0;
    let tilgungJahr = 0;
    let rateJahr = 0;

    for (let m = 0; m < 12 && restschuld > 0.01; m++) {
      monat++;
      const zinsen = restschuld * zinsMonat;
      const rate = Math.min(monatsrate, restschuld + zinsen);
      const tilgung = rate - zinsen;

      restschuld -= tilgung;
      zinsenJahr += zinsen;
      tilgungJahr += tilgung;
      rateJahr += rate;
    }

    // Sondertilgung am Jahresende
    let sondertilgung = 0;
    if (sondertilgungJahr > 0 && restschuld > 0.01) {
      sondertilgung = Math.min(sondertilgungJahr, restschuld);
      restschuld -= sondertilgung;
      tilgungJahr += sondertilgung;
    }

    gesamtZinsen += zinsenJahr;
    gesamtTilgung += tilgungJahr;

    jahresplan.push({
      jahr: jahresplan.length + 1,
      rateJahr: rund(rateJahr),
      zinsen: rund(zinsenJahr),
      tilgung: rund(tilgungJahr - sondertilgung),
      sondertilgung: rund(sondertilgung),
      restschuld: rund(Math.max(0, restschuld)),
    });
  }

  const laufzeitJahre = rund(monat / 12);

  return {
    monatsrate,
    laufzeitJahre,
    gesamtZinsen: rund(gesamtZinsen),
    gesamtTilgung: rund(gesamtTilgung),
    jahresplan,
  };
}
