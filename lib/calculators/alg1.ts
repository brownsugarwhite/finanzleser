import { RATES } from "./rates";
import { rund } from "./utils";

export interface Alg1Params {
  brutto_monat: number;
  steuerklasse: 1 | 2 | 3 | 4 | 5 | 6;
  hat_kinder: boolean;
  versicherungsmonate: number;
  alter: number;
}

export interface Alg1Result {
  brutto_monat: number;
  bemessungsentgelt: number;
  steuerklasse: number;
  hat_kinder: boolean;
  versicherungsmonate: number;
  alter: number;
  satz_prozent: number;
  leistungsentgelt_taegig: number;
  leistungsentgelt_monatlich: number;
  alg_taegig: number;
  alg_monatlich: number;
  bezugsdauer_monate: number;
  gesamtbetrag: number;
  bbg_erreicht: boolean;
  hinweis?: string;
}

// Note: ANSPRUCHSDAUER is now loaded from rates.alg1.anspruchsdauer
// Building it here for compatibility - will be moved to use rates directly
const buildAnspruchsdauer = (ratesData: typeof RATES) => {
  return ratesData.alg1.anspruchsdauer.map((item: any) => ({
    monate: item.versicherungsmonate,
    dauer: item.dauer_monate,
    alter_mind: item.alter_mind
  }));
};

const LST_PAUSCHALE: Record<number, number> = {
  1: 0.14,
  2: 0.12,
  3: 0.08,
  4: 0.14,
  5: 0.22,
  6: 0.25
};

export function berechne(
  {
    brutto_monat,
    steuerklasse,
    hat_kinder,
    versicherungsmonate,
    alter
  }: Alg1Params,
  rates: typeof RATES = RATES
): Alg1Result {
  // Konstanten from rates.json
  const LEISTUNGSSATZ_OHNE_KIND = rates.alg1.leistungssatz_ohne_kind_prozent / 100;
  const LEISTUNGSSATZ_MIT_KIND = rates.alg1.leistungssatz_mit_kind_prozent / 100;
  const BBG_ALV_MONATLICH = rates.alg1.bbg_alv_monatlich;
  const TAGE_JE_MONAT = 30;
  const SV_PAUSCHALE = rates.alg1.sv_pauschale_an_prozent / 100;

  // Bemessungsentgelt auf BBG begrenzen
  const bemessungsentgelt = Math.min(brutto_monat, BBG_ALV_MONATLICH);

  // Lohnsteuer-Pauschale für Steuerklasse
  const lst = LST_PAUSCHALE[steuerklasse] || LST_PAUSCHALE[1];
  const abzug_gesamt = SV_PAUSCHALE + lst;

  // Leistungsentgelt berechnen
  const leistungsentgelt_monatlich = rund(bemessungsentgelt * (1 - abzug_gesamt));
  const leistungsentgelt_taegig = rund(leistungsentgelt_monatlich / TAGE_JE_MONAT);

  // Leistungssatz (mit/ohne Kinder)
  const satz = hat_kinder ? LEISTUNGSSATZ_MIT_KIND : LEISTUNGSSATZ_OHNE_KIND;

  // ALG berechnen
  const alg_taegig = rund(leistungsentgelt_taegig * satz);
  const alg_monatlich = rund(alg_taegig * TAGE_JE_MONAT);

  // Anspruchsdauer bestimmen
  const ANSPRUCHSDAUER = buildAnspruchsdauer(rates);
  let anspruch = null;
  for (const stufe of ANSPRUCHSDAUER) {
    if (versicherungsmonate >= stufe.monate && alter >= stufe.alter_mind) {
      anspruch = stufe;
    }
  }

  const bezugsdauer_monate = anspruch ? anspruch.dauer : 0;
  const gesamtbetrag = rund(alg_monatlich * bezugsdauer_monate);

  let hinweis = undefined;
  if (bezugsdauer_monate === 0) {
    hinweis = "Kein Anspruch: Für ALG I sind mindestens 12 Monate versicherungspflichtige Beschäftigung innerhalb der letzten 30 Monate erforderlich (Rahmenfrist, § 143 SGB III).";
  }

  return {
    brutto_monat,
    bemessungsentgelt,
    steuerklasse,
    hat_kinder,
    versicherungsmonate,
    alter,
    satz_prozent: Math.round(satz * 100),
    leistungsentgelt_taegig,
    leistungsentgelt_monatlich,
    alg_taegig,
    alg_monatlich,
    bezugsdauer_monate,
    gesamtbetrag,
    bbg_erreicht: brutto_monat >= BBG_ALV_MONATLICH,
    hinweis
  };
}
