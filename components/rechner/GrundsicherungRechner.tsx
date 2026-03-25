"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type GrundsicherungParams, type GrundsicherungResult } from "@/lib/calculators/grundsicherung";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";

export default function GrundsicherungRechner() {
  const [params, setParams] = useState<GrundsicherungParams>({
    alterstyp: "ueber65",
    haushaltstyp: "allein",
    miete: 800,
    vermogen: 5000,
    einkommen: 0
  });

  const [result, setResult] = useState<GrundsicherungResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Grundsicherung-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect label="Alterstyp" name="alterstyp" value={params.alterstyp} onChange={(val) => setParams(p => ({ ...p, alterstyp: val as any }))} options={[{value: "under65", label: "Erwerbstätig"}, {value: "ueber65", label: "Über 65 Jahre"}, {value: "erwerbsunfaehig", label: "Erwerbsunfähig"}]} />
        <RechnerInput label="Miete (monatlich)" name="miete" value={params.miete} onChange={(val) => setParams(p => ({ ...p, miete: Number(val) }))} einheit="€" />
        <RechnerInput label="Vermögen" name="vermogen" value={params.vermogen} onChange={(val) => setParams(p => ({ ...p, vermogen: Number(val) }))} einheit="€" />
        <RechnerInput label="Einkommen (monatlich)" name="einkommen" value={params.einkommen} onChange={(val) => setParams(p => ({ ...p, einkommen: Number(val) }))} einheit="€" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Grundsicherung/Monat" value={euro(result.grundsicherung)} highlight={true} />
          <RechnerResultBox label="Regelbedarf" value={euro(result.regelbedarf)} highlight={false} />
        </div>
        </div>
      )}
    </div>
  );
}
