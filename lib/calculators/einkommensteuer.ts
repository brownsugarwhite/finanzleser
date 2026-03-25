import { rund } from "./utils";

export interface EinkommensteuerParams {
  einkommen: number; // Zu versteuerndes Einkommen in €
  steuerklasse: number; // 1-6
  bundesland: string; // für Kirchensteuer
}

export interface EinkommensteuerResult {
  einkommen: number;
  lohnsteuer: number;
  solidaritaetszuschlag: number;
  kirchensteuer: number;
  gesamtsteuer: number;
  nettoEinkommen: number;
}

// Simplified §32a EStG 2026 for additional income
export function berechne({
  einkommen,
  bundesland,
}: EinkommensteuerParams): EinkommensteuerResult {
  if (einkommen <= 0) {
    return {
      einkommen,
      lohnsteuer: 0,
      solidaritaetszuschlag: 0,
      kirchensteuer: 0,
      gesamtsteuer: 0,
      nettoEinkommen: einkommen,
    };
  }

  // Simplified progressive tax calculation (§32a EStG)
  let lohnsteuer = 0;

  if (einkommen <= 11600) {
    // Tax-free allowance equivalent
    lohnsteuer = 0;
  } else if (einkommen <= 17005) {
    // Zone 1: Linear increase from 0% to 24%
    lohnsteuer = ((einkommen - 11600) * 0.14) / 100;
  } else if (einkommen <= 66260) {
    // Zone 2: Progressive from 24% to 42%
    const y = (einkommen - 17005) / 100;
    lohnsteuer = ((929.73 * y + 1400) * y + 972) / 100;
  } else if (einkommen <= 277825) {
    // Zone 3: Fixed 42% with solarity compensation
    lohnsteuer = einkommen * 0.42 - 9136.63;
  } else {
    // Zone 4: 45% top rate
    lohnsteuer = einkommen * 0.45 - 17374.99;
  }

  lohnsteuer = Math.max(0, rund(lohnsteuer));

  // Solidaritätszuschlag: 5.5% of Lohnsteuer
  const solidaritaetszuschlag = rund(lohnsteuer * 0.055);

  // Kirchensteuer (8% or 9% depending on Bundesland)
  const satz8Bundeslaender = [
    "Baden-Württemberg",
    "Bayern",
    "Bremen",
    "Hessen",
    "Hannover",
    "Mecklenburg-Vorpommern",
    "Niedersachsen",
    "Schleswig-Holstein",
    "Thüringen",
  ];
  const kirchensteuersatz = satz8Bundeslaender.includes(bundesland) ? 0.08 : 0.09;
  const kirchensteuer = rund(lohnsteuer * kirchensteuersatz);

  const gesamtsteuer = lohnsteuer + solidaritaetszuschlag + kirchensteuer;
  const nettoEinkommen = einkommen - gesamtsteuer;

  return {
    einkommen: rund(einkommen),
    lohnsteuer,
    solidaritaetszuschlag,
    kirchensteuer,
    gesamtsteuer: rund(gesamtsteuer),
    nettoEinkommen: rund(nettoEinkommen),
  };
}
