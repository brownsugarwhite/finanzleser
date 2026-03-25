import { RATES } from "./rates";
import { rund } from "./utils";

export interface GrundsicherungParams {
  alterstyp: "under65" | "ueber65" | "erwerbsunfaehig";
  haushaltstyp: "allein" | "paar";
  miete: number;
  vermogen: number;
  einkommen: number;
}

export interface GrundsicherungResult {
  alterstyp: string;
  regelbedarf: number;
  miete: number;
  gesamtbedarf: number;
  vermogen: number;
  vermogensfreibetrag: number;
  einkommen: number;
  grundsicherung: number;
}

export function berechne(
  {
    alterstyp,
    haushaltstyp,
    miete,
    vermogen,
    einkommen
  }: GrundsicherungParams,
  rates: typeof RATES = RATES
): GrundsicherungResult {
  // Regelbedarfsstufen (2026) from rates.json
  const stufe1 = rates.grundsicherung.regelbedarfe_2026.stufe1_alleinstehende;
  const stufe2 = rates.grundsicherung.regelbedarfe_2026.stufe2_paare_je_partner;

  const regelbedarf = haushaltstyp === "paar"
    ? stufe2 * 2
    : stufe1;

  // Vermögensfreibetrag (§ 12 SGB XII)
  let vermogensfreibetrag = 5000;
  if (alterstyp === "ueber65") vermogensfreibetrag = 8100;

  const gesamtbedarf = regelbedarf + miete;
  const vermogen_anrechenbar = Math.max(0, vermogen - vermogensfreibetrag);
  const monatlicher_vermogensabbau = rund(vermogen_anrechenbar / 120); // Über 10 Jahre

  const einkommen_anrechenbar = Math.max(0, einkommen - 100); // 100 € Freibetrag
  const grundsicherung = Math.max(
    0,
    gesamtbedarf - einkommen_anrechenbar - monatlicher_vermogensabbau
  );

  return {
    alterstyp,
    regelbedarf: rund(regelbedarf),
    miete,
    gesamtbedarf: rund(gesamtbedarf),
    vermogen,
    vermogensfreibetrag,
    einkommen,
    grundsicherung: rund(grundsicherung)
  };
}
