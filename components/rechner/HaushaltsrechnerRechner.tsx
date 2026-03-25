"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type HaushaltsrechnerParams, type HaushaltsrechnerResult } from "@/lib/calculators/haushaltsrechner";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function HaushaltsRechner() {
  const [params, setParams] = useState<HaushaltsrechnerParams>({
    monatliches_einkommen: 3500,
    miete: 1000,
    nebenkosten: 300,
    lebensmittel: 400,
    transport: 100,
    versicherungen: 200,
    sonstiges: 300
  });

  const [result, setResult] = useState<HaushaltsrechnerResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Haushalts-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Monatliches Einkommen" name="einkommen" value={params.monatliches_einkommen} onChange={(val) => setParams(p => ({ ...p, monatliches_einkommen: Number(val) }))} einheit="€" />
        <RechnerInput label="Miete" name="miete" value={params.miete} onChange={(val) => setParams(p => ({ ...p, miete: Number(val) }))} einheit="€" />
        <RechnerInput label="Nebenkosten" name="nebenkosten" value={params.nebenkosten} onChange={(val) => setParams(p => ({ ...p, nebenkosten: Number(val) }))} einheit="€" />
        <RechnerInput label="Lebensmittel" name="lebensmittel" value={params.lebensmittel} onChange={(val) => setParams(p => ({ ...p, lebensmittel: Number(val) }))} einheit="€" />
        <RechnerInput label="Transport" name="transport" value={params.transport} onChange={(val) => setParams(p => ({ ...p, transport: Number(val) }))} einheit="€" />
        <RechnerInput label="Versicherungen" name="versicherungen" value={params.versicherungen} onChange={(val) => setParams(p => ({ ...p, versicherungen: Number(val) }))} einheit="€" />
        <RechnerInput label="Sonstiges" name="sonstiges" value={params.sonstiges} onChange={(val) => setParams(p => ({ ...p, sonstiges: Number(val) }))} einheit="€" />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Sparbetrag/Monat" value={euro(result.sparkline)} highlight={true} />
          <RechnerResultBox label="Sparquote" value={`${result.sparquote}%`} highlight={false} />
          <RechnerHinweis>{result.hinweis}</RechnerHinweis>
        </div>
        </div>
      )}
    </div>
  );
}
