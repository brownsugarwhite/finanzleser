import { RATES } from "./rates";
import { rund } from "./utils";

export interface BuergergeldelParams {
  haushaltstyp: "allein" | "paar" | "allein_elternteil" | "paar_eltern";
  kinder: {
    k0_5?: number;
    k6_13?: number;
    k14_17?: number;
  };
  warmmiete: number;
  anrechenbares_einkommen?: number;
}

export interface BuergergeldelResult {
  regelbedarf: number;
  kinderBedarf: number;
  warmmiete: number;
  gesamtBedarf: number;
  einkommenBrutto: number;
  einkommenFreibetrag: number;
  einkommenAnrechenbar: number;
  buergergeld: number;
}

export function berechne(
  {
    haushaltstyp,
    kinder,
    warmmiete,
    anrechenbares_einkommen = 0
  }: BuergergeldelParams,
  rates: typeof RATES = RATES
): BuergergeldelResult {
  const regelbedarfe = {
    stufe1: rates.buergergeld.regelbedarfe_2026.stufe1_alleinstehende, // Alleinstehende / Alleinerziehende
    stufe2: rates.buergergeld.regelbedarfe_2026.stufe2_paare_je_partner, // Paare je Partner
    stufe4: rates.buergergeld.regelbedarfe_2026.stufe4_jugendliche_14_17, // Jugendliche 14–17 Jahre
    stufe5: rates.buergergeld.regelbedarfe_2026.stufe5_kinder_6_13, // Kinder 6–13 Jahre
    stufe6: rates.buergergeld.regelbedarfe_2026.stufe6_kinder_0_5  // Kinder 0–5 Jahre
  };

  let bedarf = 0;

  if (haushaltstyp === "allein") {
    bedarf = regelbedarfe.stufe1;
  } else if (haushaltstyp === "paar") {
    bedarf = regelbedarfe.stufe2 * 2;
  } else if (haushaltstyp === "allein_elternteil") {
    bedarf = regelbedarfe.stufe1;
  } else if (haushaltstyp === "paar_eltern") {
    bedarf = regelbedarfe.stufe2 * 2;
  }

  let kinderBedarf = 0;
  kinderBedarf += (kinder.k0_5 || 0) * regelbedarfe.stufe6;
  kinderBedarf += (kinder.k6_13 || 0) * regelbedarfe.stufe5;
  kinderBedarf += (kinder.k14_17 || 0) * regelbedarfe.stufe4;
  const gesamtBedarf = bedarf + kinderBedarf + warmmiete;

  // Freibetrag auf Erwerbseinkommen
  const grundfreibetrag = rates.buergergeld.freibetraege.grundfreibetrag;
  const freibetrag_prozent_100_1000 = rates.buergergeld.freibetraege.freibetrag_prozent_100_1000 / 100;
  const freibetrag_prozent_1000_1200 = rates.buergergeld.freibetraege.freibetrag_prozent_1000_1200 / 100;

  let einkommenFreibetrag = 0;
  if (anrechenbares_einkommen > grundfreibetrag) {
    einkommenFreibetrag += Math.min(anrechenbares_einkommen - grundfreibetrag, 900) * freibetrag_prozent_100_1000;
  }
  if (anrechenbares_einkommen > 1000) {
    einkommenFreibetrag += Math.min(anrechenbares_einkommen - 1000, 200) * freibetrag_prozent_1000_1200;
  }
  const einkommenAnrechenbar = Math.max(
    0,
    anrechenbares_einkommen - grundfreibetrag - einkommenFreibetrag
  );

  const buergergeld = Math.max(0, gesamtBedarf - einkommenAnrechenbar);

  return {
    regelbedarf: bedarf,
    kinderBedarf,
    warmmiete,
    gesamtBedarf,
    einkommenBrutto: anrechenbares_einkommen,
    einkommenFreibetrag: rund(
      einkommenFreibetrag + Math.min(anrechenbares_einkommen, grundfreibetrag)
    ),
    einkommenAnrechenbar: rund(einkommenAnrechenbar),
    buergergeld: rund(buergergeld)
  };
}
