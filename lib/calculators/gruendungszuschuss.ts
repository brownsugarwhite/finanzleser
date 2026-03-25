import { RATES } from "./rates";
import { rund } from "./utils";

export interface GruendungszuschussParams {
  alg1_anspruchswert: number;
  gruendungskapital_vorgesehen: number;
  eigenmittel_vorhanden: number;
}

export interface GruendungszuschussResult {
  alg1_anspruchswert: number;
  gruendungszuschuss_regelmaessig: number;
  gruendungszuschuss_gesamt_6monate: number;
  gruendungszuschuss_gesamt_9monate: number;
  eigenmittel_erforderlich: number;
  hinweis: string;
}

export function berechne(
  {
    alg1_anspruchswert,
    gruendungskapital_vorgesehen,
    eigenmittel_vorhanden
  }: GruendungszuschussParams,
  rates: typeof RATES = RATES
): GruendungszuschussResult {
  // Gründungszuschuss from rates.json
  const gruendungszuschuss_regelmaessig = rates.gruendungszuschuss.pauschale_phase1_monat;
  const versicherungszuschlag = Math.min(alg1_anspruchswert * 0.2, 300);

  // Laufzeitvarianten from rates.json
  const gruendungszuschuss_gesamt_6monate = rund(
    (gruendungszuschuss_regelmaessig + versicherungszuschlag) * rates.gruendungszuschuss.dauer_phase1_monate
  );
  const gruendungszuschuss_gesamt_9monate = rund(
    gruendungszuschuss_regelmaessig * 3 + versicherungszuschlag * rates.gruendungszuschuss.dauer_phase2_monate
  );

  // Mindest-Eigenmittel
  const eigenmittel_erforderlich = rund(gruendungskapital_vorgesehen * 0.3);
  const eigenmittel_ausreichend = eigenmittel_vorhanden >= eigenmittel_erforderlich;

  const hinweis = eigenmittel_ausreichend
    ? "Eigenmittel erfüllen Anforderung. Anspruch auf Gründungszuschuss ist gegeben."
    : `Eigenmittel unzureichend. Erforderlich: ${rund(eigenmittel_erforderlich)}€. Vorhanden: ${eigenmittel_vorhanden}€.`;

  return {
    alg1_anspruchswert,
    gruendungszuschuss_regelmaessig,
    gruendungszuschuss_gesamt_6monate,
    gruendungszuschuss_gesamt_9monate,
    eigenmittel_erforderlich,
    hinweis
  };
}
