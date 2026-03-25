"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type InflationParams, type InflationResult } from "@/lib/calculators/inflation";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function InflationRechner() {
  const [params, setParams] = useState<InflationParams>({
    betrag: 1000,
    inflationsrate: 2.5,
    jahre: 10,
  });

  const [result, setResult] = useState<InflationResult | null>(null);

  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Inflationsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Startbetrag"
          name="betrag"
          value={params.betrag}
          onChange={(val) => setParams((prev) => ({ ...prev, betrag: val }))}
          einheit="€"
          step={100}
          min={1}
        />

        <RechnerInput
          label="Jährliche Inflationsrate"
          name="inflationsrate"
          value={params.inflationsrate}
          onChange={(val) => setParams((prev) => ({ ...prev, inflationsrate: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />

        <RechnerInput
          label="Zeitraum"
          name="jahre"
          value={params.jahre}
          onChange={(val) => setParams((prev) => ({ ...prev, jahre: val }))}
          einheit="Jahre"
          step={1}
          min={1}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Startwert" value={euro(result.startbetrag)} />
            <RechnerResultBox label="Kaufkraftverlust" value={euro(result.kaufkraftverlust)} />
            <RechnerResultBox label="Equivalent heute" value={euro(result.endbetrag)} highlight={true} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Betrag heute", value: euro(result.startbetrag) },
              { label: "Jährliche Inflation", value: `${result.inflationsrate}%` },
              { label: "Zeitraum", value: `${result.jahre} Jahre` },
              { label: "Kaufkraftverlust", value: `${result.kaufkraftprozent}%` },
              { label: "Äquivalenter Betrag", value: euro(result.endbetrag) },
            ]}
          />

          <RechnerHinweis>
            Zeigt, wie viel Kaufkraft ein Betrag durch Inflation über einen Zeitraum verliert.
            Die Beispielrate beträgt 2,5% jährlich.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
