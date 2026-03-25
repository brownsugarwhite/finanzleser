"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KalteprogressionParams, type KalteprogressionResult } from "@/lib/calculators/kalteprogression";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function KalteprogressionsRechner() {
  const [params, setParams] = useState<KalteprogressionParams>({
    brutto_vorjahr: 50000,
    steigerung_prozent: 3
  });

  const [result, setResult] = useState<KalteprogressionResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Kalte Progression-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Brutto Vorjahr" name="brutto_vorjahr" value={params.brutto_vorjahr} onChange={(val) => setParams(p => ({ ...p, brutto_vorjahr: Number(val) }))} einheit="€" />
        <RechnerInput label="Gehaltserhöhung" name="steigerung" value={params.steigerung_prozent} onChange={(val) => setParams(p => ({ ...p, steigerung_prozent: Number(val) }))} einheit="%" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Brutto neu" value={euro(result.brutto_nachher)} highlight={true} />
          <RechnerResultBox label="Kalte Progression" value={`${result.kalte_progression_prozent}%`} highlight={false} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
