/**
 * Die Schleuse: welcher Rechner zieht schon im Kursblatt-Satz?
 *
 * `RechnerEmbed` fragt hier VOR seinem switch. Ein Rechner zieht um, indem hier eine
 * Zeile dazukommt — die alte Komponente bleibt liegen, bis der letzte umgezogen ist,
 * und niemand muss einen fremden Rechner anfassen.
 */
import type { RechnerSchema, Werte } from "../schema";
import { abfindungSchema } from "./abfindung";
import { alg1Schema } from "./alg1";
import { altersteilzeitSchema } from "./altersteilzeit";
import { annuitaetSchema } from "./annuitaet";
import { bafoegSchema } from "./bafoeg";
import { bruttoNettoSchema } from "./brutto-netto";
import { buergergeldSchema } from "./buergergeld";
import { einkommensteuerSchema } from "./einkommensteuer";
import { elterngeldSchema } from "./elterngeld";
import { elternzeitSchema } from "./elternzeit";
import { erbschaftsteuerSchema } from "./erbschaftsteuer";
import { flexrenteSchema } from "./flexrente";
import { gerichtskostenSchema } from "./gerichtskosten";
import { gleitzoneSchema } from "./gleitzone";
import { gruendungszuschussSchema } from "./gruendungszuschuss";
import { grundsicherungSchema } from "./grundsicherung";
import { haushaltsrechnerSchema } from "./haushaltsrechner";
import { heizkostenSchema } from "./heizkosten";
import { hinzuverdienstSchema } from "./hinzuverdienst";
import { inflationSchema } from "./inflation";
import { kalteprogressionSchema } from "./kalteprogression";
import { kfwStudienkreditSchema } from "./kfw-studienkredit";
import { kfzSteuerSchema } from "./kfz-steuer";
import { kindergeldSchema } from "./kindergeld";
import { kinderkrankengeldSchema } from "./kinderkrankengeld";
import { kirchensteuerSchema } from "./kirchensteuer";
import { krankengeldSchema } from "./krankengeld";
import { kreditSchema } from "./kredit";
import { kurzarbeitsgeldSchema } from "./kurzarbeitsgeld";
import { leasingSchema } from "./leasing";
import { mehrwertsteuerSchema } from "./mehrwertsteuer";
import { mindestlohnSchema } from "./mindestlohn";
import { minijobSchema } from "./minijob";
import { mutterschutzSchema } from "./mutterschutz";
import { paypalSchema } from "./paypal";
import { pendlerpauschaleSchema } from "./pendlerpauschale";
import { pfaendungSchema } from "./pfaendung";
import { pvFoerderungSchema } from "./pv-foerderung";
import { renteSchema } from "./rente";
import { rentenabschlagSchema } from "./rentenabschlag";
import { rentenbeginnSchema } from "./rentenbeginn";
import { rentenbesteuerungSchema } from "./rentenbesteuerung";
import { rentenschaetzerSchema } from "./rentenschaetzer";
import { scheidungskostenSchema } from "./scheidungskosten";
import { steuererstattungSchema } from "./steuererstattung";
import { steuerklassenSchema } from "./steuerklassen";
import { stundenlohnSchema } from "./stundenlohn";
import { teilzeitSchema } from "./teilzeit";
import { tilgungSchema } from "./tilgung";
import { uebergangsgeldSchema } from "./uebergangsgeld";
import { unterhaltSchema } from "./unterhalt";
import { urlaubsanspruchSchema } from "./urlaubsanspruch";
import { verletztengeldSchema } from "./verletztengeld";
import { witwenrenteSchema } from "./witwenrente";
import { wohngeldSchema } from "./wohngeld";
import { zinseszinsSchema } from "./zinseszins";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCHEMATA: Record<string, RechnerSchema<any, any>> = {
  abfindung: abfindungSchema,
  alg1: alg1Schema,
  altersteilzeit: altersteilzeitSchema,
  annuitaet: annuitaetSchema,
  bafoeg: bafoegSchema,
  "brutto-netto": bruttoNettoSchema,
  buergergeld: buergergeldSchema,
  einkommensteuer: einkommensteuerSchema,
  elterngeld: elterngeldSchema,
  elternzeit: elternzeitSchema,
  erbschaftsteuer: erbschaftsteuerSchema,
  flexrente: flexrenteSchema,
  gerichtskosten: gerichtskostenSchema,
  gleitzone: gleitzoneSchema,
  gruendungszuschuss: gruendungszuschussSchema,
  grundsicherung: grundsicherungSchema,
  haushaltsrechner: haushaltsrechnerSchema,
  heizkosten: heizkostenSchema,
  hinzuverdienst: hinzuverdienstSchema,
  inflation: inflationSchema,
  kalteprogression: kalteprogressionSchema,
  "kfw-studienkredit": kfwStudienkreditSchema,
  "kfz-steuer": kfzSteuerSchema,
  kindergeld: kindergeldSchema,
  kinderkrankengeld: kinderkrankengeldSchema,
  kirchensteuer: kirchensteuerSchema,
  krankengeld: krankengeldSchema,
  kredit: kreditSchema,
  kurzarbeitsgeld: kurzarbeitsgeldSchema,
  leasing: leasingSchema,
  mehrwertsteuer: mehrwertsteuerSchema,
  mindestlohn: mindestlohnSchema,
  minijob: minijobSchema,
  mutterschutz: mutterschutzSchema,
  paypal: paypalSchema,
  pendlerpauschale: pendlerpauschaleSchema,
  pfaendung: pfaendungSchema,
  "pv-foerderung": pvFoerderungSchema,
  rente: renteSchema,
  rentenabschlag: rentenabschlagSchema,
  rentenbeginn: rentenbeginnSchema,
  rentenbesteuerung: rentenbesteuerungSchema,
  rentenschaetzer: rentenschaetzerSchema,
  scheidungskosten: scheidungskostenSchema,
  steuererstattung: steuererstattungSchema,
  steuerklassen: steuerklassenSchema,
  stundenlohn: stundenlohnSchema,
  teilzeit: teilzeitSchema,
  tilgung: tilgungSchema,
  uebergangsgeld: uebergangsgeldSchema,
  unterhalt: unterhaltSchema,
  urlaubsanspruch: urlaubsanspruchSchema,
  verletztengeld: verletztengeldSchema,
  witwenrente: witwenrenteSchema,
  wohngeld: wohngeldSchema,
  zinseszins: zinseszinsSchema,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function schemaFuer(slug: string): RechnerSchema<Werte, any> | null {
  return SCHEMATA[slug] ?? null;
}

export const KURSBLATT_RECHNER = Object.keys(SCHEMATA);
