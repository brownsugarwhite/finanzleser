import { RATES } from "./rates";
import { rund } from "./utils";

export interface StundenlohnParams {
  stunden: number;
  stundenumfang: "vollzeit" | "teilzeit" | "custom";
}

export interface StundenlohnResult {
  mindestlohn: number;
  stundenWoche: number;
  stundenMonat: number;
  einkommenWoche: number;
  einkommenMonat: number;
}

export function berechne({ stunden, stundenumfang }: StundenlohnParams, rates: typeof RATES = RATES): StundenlohnResult {
  const mindestlohn = RATES.mindestlohn.stundensatz;

  let stundenWoche = 40;
  if (stundenumfang === "teilzeit") stundenWoche = 20;
  else if (stundenumfang === "custom") stundenWoche = stunden;

  const stundenMonat = rund((stundenWoche * 52) / 12);

  return {
    mindestlohn,
    stundenWoche,
    stundenMonat,
    einkommenWoche: rund(stundenWoche * mindestlohn),
    einkommenMonat: rund(stundenMonat * mindestlohn),
  };
}
