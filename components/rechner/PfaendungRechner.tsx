"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type PfaendungParams, type PfaendungResult } from "@/lib/calculators/pfaendung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function PfaendungRechner() {
  const [params, setParams] = useState<PfaendungParams>({
    nettoEntgelt: 2000,
    schuldenart: "forderung_allgemein"
  });

  const [result, setResult] = useState<PfaendungResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Pfändung-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Nettoeinkommen monatlich" name="netto" value={params.nettoEntgelt} onChange={(val) => setParams(p => ({ ...p, nettoEntgelt: Number(val) }))} einheit="€" />
        <RechnerSelect label="Schuldenart" name="schuldenart" value={params.schuldenart} onChange={(val) => setParams(p => ({ ...p, schuldenart: val as any }))} options={[{value: "unterhaltsschuld", label: "Unterhaltsschuld"}, {value: "forderung_allgemein", label: "Allgemeine Forderung"}]} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Pfandbar" value={euro(result.pfaendbar)} highlight={true} />
          <RechnerResultBox label="Tatsächliche Pfändung" value={euro(result.tatsaechliche_pfaendung)} highlight={false} />
        </div>
        </div>
      )}
    </div>
  );
}
