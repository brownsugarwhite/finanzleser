"use client";

import { useState, useEffect } from "react";
import { berechne, type ZinseszinsParams, type ZinseszinsResult } from "@/lib/calculators/zinseszins";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function ZinseszinsRechner() {
  const [params, setParams] = useState<ZinseszinsParams>({
    kapital: 10000,
    zinssatz: 3,
    jahre: 20,
  });

  const [result, setResult] = useState<ZinseszinsResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Zinseszinsrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Startkapital"
          name="kapital"
          value={params.kapital}
          onChange={(val) => setParams((prev) => ({ ...prev, kapital: val }))}
          einheit="€"
          step={500}
          min={1}
        />

        <RechnerInput
          label="Jährlicher Zinssatz"
          name="zinssatz"
          value={params.zinssatz}
          onChange={(val) => setParams((prev) => ({ ...prev, zinssatz: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />

        <RechnerInput
          label="Laufzeit"
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
            <RechnerResultBox label="Startkapital" value={euro(result.startkapital)} />
            <RechnerResultBox label="Zinsertrag" value={euro(result.ertrag)} />
            <RechnerResultBox label="Endkapital" value={euro(result.endkapital)} highlight={true} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Startkapital", value: euro(result.startkapital) },
              { label: "Jährlicher Zinssatz", value: `${result.zinssatz}%` },
              { label: "Laufzeit", value: `${result.jahre} Jahre` },
              { label: "Zinsertrag (Zinseszins)", value: euro(result.ertrag) },
              { label: "Endkapital", value: euro(result.endkapital) },
            ]}
          />

          <RechnerHinweis>
            Der Zinseszinseffekt zeigt, wie Zinsen auf Zinsen wachsen. Dies ist das Grundprinzip von
            langfristigem Vermögensaufbau.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
