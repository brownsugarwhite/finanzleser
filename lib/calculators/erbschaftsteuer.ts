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
}: ErbschaftsteuerParams): ErbschaftsteuerResult {
  // Freibeträge nach Steuerklasse (2026)
  const freibetraege: Record<number, number> = {
    1: 400000, // Kinder
    2: 200000, // Enkel (bei verstorbenem Kind)
    3: 100000, // Großeltern
    4: 20000,  // Geschwister
    5: 20000,  // Sonstige
  };

  const freibetrag = freibetraege[verwandtschaftsgrad] || 0;
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

  // Vereinfachte Steuersätze nach Steuerklasse (I, II, III)
  let steuersatz = 0;

  if (verwandtschaftsgrad === 1) {
    // Steuerklasse I (Kinder) - progressiv
    if (steuerpflichtiger_betrag <= 75000) {
      steuersatz = 0.07;
    } else if (steuerpflichtiger_betrag <= 300000) {
      steuersatz = 0.11;
    } else if (steuerpflichtiger_betrag <= 600000) {
      steuersatz = 0.15;
    } else if (steuerpflichtiger_betrag <= 6000000) {
      steuersatz = 0.19;
    } else {
      steuersatz = 0.3;
    }
  } else if (verwandtschaftsgrad === 2) {
    // Steuerklasse I (Enkel)
    steuersatz = verwandtschaftsgrad === 2 ? 0.15 : 0.19;
  } else if (verwandtschaftsgrad === 3 || verwandtschaftsgrad === 4) {
    // Steuerklasse II
    steuersatz = 0.3;
  } else {
    // Steuerklasse III (Sonstige)
    steuersatz = 0.3;
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
