"use client";

import { useState, useCallback } from "react";
import { berechne, type ScheidungskostenParams, type ScheidungskostenResult } from "@/lib/calculators/scheidungskosten";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function ScheidungskostenRechner() {
  const [params, setParams] = useState<ScheidungskostenParams>({
    nettoeinkommenBeide: 5000,
    vermoegen: 50000,
    versorgungsausgleich: true,
  });

  const [result, setResult] = useState<ScheidungskostenResult | null>(null);
  const rechnerState = useRechnerState(params);

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params));
    rechnerState.markCalculated();
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Scheidungskosten-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Nettoeinkommen beider Ehegatten"
          name="nettoeinkommenBeide"
          value={params.nettoeinkommenBeide}
          onChange={(val) => setParams((p) => ({ ...p, nettoeinkommenBeide: val }))}
          einheit="EUR/Monat"
          min={0}
        />
        <RechnerInput
          label="Vermoegen (gemeinsam)"
          name="vermoegen"
          value={params.vermoegen}
          onChange={(val) => setParams((p) => ({ ...p, vermoegen: val }))}
          einheit="EUR"
          min={0}
        />
        <RechnerCheckbox
          label="Versorgungsausgleich"
          name="versorgungsausgleich"
          checked={params.versorgungsausgleich}
          onChange={(val) => setParams((p) => ({ ...p, versorgungsausgleich: val }))}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtkosten Scheidung"
              value={euro(result.gesamtkosten)}
              highlight={true}
            />
          </div>

          <h4 className="rechner-result-section-title">Kostenaufschluesselung</h4>
          <RechnerResultTable
            rows={[
              { label: "Verfahrenswert", value: euro(result.verfahrenswert) },
              { label: "Gerichtskosten", value: euro(result.gerichtskosten) },
              { label: "Anwaltskosten (2 Anwaelte)", value: euro(result.anwaltskosten) },
            ]}
            footer={{
              label: "Gesamtkosten",
              value: euro(result.gesamtkosten),
            }}
          />

          <RechnerHinweis>
            Verfahrenswert = 3 x Nettoeinkommen + 5 % Vermoegen. Bei Versorgungsausgleich
            wird der Verfahrenswert um 10 % erhoeht. Anwaltskosten berechnet fuer 2 Anwaelte
            nach RVG (Verfahrens- und Terminsgebuehr + Post + MwSt).
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
