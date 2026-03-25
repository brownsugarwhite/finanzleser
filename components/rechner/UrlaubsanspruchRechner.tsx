"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type UrlaubsanspruchParams, type UrlaubsanspruchResult } from "@/lib/calculators/urlaubsanspruch";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function UrlaubsanspruchRechner() {
  const [params, setParams] = useState<UrlaubsanspruchParams>({
    arbeitstage_jahr: 220,
    beschaeftigungsmonate: 12,
    hat_tarifvertrag: false
  });

  const [result, setResult] = useState<UrlaubsanspruchResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Urlaubsanspruch-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Arbeitstage pro Jahr" name="arbeitstage" value={params.arbeitstage_jahr} onChange={(val) => setParams(p => ({ ...p, arbeitstage_jahr: Number(val) }))} einheit="Tage" />
        <RechnerInput label="Beschäftigungsmonate" name="monate" value={params.beschaeftigungsmonate} onChange={(val) => setParams(p => ({ ...p, beschaeftigungsmonate: Number(val) }))} einheit="Monate" min={1} max={12} />
        <RechnerCheckbox label="Tarifvertrag vorhanden" name="tarifvertrag" checked={params.hat_tarifvertrag} onChange={(val) => setParams(p => ({ ...p, hat_tarifvertrag: val }))} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Urlaubsanspruch" value={`${result.anspruch} Tage`} highlight={true} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
