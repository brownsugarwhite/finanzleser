import { RATES } from "./rates";
import { rund } from "./utils";

export interface PfaendungParams {
  nettoEntgelt: number;
  schuldenart: "unterhaltsschuld" | "forderung_allgemein";
}

export interface PfaendungResult {
  nettoEntgelt: number;
  schuldenart: string;
  pfaendungsfreier_betrag: number;
  insolvenzquote_prozent: number;
  pfaendbar: number;
  tatsaechliche_pfaendung: number;
  verbraucherinsolvenz: boolean;
}

export function berechne(
  { nettoEntgelt, schuldenart }: PfaendungParams,
  rates: typeof RATES = RATES
): PfaendungResult {
  // Pfändungsfreigrenzen from rates.json
  // §§ 850–883 ZPO
  const grundfreibetrag = rates.pfaendung.grundfreibetrag_monat;

  let pfaendungsfreier_betrag = grundfreibetrag;
  let insolvenzquote_prozent = 0;

  if (schuldenart === "unterhaltsschuld") {
    // Bei Unterhalt: 50 % des pfändbaren Betrags
    pfaendungsfreier_betrag = 0;
    insolvenzquote_prozent = 50;
  } else {
    // Allgemeine Forderungen: 50 % des über Grundfreibetrag hinausgehenden Betrags
    insolvenzquote_prozent = 50;
  }

  const pfaendbar = Math.max(0, nettoEntgelt - pfaendungsfreier_betrag);
  const tatsaechliche_pfaendung = rund(pfaendbar * (insolvenzquote_prozent / 100));
  const verbraucherinsolvenz = schuldenart === "forderung_allgemein";

  return {
    nettoEntgelt,
    schuldenart,
    pfaendungsfreier_betrag,
    insolvenzquote_prozent,
    pfaendbar: rund(pfaendbar),
    tatsaechliche_pfaendung,
    verbraucherinsolvenz
  };
}
