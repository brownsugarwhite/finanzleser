"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type GruendungszuschussParams, type GruendungszuschussResult } from "@/lib/calculators/gruendungszuschuss";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function GruendungszuschussRechner() {
  const [params, setParams] = useState<GruendungszuschussParams>({
    alg1_anspruchswert: 450,
    gruendungskapital_vorgesehen: 10000,
    eigenmittel_vorhanden: 3000
  });

  const [result, setResult] = useState<GruendungszuschussResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Gründungszuschuss-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="ALG1-Anspruchswert" name="alg1" value={params.alg1_anspruchswert} onChange={(val) => setParams(p => ({ ...p, alg1_anspruchswert: Number(val) }))} einheit="€" />
        <RechnerInput label="Gründungskapital geplant" name="kapital" value={params.gruendungskapital_vorgesehen} onChange={(val) => setParams(p => ({ ...p, gruendungskapital_vorgesehen: Number(val) }))} einheit="€" />
        <RechnerInput label="Eigenmittel vorhanden" name="eigenmittel" value={params.eigenmittel_vorhanden} onChange={(val) => setParams(p => ({ ...p, eigenmittel_vorhanden: Number(val) }))} einheit="€" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Gründungszuschuss/Monat" value={euro(result.gruendungszuschuss_regelmaessig)} highlight={true} />
          <RechnerResultBox label="6 Monate" value={euro(result.gruendungszuschuss_gesamt_6monate)} highlight={false} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
