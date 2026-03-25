import { RATES } from "./rates";
import { rund } from "./utils";

export interface RentenbeginParams {
  geburtsdatum: string; // YYYY-MM-DD
  rentenpunkte: number;
}

export interface RentenbeginResult {
  geburt: Date;
  alter_heute: number;
  regelaltersgrenze: number;
  fruehester_rentenbeginn: number;
  rente_monatlich_regelalter: number;
  hinweis: string;
}

export function berechne(
  { geburtsdatum, rentenpunkte }: RentenbeginParams,
  rates: typeof RATES = RATES
): RentenbeginResult {
  const geburt = new Date(geburtsdatum);
  const heute = new Date();

  // Alter
  const alter_heute = Math.floor(
    (heute.getTime() - geburt.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  // Regelaltersgrenze (nach Jahrgang)
  let rag = 65;
  const jahrgang = geburt.getFullYear();
  if (jahrgang >= 1964) rag = rates.rente.regelaltersgrenze_ab_jahrgang_1964;
  else if (jahrgang >= 1959) rag = 66;

  // Frühester Rentenbeginn: ab 62 Jahren
  const fruehester_rentenbeginn = 62;

  // Rente beim Regelalter from rates.json
  const rentenwert = rates.rente.rentenwert_ab_01jul_2026;
  const rente_monatlich_regelalter = rund(rentenpunkte * rentenwert);

  const hinweis =
    alter_heute >= rag
      ? `Sie können die Regelaltersrente in Anspruch nehmen.`
      : `Sie können mit ${fruehester_rentenbeginn} Jahren in Frührente gehen (mit Abschlägen).`;

  return {
    geburt,
    alter_heute,
    regelaltersgrenze: rag,
    fruehester_rentenbeginn,
    rente_monatlich_regelalter,
    hinweis
  };
}
