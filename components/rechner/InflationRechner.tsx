"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type InflationParams, type InflationResult } from "@/lib/calculators/inflation";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerMultiColumnTable from "./ui/RechnerMultiColumnTable";
import RechnerButton from "./ui/RechnerButton";

export default function InflationRechner() {
  const [params, setParams] = useState<InflationParams>({
    betrag: 1000,
    inflationsrateProzent: 2.5,
    jahre: 10,
  });

  const [result, setResult] = useState<InflationResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Inflationsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Betrag"
          name="betrag"
          value={params.betrag}
          onChange={(val) => setParams((prev) => ({ ...prev, betrag: val }))}
          einheit="€"
          step={100}
          min={1}
        />
        <RechnerInput
          label="Inflationsrate"
          name="inflationsrateProzent"
          value={params.inflationsrateProzent}
          onChange={(val) => setParams((prev) => ({ ...prev, inflationsrateProzent: val }))}
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

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Reeller Wert" value={euro(result.reellerWert)} highlight />
            <RechnerResultBox label="Kaufkraftverlust" value={euro(result.kaufkraftVerlust)} variant="negative" />
            <RechnerResultBox label="Benötigter Betrag" value={euro(result.benoetigt)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Heutiger Betrag", value: euro(params.betrag) },
              { label: "Inflationsrate", value: prozent(params.inflationsrateProzent) },
              { label: "Zeitraum", value: `${params.jahre} Jahre` },
              { label: "Reeller Wert", value: euro(result.reellerWert) },
              { label: "Kaufkraftverlust", value: `${euro(result.kaufkraftVerlust)} (${prozent(result.verlustProzent)})` },
              { label: "Benötigter Betrag für gleiche Kaufkraft", value: euro(result.benoetigt) },
            ]}
          />

          <h4 className="rechner-result-section-title">Jahresübersicht</h4>
          <RechnerMultiColumnTable
            columns={[
              { key: "jahr", label: "Jahr" },
              { key: "reellerWert", label: "Reeller Wert", align: "right" },
              { key: "kaufkraftVerlust", label: "Kaufkraftverlust", align: "right" },
              { key: "benoetigt", label: "Benötigt", align: "right" },
            ]}
            rows={result.jahresplan.map((row) => ({
              jahr: String(row.jahr),
              reellerWert: euro(row.reellerWert),
              kaufkraftVerlust: euro(row.kaufkraftVerlust),
              benoetigt: euro(row.benoetigt),
            }))}
          />

          <RechnerHinweis>
            Zeigt, wie viel Kaufkraft ein Betrag durch Inflation verliert.
            Der &quot;benötigte Betrag&quot; ist der Wert, den Sie in Zukunft brauchen,
            um die gleiche Kaufkraft wie heute zu haben.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
