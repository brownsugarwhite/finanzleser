"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type AnnuitaetParams, type AnnuitaetResult } from "@/lib/calculators/annuitaet";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerAmortizationTable from "./ui/RechnerAmortizationTable";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function AnnuitaetRechner() {
  const [params, setParams] = useState<AnnuitaetParams>({
    darlehensbetrag: 250000,
    zinssatzPa: 3.0,
    laufzeitJahre: 20,
  });

  const [result, setResult] = useState<AnnuitaetResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Annuitätenrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Darlehensbetrag"
          name="darlehensbetrag"
          value={params.darlehensbetrag}
          onChange={(val) => setParams((prev) => ({ ...prev, darlehensbetrag: val }))}
          einheit="€"
          step={5000}
          min={0}
        />
        <RechnerInput
          label="Jahreszinssatz"
          name="zinssatzPa"
          value={params.zinssatzPa}
          onChange={(val) => setParams((prev) => ({ ...prev, zinssatzPa: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />
        <RechnerInput
          label="Laufzeit"
          name="laufzeitJahre"
          value={params.laufzeitJahre}
          onChange={(val) => setParams((prev) => ({ ...prev, laufzeitJahre: val }))}
          einheit="Jahre"
          step={1}
          min={1}
          max={50}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatsrate" value={euro(result.monatsrate)} highlight />
            <RechnerResultBox label="Gesamtzinsen" value={euro(result.gesamtZinsen)} />
            <RechnerResultBox label="Gesamtrückzahlung" value={euro(result.gesamtRueckzahlung)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Darlehensbetrag", value: euro(params.darlehensbetrag) },
              { label: "Jahreszinssatz", value: prozent(params.zinssatzPa) },
              { label: "Laufzeit", value: `${params.laufzeitJahre} Jahre` },
              { label: "Monatsrate (Annuität)", value: euro(result.monatsrate) },
              { label: "Gesamtrückzahlung", value: euro(result.gesamtRueckzahlung) },
              { label: "Gesamtzinsen", value: euro(result.gesamtZinsen) },
              { label: "Effektivzins", value: prozent(result.effektivZins) },
            ]}
          />

          <h4 className="rechner-result-section-title">Tilgungsplan (Jahresübersicht)</h4>
          <RechnerAmortizationTable
            columns={[
              { key: "jahr", label: "Jahr" },
              { key: "rateJahr", label: "Rate (Jahr)" },
              { key: "zinsen", label: "Zinsen" },
              { key: "tilgung", label: "Tilgung" },
              { key: "restschuld", label: "Restschuld" },
            ]}
            yearlyRows={result.jahresplan.map((row) => ({
              jahr: row.jahr,
              rateJahr: euro(row.rateJahr),
              zinsen: euro(row.zinsen),
              tilgung: euro(row.tilgung),
              restschuld: euro(row.restschuld),
            }))}
          />

          <RechnerHinweis>
            Annuitätenformel: R = K x [i x (1+i)^n] / [(1+i)^n - 1].
            Die Monatsrate bleibt konstant, der Zinsanteil sinkt mit der Zeit.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
