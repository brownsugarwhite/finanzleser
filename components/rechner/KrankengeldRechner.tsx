"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type Krankengeldarams, type KrangeldResult } from "@/lib/calculators/krankengeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function KrangeldRechner() {
  const [params, setParams] = useState<Krankengeldarams>({
    nettolohn_tag: 60,
    krankheitstage: 14
  });

  const [result, setResult] = useState<KrangeldResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Krankengeld-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Nettolohn pro Tag" name="nettolohn_tag" value={params.nettolohn_tag} onChange={(val) => setParams(p => ({ ...p, nettolohn_tag: Number(val) }))} einheit="€" />
        <RechnerInput label="Krankheitstage" name="krankheitstage" value={params.krankheitstage} onChange={(val) => setParams(p => ({ ...p, krankheitstage: Number(val) }))} einheit="Tage" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Krankengeld pro Tag" value={euro(result.krankengeld_pro_tag)} highlight={true} />
          <RechnerResultBox label="Krankengeld gesamt" value={euro(result.krankengeld_gesamt)} highlight={false} />
        </div>
        </div>
      )}
    </div>
  );
}
