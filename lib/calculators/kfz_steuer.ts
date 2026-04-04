import { RATES } from "./rates";
import { rund } from "./utils";

export interface KfzSteuerParams {
  antriebsart: "benzin" | "diesel" | "elektro";
  hubraum_ccm: number;
  co2_g_km: number;
  erstzulassung_jahr: number;
}

export interface KfzSteuerResult {
  hubraumSteuer: number;
  co2Steuer: number;
  jahressteuer: number;
  elektroBefreit: boolean;
}

export function berechne(
  { antriebsart, hubraum_ccm, co2_g_km, erstzulassung_jahr }: KfzSteuerParams,
  rates = RATES
): KfzSteuerResult {
  const r = rates.kfz_steuer;

  // Elektro: Befreiung pruefen
  if (antriebsart === "elektro") {
    const befreitBis =
      erstzulassung_jahr <= r.elektro_befreiung_neuzulassung_bis_jahr
        ? erstzulassung_jahr + r.elektro_befreiungsjahre
        : 0;
    const aktuellesJahr = new Date().getFullYear();
    const elektroBefreit =
      befreitBis > aktuellesJahr && befreitBis <= r.elektro_befreiung_max_bis_jahr;

    return {
      hubraumSteuer: 0,
      co2Steuer: 0,
      jahressteuer: elektroBefreit ? 0 : r.mindeststeuer,
      elektroBefreit,
    };
  }

  // Hubraum-Steuer nach Antriebsart
  const satzJe100ccm =
    antriebsart === "diesel"
      ? r.hubraum_diesel_euro_je_100ccm
      : r.hubraum_benzin_euro_je_100ccm;
  const hubraumSteuer = rund(Math.ceil(hubraum_ccm / 100) * satzJe100ccm);

  // CO2-Steuer: gestuft nach Ueberschreitung des Freibetrags
  let co2Steuer = 0;
  const co2Ueber = co2_g_km - r.co2_freibetrag_g_km;
  if (co2Ueber > 0) {
    // Stufenweise Berechnung
    let verbleibend = co2Ueber;
    let vorherigeBis = 0;
    for (const stufe of r.co2_stufen) {
      const stufenBreite = stufe.bis - vorherigeBis;
      const inStufe = Math.min(verbleibend, stufenBreite);
      co2Steuer += inStufe * stufe.euro_je_g;
      verbleibend -= inStufe;
      vorherigeBis = stufe.bis;
      if (verbleibend <= 0) break;
    }
    co2Steuer = rund(co2Steuer);
  }

  // Jahressteuer: mindestens Mindeststeuer
  const jahressteuer = rund(
    Math.max(hubraumSteuer + co2Steuer, r.mindeststeuer)
  );

  return {
    hubraumSteuer,
    co2Steuer,
    jahressteuer,
    elektroBefreit: false,
  };
}
