"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type StuerundererstattungParams, type StuerundererstattungResult } from "@/lib/calculators/steuererstattung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function SteuererstattungRechner() {
  const [params, setParams] = useState<StuerundererstattungParams>({
    jahresbrutto: 45000,
    steuervorauszahlung: 7500,
    steuerklasse: 1
  });

  const [result, setResult] = useState<StuerundererstattungResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Steuererstat tung-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Jahresbrutto" name="brutto" value={params.jahresbrutto} onChange={(val) => setParams(p => ({ ...p, jahresbrutto: Number(val) }))} einheit="€" />
        <RechnerInput label="Steuervorauszahlung" name="vorauszahlung" value={params.steuervorauszahlung} onChange={(val) => setParams(p => ({ ...p, steuervorauszahlung: Number(val) }))} einheit="€" />
        <RechnerSelect label="Steuerklasse" name="klasse" value={params.steuerklasse.toString()} onChange={(val) => setParams(p => ({ ...p, steuerklasse: Number(val) }))} options={[{value: "1", label: "I"}, {value: "2", label: "II"}, {value: "3", label: "III"}, {value: "4", label: "IV"}, {value: "5", label: "V"}, {value: "6", label: "VI"}]} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Steuererstat tung" value={euro(result.steuererstattung)} highlight={true} />
          <RechnerResultBox label="Ungefähre Jahressteuer" value={euro(result.ungefaehre_jahressteuer)} highlight={false} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
