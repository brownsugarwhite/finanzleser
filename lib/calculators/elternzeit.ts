import { RATES } from "./rates";

export interface ElternzeitParams {
  geburtsdatum: string; // YYYY-MM-DD
  elternteil1_monate: number;
  elternteil2_monate?: number;
  beginn_verschiebung_monate?: number;
}

export interface ElternzeitResult {
  geburtsdatum: string;
  geburt: Date;
  et_beginn: Date;
  et1_ende: Date;
  max_ende: Date;
  anmeldung_bis: Date;
  elternteil1_monate: number;
  elternteil2_monate: number;
  gesamt_monate: number;
  verbleibend_partner: number;
  ueberschreitung: number;
  gueltig: boolean;
  max_monate: number;
  kind_alter_heute_monate: number;
}

export function berechne(
  {
    geburtsdatum,
    elternteil1_monate,
    elternteil2_monate = 0,
    beginn_verschiebung_monate = 0
  }: ElternzeitParams,
  rates: typeof RATES = RATES
): ElternzeitResult {
  const max_monate_gesamt = rates.elternzeit.max_monate_gesamt;
  const anmeldung_frist_wochen = rates.elternzeit.anmeldung_frist_wochen;
  const max_alter_kind_jahre = rates.elternzeit.max_alter_kind_jahre;

  const geburt = new Date(geburtsdatum);
  const heute = new Date();

  // Elternzeit-Beginn
  const et_beginn = new Date(geburt);
  et_beginn.setMonth(et_beginn.getMonth() + beginn_verschiebung_monate);

  // Elternzeit-Ende Elternteil 1
  const et1_ende = new Date(et_beginn);
  et1_ende.setMonth(et1_ende.getMonth() + elternteil1_monate);

  // Maximales Ende: 8. Geburtstag
  const max_ende = new Date(geburt);
  max_ende.setFullYear(max_ende.getFullYear() + max_alter_kind_jahre);

  // Anmeldefrist für Elternteil 1
  const anmeldung_bis = new Date(et_beginn);
  anmeldung_bis.setDate(anmeldung_bis.getDate() - anmeldung_frist_wochen * 7);

  // Gesamtmonate beider Elternteile
  const gesamt_monate = elternteil1_monate + elternteil2_monate;
  const ueberschreitung = Math.max(0, gesamt_monate - max_monate_gesamt);

  // Verbleibende Monate für Partner
  const verbleibend_partner = Math.max(0, max_monate_gesamt - elternteil1_monate);

  const kind_alter_heute_monate = Math.floor(
    (heute.getTime() - geburt.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  return {
    geburtsdatum,
    geburt,
    et_beginn,
    et1_ende,
    max_ende,
    anmeldung_bis,
    elternteil1_monate,
    elternteil2_monate,
    gesamt_monate,
    verbleibend_partner,
    ueberschreitung,
    gueltig: ueberschreitung === 0 && gesamt_monate <= max_monate_gesamt,
    max_monate: max_monate_gesamt,
    kind_alter_heute_monate
  };
}
