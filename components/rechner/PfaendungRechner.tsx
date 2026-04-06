"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type PfaendungParams, type PfaendungResult } from "@/lib/calculators/pfaendung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function PfaendungRechner() {
  const [params, setParams] = useState<PfaendungParams>({
    monatsNetto: 2500,
    unterhaltspflichten: 1,
  });

  const [result, setResult] = useState<PfaendungResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Pfaendungsrechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Nettoeinkommen"
          name="monatsNetto"
          value={params.monatsNetto}
          onChange={(val) => setParams((p) => ({ ...p, monatsNetto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerSelect
          label="Unterhaltspflichten"
          name="unterhaltspflichten"
          value={params.unterhaltspflichten.toString()}
          onChange={(val) => setParams((p) => ({ ...p, unterhaltspflichten: parseInt(val) }))}
          options={Array.from({ length: 6 }, (_, i) => ({
            label: `${i} ${i === 1 ? "Person" : "Personen"}`,
            value: i.toString(),
          }))}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Pfaendbarer Betrag"
              value={euro(result.pfaendbarerBetrag)}
              highlight
            />
            <RechnerResultBox
              label="Verbleibendes Einkommen"
              value={euro(result.verbleibendesEinkommen)}
              variant="positive"
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Grundfreibetrag", value: euro(result.grundfreibetrag) },
              { label: "Erhoehung (Unterhaltspfl.)", value: euro(result.erhoehung) },
              { label: "Gesamter Freibetrag", value: euro(result.gesamtFreibetrag) },
              { label: "Pfaendbarer Betrag (70 %)", value: euro(result.pfaendbarerBetrag) },
            ]}
            footer={{ label: "Verbleibt", value: euro(result.verbleibendesEinkommen) }}
          />

          <RechnerHinweis>
            Pfaendungsfreigrenzen gueltig 01.07.2025 - 30.06.2026. Erste
            Unterhaltspflicht: +585,23 EUR, weitere: +326,04 EUR. 70 % des
            ueberschuessigen Betrags sind pfaendbar. Grundlage: 850c ZPO.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
