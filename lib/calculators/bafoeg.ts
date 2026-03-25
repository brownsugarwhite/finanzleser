import { RATES } from "./rates";
import { rund } from "./utils";

export interface BafoegParams {
  wohnform: "eltern" | "extern";
  eigenes_einkommen: number;
  eltern_einkommen: number;
  eltern_alleinstehend: boolean;
  geschwister_in_ausbildung: number;
  krankenversicherung: "gesetzlich" | "privat" | "keine";
}

export interface BafoegResult {
  wohnform: string;
  bedarf: number;
  eigenes_einkommen: number;
  eigenes_anrechenbar: number;
  eltern_einkommen: number;
  freibetrag_gesamt: number;
  eltern_anrechenbar: number;
  gesamt_anrechenbar: number;
  bafoeg: number;
  zuschuss: number;
  darlehen: number;
  hat_anspruch: boolean;
}

export function berechne(
  {
    wohnform,
    eigenes_einkommen,
    eltern_einkommen,
    eltern_alleinstehend,
    geschwister_in_ausbildung,
    krankenversicherung
  }: BafoegParams,
  rates: typeof RATES = RATES
): BafoegResult {
  // Bedarfssätze from rates.json
  const regelbedarfe = {
    grundbedarf_eltern: rates.bafoeg.bedarfssaetze.elternwohnung,
    grundbedarf_extern: rates.bafoeg.bedarfssaetze.extern_grundbetrag,
    zuschlag_unterkunft: rates.bafoeg.bedarfssaetze.extern_unterkunft,
    krankenversicherung: rates.bafoeg.bedarfssaetze.kv_zuschlag,
    pflegeversicherung: rates.bafoeg.bedarfssaetze.pv_zuschlag
  };

  let bedarf = wohnform === "extern"
    ? regelbedarfe.grundbedarf_extern + regelbedarfe.zuschlag_unterkunft
    : regelbedarfe.grundbedarf_eltern;

  if (krankenversicherung === "gesetzlich") {
    bedarf += regelbedarfe.krankenversicherung + regelbedarfe.pflegeversicherung;
  }

  // Eigenes Einkommen anrechnen
  const freibetrag_eigen = rates.bafoeg.freibetraege.eigenes_einkommen_monat;
  const eigenes_ueber_freibetrag = Math.max(0, eigenes_einkommen - freibetrag_eigen);
  const eigenes_anrechenbar = eigenes_ueber_freibetrag;

  // Elterneinkommen anrechnen
  const freibetrag_eltern_verheiratet = rates.bafoeg.freibetraege.eltern_verheiratet_monat;
  const freibetrag_eltern_alleinstehend = rates.bafoeg.freibetraege.eltern_alleinstehend_monat;
  const freibetrag_geschwister = rates.bafoeg.freibetraege.geschwister_in_ausbildung_monat;

  const freibetrag_eltern = eltern_alleinstehend
    ? freibetrag_eltern_alleinstehend
    : freibetrag_eltern_verheiratet;
  const freibetrag_gesamt_eltern = freibetrag_eltern + (geschwister_in_ausbildung * freibetrag_geschwister);
  const eltern_ueber_freibetrag = Math.max(0, eltern_einkommen - freibetrag_gesamt_eltern);
  const eltern_anrechenbar = rund(eltern_ueber_freibetrag * (rates.bafoeg.einkommensanrechnung_eltern_prozent / 100));

  const gesamt_anrechenbar = eigenes_anrechenbar + eltern_anrechenbar;
  const bafoeg = Math.max(0, bedarf - gesamt_anrechenbar);

  // Darlehensanteil: 50 % as grant/subsidy (Zuschuss) from rates
  const zuschuss = rund(bafoeg * 0.5);
  const darlehen = bafoeg - zuschuss;

  return {
    wohnform,
    bedarf: rund(bedarf),
    eigenes_einkommen,
    eigenes_anrechenbar: rund(eigenes_anrechenbar),
    eltern_einkommen,
    freibetrag_gesamt: rund(freibetrag_gesamt_eltern),
    eltern_anrechenbar: rund(eltern_anrechenbar),
    gesamt_anrechenbar: rund(gesamt_anrechenbar),
    bafoeg: rund(bafoeg),
    zuschuss,
    darlehen,
    hat_anspruch: bafoeg > 0
  };
}
