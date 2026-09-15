/**
 * Die Schleuse: welcher Rechner zieht schon im Kursblatt-Satz?
 *
 * `RechnerEmbed` fragt hier VOR seinem switch. Ein Rechner zieht um, indem hier eine
 * Zeile dazukommt — die alte Komponente bleibt liegen, bis der letzte umgezogen ist,
 * und niemand muss einen fremden Rechner anfassen.
 */
import type { RechnerSchema, Werte } from "../schema";
import { kreditSchema } from "./kredit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCHEMATA: Record<string, RechnerSchema<any, any>> = {
  kredit: kreditSchema,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function schemaFuer(slug: string): RechnerSchema<Werte, any> | null {
  return SCHEMATA[slug] ?? null;
}

export const KURSBLATT_RECHNER = Object.keys(SCHEMATA);
