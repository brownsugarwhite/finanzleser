import { RATES } from "./rates";
import { rund } from "./utils";

export interface BruttoNettoParams {
  monatsBrutto: number;
  steuerklasse: 1 | 2 | 3 | 4 | 5 | 6;
  bundesland: string;
  kirchenmitglied: boolean;
  kinder: number;
  kinderlosUeber23: boolean;
  eigenerKvZusatz?: number | null;
}

export interface BruttoNettoResult {
  brutto: number;
  netto: number;
  sv: {
    rv: number;
    kv: number;
    pv: number;
    alv: number;
    gesamt: number;
  };
  steuern: {
    lohnsteuer: number;
    soli: number;
    kirchensteuer: number;
    gesamt: number;
  };
  gesamtAbzuege: number;
}

/** §32a EStG 2026 Einkommensteuertarif */
function estg32a(x: number): number {
  x = Math.floor(x);
  if (x <= 12348) return 0;
  if (x <= 17799) {
    const y = (x - 12348) / 10000;
    return Math.floor((914.51 * y + 1400) * y);
  }
  if (x <= 69878) {
    const z = (x - 17799) / 10000;
    return Math.floor((173.1 * z + 2397) * z + 1034.87);
  }
  if (x <= 277826) {
    return Math.floor(0.42 * x - 9690.85);
  }
  return Math.floor(0.45 * x - 19470.38);
}

function berechneJahresLohnsteuer(jahresBrutto: number, steuerklasse: number): number {
  const { grundfreibetrag, arbeitnehmer_pauschbetrag, sonderausgaben_pauschbetrag, entlastungsbetrag_alleinerziehend } =
    RATES.lohnsteuer;

  if (steuerklasse === 3) {
    const basis = Math.max(0, (jahresBrutto - arbeitnehmer_pauschbetrag - sonderausgaben_pauschbetrag) / 2);
    return 2 * estg32a(basis);
  }

  if (steuerklasse === 5) {
    const zvE = Math.max(0, jahresBrutto - arbeitnehmer_pauschbetrag - sonderausgaben_pauschbetrag);
    return estg32a(zvE + grundfreibetrag);
  }

  if (steuerklasse === 6) {
    return estg32a(jahresBrutto + grundfreibetrag);
  }

  let abzuege = arbeitnehmer_pauschbetrag + sonderausgaben_pauschbetrag;
  if (steuerklasse === 2) abzuege += entlastungsbetrag_alleinerziehend;
  return estg32a(Math.max(0, jahresBrutto - abzuege));
}

function berechneSoli(jahresESt: number): number {
  const { satz_prozent, freigrenze_einzeln, milderungszone_faktor_prozent } = RATES.solidaritaetszuschlag;

  if (jahresESt <= freigrenze_einzeln) return 0;
  const vollSoli = (satz_prozent / 100) * jahresESt;
  const milderung = (milderungszone_faktor_prozent / 100) * (jahresESt - freigrenze_einzeln);
  return Math.min(vollSoli, milderung);
}

function getPVRate(kinder: number, kinderlosUeber23: boolean): number {
  if (kinderlosUeber23) return RATES.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern.kinderlos_ueber23;
  if (kinder <= 1) return RATES.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern["1_kind"];
  if (kinder === 2) return RATES.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern["2_kinder"];
  if (kinder === 3) return RATES.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern["3_kinder"];
  if (kinder === 4) return RATES.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern["4_kinder"];
  return RATES.sozialversicherung.pflegeversicherung.arbeitnehmer_nach_kindern["5_oder_mehr_kinder"];
}

function getKirchensteuersatz(bundesland: string): number {
  const satz8Bundeslaender: readonly string[] = RATES.kirchensteuer.satz_8_prozent_bundeslaender;
  if (satz8Bundeslaender.includes(bundesland)) {
    return 0.08;
  }
  return 0.09;
}

export function berechne({
  monatsBrutto,
  steuerklasse,
  bundesland,
  kirchenmitglied,
  kinder,
  kinderlosUeber23,
  eigenerKvZusatz = null,
}: BruttoNettoParams): BruttoNettoResult {
  const kvZusatz = eigenerKvZusatz ?? RATES.sozialversicherung.krankenversicherung.durchschnittlicher_zusatzbeitrag_prozent;

  // Sozialversicherung
  const rvBasis = Math.min(monatsBrutto, RATES.beitragsbemessungsgrenzen.renten_arbeitslosen.monatlich);
  const kvBasis = Math.min(monatsBrutto, RATES.beitragsbemessungsgrenzen.kranken_pflege.monatlich);

  const rv = rund((rvBasis * RATES.sozialversicherung.rentenversicherung.arbeitnehmer_prozent) / 100);
  const kv_allg = rund((kvBasis * RATES.sozialversicherung.krankenversicherung.allgemeiner_beitrag_an_prozent) / 100);
  const kv_zusatz = rund((kvBasis * kvZusatz) / 100 / 2);
  const kv = kv_allg + kv_zusatz;

  const pv_satz = getPVRate(kinder, kinderlosUeber23);
  const pv = rund((kvBasis * pv_satz) / 100);

  const alv = rund((rvBasis * RATES.sozialversicherung.arbeitslosenversicherung.arbeitnehmer_prozent) / 100);

  const svGesamt = rv + kv + pv + alv;

  // Einkommen nach SV
  const einkommenNachSV = monatsBrutto - svGesamt;

  // Jahresbrutto für Steuern
  const jahresBrutto = monatsBrutto * 12;
  const jahresSV = svGesamt * 12;
  const jahresLohnsteuer = berechneJahresLohnsteuer(jahresBrutto, steuerklasse);
  const monatslohnsteuer = rund(jahresLohnsteuer / 12);

  const jahresSoli = berechneSoli(jahresLohnsteuer);
  const monatsSoli = rund(jahresSoli / 12);

  let kirchensteuer = 0;
  if (kirchenmitglied) {
    const kirchensatz = getKirchensteuersatz(bundesland);
    kirchensteuer = rund((monatslohnsteuer * kirchensatz) / 100);
  }

  const steuernGesamt = monatslohnsteuer + monatsSoli + kirchensteuer;
  const netto = rund(monatsBrutto - svGesamt - steuernGesamt);

  return {
    brutto: rund(monatsBrutto),
    netto: netto,
    sv: {
      rv: rund(rv),
      kv: rund(kv),
      pv: rund(pv),
      alv: rund(alv),
      gesamt: rund(svGesamt),
    },
    steuern: {
      lohnsteuer: rund(monatslohnsteuer),
      soli: rund(monatsSoli),
      kirchensteuer: rund(kirchensteuer),
      gesamt: rund(steuernGesamt),
    },
    gesamtAbzuege: rund(svGesamt + steuernGesamt),
  };
}
