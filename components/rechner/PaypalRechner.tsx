"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type PaypalParams, type PaypalResult, type PaypalTyp } from "@/lib/calculators/paypal";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import { useRechnerState } from "@/lib/hooks/useRechnerState";
import RechnerResults from "./ui/RechnerResults";

export default function PaypalRechner() {
  const [params, setParams] = useState<PaypalParams>({
    betrag: 100,
    typ: "haendler_inland",
  });

  const [result, setResult] = useState<PaypalResult | null>(null);
  const rechnerState = useRechnerState(params);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
    rechnerState.markCalculated();
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">PayPal-Gebührenrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Betrag"
          name="betrag"
          value={params.betrag}
          onChange={(val) => setParams((prev) => ({ ...prev, betrag: val }))}
          einheit="€"
          step={10}
          min={0}
        />
        <RechnerSelect
          label="Transaktionstyp"
          name="typ"
          value={params.typ}
          onChange={(val) => setParams((prev) => ({ ...prev, typ: val as PaypalTyp }))}
          options={[
            { label: "Händler Inland (2,49% + 0,35€)", value: "haendler_inland" },
            { label: "Händler International (3,49% + 0,35€)", value: "haendler_international" },
            { label: "Freunde / Kreditkarte (2,9% + 0,35€)", value: "freunde_kreditkarte" },
          ]}
        />
      <RechnerButton onClick={handleBerechnen} disabled={rechnerState.buttonDisabled} needsUpdate={rechnerState.needsUpdate} />

      </div>

      {result && (
        <RechnerResults scrollKey={rechnerState.scrollKey}>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Gebühr" value={euro(result.gebuehr)} highlight />
            <RechnerResultBox label="Nettobetrag" value={euro(result.nettoBetrag)} variant="positive" />
            <RechnerResultBox label="Effektive Gebühr" value={prozent(result.gebuehrProzent)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Bruttobetrag", value: euro(result.bruttoBetrag) },
              { label: "PayPal-Gebühr", value: euro(result.gebuehr) },
              { label: "Nettobetrag", value: euro(result.nettoBetrag) },
              { label: "Effektiver Gebührensatz", value: prozent(result.gebuehrProzent) },
            ]}
          />

          <RechnerHinweis>
            Die Gebühren entsprechen den aktuellen PayPal-AGB für Deutschland.
            Bei Währungsumrechnungen fallen zusätzliche Gebühren an.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
