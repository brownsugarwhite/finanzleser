"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type WitwenrenteParams, type WitwenrenteResult } from "@/lib/calculators/witwenrente";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function WitwenrenteRechner() {
  const [params, setParams] = useState<WitwenrenteParams>({
    rentenpunkte_verstorbener: 45,
    ist_grosse_witwenrente: true,
    alter_witwe: 50
  });

  const [result, setResult] = useState<WitwenrenteResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Witwenrente-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Rentenpunkte Verstorbener" name="rentenpunkte" value={params.rentenpunkte_verstorbener} onChange={(val) => setParams(p => ({ ...p, rentenpunkte_verstorbener: Number(val) }))} einheit="Punkte" step={0.1} />
        <RechnerInput label="Alter Hinterbliebener" name="alter" value={params.alter_witwe} onChange={(val) => setParams(p => ({ ...p, alter_witwe: Number(val) }))} einheit="Jahre" />
        <RechnerCheckbox label="Große Witwenrente" name="gross" checked={params.ist_grosse_witwenrente} onChange={(val) => setParams(p => ({ ...p, ist_grosse_witwenrente: val }))} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Witwenrente monatlich" value={euro(result.witwenrente_monatlich)} highlight={true} />
          <RechnerResultBox label="Satz" value={`${result.satz_witwenrente}%`} highlight={false} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
