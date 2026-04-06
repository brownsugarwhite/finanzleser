"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type VerletztengeldParams, type VerletztengeldResult } from "@/lib/calculators/verletztengeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function VerletztensgeldRechner() {
  const [params, setParams] = useState<VerletztengeldParams>({
    monatsBrutto: 3500,
    monatsNetto: 2400,
  });

  const [result, setResult] = useState<VerletztengeldResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Verletztengeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliches Bruttogehalt"
          name="monatsBrutto"
          value={params.monatsBrutto}
          onChange={(val) => setParams((prev) => ({ ...prev, monatsBrutto: val }))}
          einheit="€"
          step={100}
          min={0}
        />

        <RechnerInput
          label="Monatliches Nettogehalt"
          name="monatsNetto"
          value={params.monatsNetto}
          onChange={(val) => setParams((prev) => ({ ...prev, monatsNetto: val }))}
          einheit="€"
          step={100}
          min={0}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Verletztengeld taeglich"
              value={euro(result.vgTaeglich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Verletztengeld monatlich"
              value={euro(result.vgMonatlich)}
            />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Monatsbrutto", value: `${euro(result.monatsBrutto)}${result.istBegrenzt ? " (ueber JAV-Hoechstbetrag)" : ""}` },
              { label: "Brutto (begrenzt)", value: euro(result.bruttoBegrenzt) },
              { label: "Regelentgelt (taeglich)", value: euro(result.regelentgeltTaeglich) },
              { label: "80% Brutto (taeglich)", value: euro(result.vgBruttoTaeglich) },
              { label: "Netto (taeglich)", value: euro(result.nettoTaeglich) },
              { label: "Verletztengeld (taeglich)", value: euro(result.vgTaeglich) },
              { label: "Verletztengeld (woechentlich)", value: euro(result.vgWoechentlich) },
            ]}
            footer={{ label: "Verletztengeld (monatlich)", value: euro(result.vgMonatlich) }}
          />

          <RechnerHinweis>
            Verletztengeld betraegt 80% des Regelentgelts, max. Nettoverdienst (SS 45-52 SGB VII).
            Es wird bei Arbeitsunfaellen und Berufskrankheiten gezahlt.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
