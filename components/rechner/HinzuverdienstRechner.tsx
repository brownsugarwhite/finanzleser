"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type HinzuverdienstParams, type HinzuverdienstResult } from "@/lib/calculators/hinzuverdienst";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function HinzuverdienstRechner() {
  const [params, setParams] = useState<HinzuverdienstParams>({
    alg1_anspruchswert: 450,
    hinzuverdienst_monatlich: 300,
    ist_rentnerin: false
  });

  const [result, setResult] = useState<HinzuverdienstResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Hinzuverdienst-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="ALG1-Anspruchswert" name="alg1" value={params.alg1_anspruchswert} onChange={(val) => setParams(p => ({ ...p, alg1_anspruchswert: Number(val) }))} einheit="€" />
        <RechnerInput label="Hinzuverdienst monatlich" name="hinzuverdienst" value={params.hinzuverdienst_monatlich} onChange={(val) => setParams(p => ({ ...p, hinzuverdienst_monatlich: Number(val) }))} einheit="€" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="ALG1 ausgezahlt" value={euro(result.alg1_ausgezahlt)} highlight={true} />
          <RechnerResultBox label="Effektiver Steuersatz" value={`${result.effektiver_satz}%`} highlight={false} />
        </div>
        </div>
      )}
    </div>
  );
}
