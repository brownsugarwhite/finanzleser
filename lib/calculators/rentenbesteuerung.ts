import { RATES } from "./rates";
import { rund } from "./utils";

export interface RentenbesteuerungParams {
  rente_monatlich: number;
  sonstiges_einkommen: number;
  bundesland: string;
}

export interface RentenbesteuerungResult {
  rente_monatlich: number;
  rente_jaehrlich: number;
  sonstiges_einkommen: number;
  gesamteinkommen: number;
  besteuerungsanteil: number;
  zu_versteuerndes_einkommen: number;
  einkommensteuer_geschaetzt: number;
  effektiver_steuersatz: number;
}

export function berechne(
  {
    rente_monatlich,
    sonstiges_einkommen,
    bundesland
  }: RentenbesteuerungParams,
  rates: typeof RATES = RATES
): RentenbesteuerungResult {
  const rente_jaehrlich = rente_monatlich * 12;

  // Besteuerungsanteil from rates.json
  const besteuerungsanteil = rates.rentenbesteuerung.besteuerungsanteil_2026 / 100;
  const zu_versteuernde_rente = rund(rente_jaehrlich * besteuerungsanteil);

  const grundfreibetrag = rates.lohnsteuer.grundfreibetrag;
  const gesamteinkommen = zu_versteuernde_rente + sonstiges_einkommen;
  const zu_versteuerndes_einkommen = Math.max(
    0,
    gesamteinkommen - grundfreibetrag
  );

  // Vereinfachte Steuerberechnung
  let steuersatz = 0.19;
  if (zu_versteuerndes_einkommen > 50000) steuersatz = 0.25;
  if (zu_versteuerndes_einkommen > 100000) steuersatz = 0.35;

  const einkommensteuer_geschaetzt = rund(zu_versteuerndes_einkommen * steuersatz);
  const effektiver_steuersatz = gesamteinkommen > 0
    ? rund((einkommensteuer_geschaetzt / gesamteinkommen) * 100)
    : 0;

  return {
    rente_monatlich,
    rente_jaehrlich,
    sonstiges_einkommen,
    gesamteinkommen: rund(gesamteinkommen),
    besteuerungsanteil: rund(besteuerungsanteil * 100),
    zu_versteuerndes_einkommen: rund(zu_versteuerndes_einkommen),
    einkommensteuer_geschaetzt,
    effektiver_steuersatz
  };
}
