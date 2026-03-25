"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type VerletztensgeldParams, type VerletztensgeldResult } from "@/lib/calculators/verletztengeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function VerletztensgeldRechner() {
  const [params, setParams] = useState<VerletztensgeldParams>({
    nettolohn_tag: 60,
    verletzungstage: 45
  });

  const [result, setResult] = useState<VerletztensgeldResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Verletztengeld-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Nettolohn pro Tag" name="netto_tag" value={params.nettolohn_tag} onChange={(val) => setParams(p => ({ ...p, nettolohn_tag: Number(val) }))} einheit="€" />
        <RechnerInput label="Verletzungstage" name="tage" value={params.verletzungstage} onChange={(val) => setParams(p => ({ ...p, verletzungstage: Number(val) }))} einheit="Tage" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Verletztengeld pro Tag" value={euro(result.verletztengeld_pro_tag)} highlight={true} />
          <RechnerResultBox label="Verletztengeld gesamt" value={euro(result.verletztengeld_gesamt)} highlight={false} />
        </div>
        </div>
      )}
    </div>
  );
}
