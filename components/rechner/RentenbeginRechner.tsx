"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenbeginParams, type RentenbeginResult } from "@/lib/calculators/rentenbeginn";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function RentenbeginRechner() {
  const today = new Date();
  const defaultDate = new Date(today.getFullYear() - 65, today.getMonth(), 15);
  const defaultDateString = defaultDate.toISOString().split("T")[0];

  const [params, setParams] = useState<RentenbeginParams>({
    geburtsdatum: defaultDateString,
    rentenpunkte: 45
  });

  const [result, setResult] = useState<RentenbeginResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenbeginn-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Geburtsdatum" name="geburt" value={params.geburtsdatum} onChange={(val: number) => setParams((p: RentenbeginParams) => ({ ...p, geburtsdatum: String(val) }))} />
        <RechnerInput label="Rentenpunkte" name="punkte" value={params.rentenpunkte} onChange={(val) => setParams((p: RentenbeginParams) => ({ ...p, rentenpunkte: Number(val) }))} einheit="Punkte" step={0.1} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Alter heute" value={`${result.alter_heute} Jahre`} highlight={false} />
          <RechnerResultBox label="Regelaltersgrenze" value={`${result.regelaltersgrenze} Jahre`} highlight={false} />
          <RechnerResultBox label="Rente (Regelalter)" value={euro(result.rente_monatlich_regelalter)} highlight={true} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
