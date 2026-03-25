"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type GleitzoneParams,
  type GleitzoneResult
} from "@/lib/calculators/gleitzone";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function GleitzoneRechner() {
  const [params, setParams] = useState<GleitzoneParams>({
    monatlicher_verdienst: 800,
    ist_ab_2024: true
  });

  const [result, setResult] = useState<GleitzoneResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Gleitzone-Rechner 2026</h3>

      
    <div className="rechner-inputs">
        <RechnerInput
          label="Monatlicher Verdienst"
          name="monatlicher_verdienst"
          value={params.monatlicher_verdienst}
          onChange={(val) => {
            setParams((p) => ({ ...p, monatlicher_verdienst: Number(val) }));
          }}
          einheit="€"
          min={0}
          max={2500}
        />
      </div>

      {result && (
        
    <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kategorie"
              value={result.kategorie.charAt(0).toUpperCase() + result.kategorie.slice(1)}
              highlight={false}
            />
            {result.sv_freibetrag && (
              <RechnerResultBox
                label="SV-Freibetrag (ca.)"
                value={euro(result.sv_freibetrag)}
                highlight={false}
              />
            )}
          </div>

          <h4 className="rechner-result-section-title">Grenzen 2026</h4>
          <RechnerResultTable
            rows={[
              {
                label: "Minijob-Grenze",
                value: `bis ${euro(result.grenzen.grenze_unten)}`
              },
              {
                label: "Gleitzone",
                value: `${euro(result.grenzen.grenze_unten)} – ${euro(result.grenzen.grenze_oben)}`
              }
            ]}
          />

          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
      )}
    </div>
  );
}
