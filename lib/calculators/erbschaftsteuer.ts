import { RATES } from "./rates";
import { rund } from "./utils";

export interface ErbschaftsteuerParams {
  erbschaft: number; // Erbsumme in €
  verwandtschaftsgrad: number; // 1 = Kind, 2 = Enkel, 3 = Großeltern, 4 = Geschwister, 5 = Sonstige
}

export interface ErbschaftsteuerResult {
  erbschaft: number;
  freibetrag: number;
  steuerpflichtiger_betrag: number;
  steuersatz: number;
  erbschaftsteuer: number;
  nettoErbschaft: number;
}

// Vereinfachte Erbschaftsteuerberechnung 2026
export function berechne({
  erbschaft,
  verwandtschaftsgrad,
}: ErbschaftsteuerParams, rates: typeof RATES = RATES): ErbschaftsteuerResult {
  // Freibeträge nach Steuerklasse (2026) from rates.json
  const freibetraege_map: Record<number, keyof typeof rates.erbschaftsteuer.freibetraege> = {
    1: "kinder_stiefkinder",
    2: "enkel_elternteil_vorverstorben",
    3: "eltern_grosseltern_erbschaft",
    4: "steuerklasse_2",
    5: "steuerklasse_3",
  };
  const freibetrag = rates.erbschaftsteuer.freibetraege[freibetraege_map[verwandtschaftsgrad]] || 0;
  const steuerpflichtiger_betrag = Math.max(0, erbschaft - freibetrag);

  if (steuerpflichtiger_betrag === 0) {
    return {
      erbschaft,
      freibetrag,
      steuerpflichtiger_betrag: 0,
      steuersatz: 0,
      erbschaftsteuer: 0,
      nettoErbschaft: erbschaft,
    };
  }

  // Steuersätze nach Steuerklasse from rates.json
  let steuersatz = 0;

  if (verwandtschaftsgrad === 1) {
    // Steuerklasse I (Kinder)
    const tabelle = rates.erbschaftsteuer.steuersaetze_prozent.steuerklasse_1;
    for (const stufe of tabelle) {
      if (steuerpflichtiger_betrag <= stufe.bis) {
        steuersatz = stufe.satz / 100;
        break;
      }
    }
    if (steuersatz === 0) steuersatz = tabelle[tabelle.length - 1].satz / 100;
  } else if (verwandtschaftsgrad === 2) {
    // Steuerklasse I (Enkel)
    const tabelle = rates.erbschaftsteuer.steuersaetze_prozent.steuerklasse_1;
    for (const stufe of tabelle) {
      if (steuerpflichtiger_betrag <= stufe.bis) {
        steuersatz = stufe.satz / 100;
        break;
      }
    }
    if (steuersatz === 0) steuersatz = tabelle[tabelle.length - 1].satz / 100;
  } else if (verwandtschaftsgrad === 3) {
    // Steuerklasse II
    const tabelle = rates.erbschaftsteuer.steuersaetze_prozent.steuerklasse_2;
    for (const stufe of tabelle) {
      if (steuerpflichtiger_betrag <= stufe.bis) {
        steuersatz = stufe.satz / 100;
        break;
      }
    }
    if (steuersatz === 0) steuersatz = tabelle[tabelle.length - 1].satz / 100;
  } else {
    // Steuerklasse III (Sonstige und Geschwister)
    const tabelle = rates.erbschaftsteuer.steuersaetze_prozent.steuerklasse_3;
    for (const stufe of tabelle) {
      if (steuerpflichtiger_betrag <= stufe.bis) {
        steuersatz = stufe.satz / 100;
        break;
      }
    }
    if (steuersatz === 0) steuersatz = tabelle[tabelle.length - 1].satz / 100;
  }

  const erbschaftsteuer = rund(steuerpflichtiger_betrag * steuersatz);
  const nettoErbschaft = erbschaft - erbschaftsteuer;

  return {
    erbschaft,
    freibetrag,
    steuerpflichtiger_betrag,
    steuersatz: rund(steuersatz * 100) / 100,
    erbschaftsteuer,
    nettoErbschaft: rund(nettoErbschaft),
  };
}
