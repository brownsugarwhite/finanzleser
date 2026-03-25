import { RATES } from "./rates";
import { rund } from "./utils";

export interface HaushaltsrechnerParams {
  monatliches_einkommen: number;
  miete: number;
  nebenkosten: number;
  lebensmittel: number;
  transport: number;
  versicherungen: number;
  sonstiges: number;
}

export interface HaushaltsrechnerResult {
  monatliches_einkommen: number;
  gesamtausgaben: number;
  sparkline: number;
  sparquote: number;
  notgroschen_monate: number;
  hinweis: string;
}

export function berechne(
  {
    monatliches_einkommen,
    miete,
    nebenkosten,
    lebensmittel,
    transport,
    versicherungen,
    sonstiges
  }: HaushaltsrechnerParams,
  rates: typeof RATES = RATES
): HaushaltsrechnerResult {
  const gesamtausgaben = rund(
    miete + nebenkosten + lebensmittel + transport + versicherungen + sonstiges
  );
  const sparkline = rund(monatliches_einkommen - gesamtausgaben);
  const sparquote =
    monatliches_einkommen > 0
      ? rund((sparkline / monatliches_einkommen) * 100)
      : 0;

  // Notgroschen: 3–6 Monatliche Ausgaben
  const notgroschen_monate = gesamtausgaben > 0
    ? rund((gesamtausgaben * 3) / 1000) / 100
    : 0;

  const hinweis =
    sparquote >= 10
      ? "Gute Sparquote! Empfohlen sind 10-20%."
      : sparquote >= 5
        ? "Moderate Sparquote. Versuchen Sie, auf 10% zu erhöhen."
        : "Wenig Spielraum für Sparen. Überprüfen Sie Ihre Ausgaben.";

  return {
    monatliches_einkommen,
    gesamtausgaben,
    sparkline,
    sparquote,
    notgroschen_monate,
    hinweis
  };
}
