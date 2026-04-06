"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type GerichtskostenParams, type GerichtskostenResult } from "@/lib/calculators/gerichtskosten";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function GerichtsKostenRechner() {
  const [params, setParams] = useState<GerichtskostenParams>({
    streitwert: 5000,
    instanz: "ag_lg",
  });

  const [result, setResult] = useState<GerichtskostenResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Gerichtskosten-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Streitwert"
          name="streitwert"
          value={params.streitwert}
          onChange={(val) => setParams((p) => ({ ...p, streitwert: val }))}
          einheit="EUR"
          min={0}
        />
        <RechnerSelect
          label="Instanz"
          name="instanz"
          value={params.instanz}
          onChange={(val) =>
            setParams((p) => ({
              ...p,
              instanz: val as GerichtskostenParams["instanz"],
            }))
          }
          options={[
            { value: "ag_lg", label: "Amts-/Landgericht" },
            { value: "olg", label: "Oberlandesgericht" },
            { value: "bgh", label: "Bundesgerichtshof" },
          ]}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtkosten"
              value={euro(result.gesamtKosten)}
              highlight={true}
            />
            <RechnerResultBox
              label="Gerichtsgebuehr"
              value={euro(result.gerichtsgebuehr)}
            />
            <RechnerResultBox
              label="Anwaltskosten"
              value={euro(result.anwaltsGesamt)}
            />
          </div>

          <h4 className="rechner-result-section-title">Anwaltskosten (1 Anwalt)</h4>
          <RechnerResultTable
            rows={[
              { label: "Verfahrensgebuehr (1,3-fach)", value: euro(result.anwaltsVerfahren) },
              { label: "Terminsgebuehr (1,2-fach)", value: euro(result.anwaltsTermin) },
              { label: "Post-/Telekompauschale", value: euro(result.anwaltsPostpauschale) },
              { label: "MwSt (19 %)", value: euro(result.anwaltsMwSt) },
            ]}
            footer={{
              label: "Anwalt gesamt (brutto)",
              value: euro(result.anwaltsGesamt),
            }}
          />

          <RechnerHinweis>
            Berechnung nach GKG Anlage 2 und RVG. Bei 2 Parteien mit je eigenem Anwalt
            verdoppeln sich die Anwaltskosten. Gerichtsgebuehr je nach Instanz (AG/LG: 3-fach,
            OLG: 4-fach, BGH: 5-fach).
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
