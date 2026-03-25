"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type UebergangssgeldParams, type UebergangssgeldResult } from "@/lib/calculators/uebergangsgeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function UebergangssgeldRechner() {
  const [params, setParams] = useState<UebergangssgeldParams>({
    nettolohn_tag: 60,
    leistungstage: 30
  });

  const [result, setResult] = useState<UebergangssgeldResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Übergangsgeld-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Nettolohn pro Tag" name="netto_tag" value={params.nettolohn_tag} onChange={(val) => setParams(p => ({ ...p, nettolohn_tag: Number(val) }))} einheit="€" />
        <RechnerInput label="Leistungstage" name="tage" value={params.leistungstage} onChange={(val) => setParams(p => ({ ...p, leistungstage: Number(val) }))} einheit="Tage" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Übergangsgeld pro Tag" value={euro(result.uebergangsgeld_pro_tag)} highlight={true} />
          <RechnerResultBox label="Übergangsgeld gesamt" value={euro(result.uebergangsgeld_gesamt)} highlight={false} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
