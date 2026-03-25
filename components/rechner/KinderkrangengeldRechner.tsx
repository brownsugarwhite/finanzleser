"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KinderkrankentagParams, type KinderkrankentagResult } from "@/lib/calculators/kinderkrankengeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function KinderkrankentagRechner() {
  const [params, setParams] = useState<KinderkrankentagParams>({
    nettolohn_tag: 50,
    krankheitstage: 5,
    mehrere_kinder: false
  });

  const [result, setResult] = useState<KinderkrankentagResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Kinderkrankengeld-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Nettolohn pro Tag" name="nettolohn_tag" value={params.nettolohn_tag} onChange={(val) => setParams(p => ({ ...p, nettolohn_tag: Number(val) }))} einheit="€" />
        <RechnerInput label="Krankheitstage" name="krankheitstage" value={params.krankheitstage} onChange={(val) => setParams(p => ({ ...p, krankheitstage: Number(val) }))} einheit="Tage" />
        <RechnerCheckbox label="Mehrere Kinder" name="mehrere_kinder" checked={params.mehrere_kinder} onChange={(val) => setParams(p => ({ ...p, mehrere_kinder: val }))} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Kinderkrankengeld gesamt" value={euro(result.kinderkrankengeld_gesamt)} highlight={true} />
          <RechnerResultBox label="Jahresanspruch" value={`${result.jahresanspruch} Tage`} highlight={false} />
        </div>
        </div>
      )}
    </div>
  );
}
