import { RATES } from "./rates";
import { rund } from "./utils";

export interface AnnuitaetParams {
  darlehensbetrag: number;
  zinssatzPa: number;
  laufzeitJahre: number;
}

export interface AnnuitaetJahresplan {
  jahr: number;
  rateJahr: number;
  zinsen: number;
  tilgung: number;
  restschuld: number;
}

export interface AnnuitaetResult {
  monatsrate: number;
  gesamtZinsen: number;
  gesamtRueckzahlung: number;
  effektivZins: number;
  jahresplan: AnnuitaetJahresplan[];
}

export function berechne(
  { darlehensbetrag, zinssatzPa, laufzeitJahre }: AnnuitaetParams,
  rates: typeof RATES = RATES
): AnnuitaetResult {
  const z = zinssatzPa / 12 / 100;
  const n = laufzeitJahre * 12;

  let monatsrate: number;
  if (z === 0) {
    monatsrate = darlehensbetrag / n;
  } else {
    monatsrate = darlehensbetrag * (z * Math.pow(1 + z, n)) / (Math.pow(1 + z, n) - 1);
  }

  const gesamtRueckzahlung = monatsrate * n;
  const gesamtZinsen = gesamtRueckzahlung - darlehensbetrag;

  // Effektivzins (bei monatlicher Zahlung gleich Nominalzins)
  const effektivZins = rund(zinssatzPa);

  // Jahresplan
  const jahresplan: AnnuitaetJahresplan[] = [];
  let restschuld = darlehensbetrag;

  for (let jahr = 1; jahr <= laufzeitJahre; jahr++) {
    let zinsenJahr = 0;
    let tilgungJahr = 0;
    let rateJahr = 0;

    for (let m = 0; m < 12 && restschuld > 0.01; m++) {
      const zinsen = restschuld * z;
      const rate = Math.min(monatsrate, restschuld + zinsen);
      const tilgung = rate - zinsen;
      restschuld -= tilgung;
      zinsenJahr += zinsen;
      tilgungJahr += tilgung;
      rateJahr += rate;
    }

    jahresplan.push({
      jahr,
      rateJahr: rund(rateJahr),
      zinsen: rund(zinsenJahr),
      tilgung: rund(tilgungJahr),
      restschuld: rund(Math.max(0, restschuld)),
    });
  }

  return {
    monatsrate: rund(monatsrate),
    gesamtZinsen: rund(gesamtZinsen),
    gesamtRueckzahlung: rund(gesamtRueckzahlung),
    effektivZins,
    jahresplan,
  };
}
