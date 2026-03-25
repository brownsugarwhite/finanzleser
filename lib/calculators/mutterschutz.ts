import { RATES } from "./rates";
import { rund } from "./utils";

export interface MutterschutzParams {
  geburtstermin: string; // YYYY-MM-DD
  fruegeburt_oder_mehrlinge: boolean;
  nettolohn_tag?: number;
}

export interface MutterschutzResult {
  geburtstermin: string;
  schutz_beginn: string;
  schutz_ende: string;
  schutz_tage: number;
  wochen_vor: number;
  wochen_nach: number;
  mutterschaftsgeld_kk_tag: number;
  arbeitgeber_zuschuss_tag: number;
  mutterschaftsgeld_gesamt_kk: number;
  mutterschaftsgeld_gesamt_ag: number;
  mutterschaftsgeld_gesamt: number;
}

export function berechne(
  { geburtstermin, fruegeburt_oder_mehrlinge, nettolohn_tag }: MutterschutzParams,
  rates: typeof RATES = RATES
): MutterschutzResult {
  const geburt = new Date(geburtstermin);

  // Schutzfrist from rates.json
  const wochen_vor = rates.mutterschutz.schutzfrist_vor_geburt_wochen;
  const wochen_nach = fruegeburt_oder_mehrlinge ? rates.mutterschutz.schutzfrist_nach_geburt_frueh_wochen : rates.mutterschutz.schutzfrist_nach_geburt_wochen;

  // Daten berechnen
  const schutz_beginn = new Date(geburt.getTime() - wochen_vor * 7 * 24 * 60 * 60 * 1000);
  const schutz_ende = new Date(geburt.getTime() + wochen_nach * 7 * 24 * 60 * 60 * 1000);

  const schutz_tage = Math.ceil((schutz_ende.getTime() - schutz_beginn.getTime()) / (1000 * 60 * 60 * 24));

  // Mutterschaftsgeld von der Krankenkasse from rates.json
  const mutterschaftsgeld_kk_tag = rates.mutterschutz.mutterschaftsgeld_max_tag_gkv;
  const mutterschaftsgeld_gesamt_kk = schutz_tage * mutterschaftsgeld_kk_tag;

  // Arbeitgeber-Zuschuss (Differenz zum Nettolohn)
  const netto_tag = nettolohn_tag || 0;
  const arbeitgeber_zuschuss_tag = Math.max(0, netto_tag - mutterschaftsgeld_kk_tag);
  const mutterschaftsgeld_gesamt_ag = rund(schutz_tage * arbeitgeber_zuschuss_tag);

  const mutterschaftsgeld_gesamt = mutterschaftsgeld_gesamt_kk + mutterschaftsgeld_gesamt_ag;

  return {
    geburtstermin,
    schutz_beginn: schutz_beginn.toISOString().split("T")[0],
    schutz_ende: schutz_ende.toISOString().split("T")[0],
    schutz_tage,
    wochen_vor,
    wochen_nach,
    mutterschaftsgeld_kk_tag,
    arbeitgeber_zuschuss_tag: rund(arbeitgeber_zuschuss_tag),
    mutterschaftsgeld_gesamt_kk,
    mutterschaftsgeld_gesamt_ag,
    mutterschaftsgeld_gesamt
  };
}
