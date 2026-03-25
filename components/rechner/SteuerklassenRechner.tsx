"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type SteuerklassenParams, type SteuerklassenResult } from "@/lib/calculators/steuerklassen";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";

export default function SteuerklassenRechner() {
  const [params, setParams] = useState<SteuerklassenParams>({
    monatsBrutto: 3500,
    steuerklasse: 1,
    kinder: 0
  });

  const [result, setResult] = useState<SteuerklassenResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Steuerklassen-Rechner 2026</h3>
      
    <div className="rechner-inputs">
        <RechnerInput label="Monatliches Brutto" name="brutto" value={params.monatsBrutto} onChange={(val) => setParams(p => ({ ...p, monatsBrutto: Number(val) }))} einheit="€" />
        <RechnerSelect label="Steuerklasse" name="klasse" value={params.steuerklasse.toString()} onChange={(val) => setParams(p => ({ ...p, steuerklasse: Number(val) }))} options={[{value: "1", label: "I - Ledig"}, {value: "2", label: "II - Alleinerziehend"}, {value: "3", label: "III - Verheiratet höheres Einkommen"}, {value: "4", label: "IV - Verheiratet ähnliches Einkommen"}, {value: "5", label: "V - Verheiratet (mit III)"}, {value: "6", label: "VI - Mehrfachbesteuerung"}]} />
      </div>
      {result && (
    <div className="rechner-results">
          <div className="rechner-result-boxes">
          <RechnerResultBox label="Lohnsteuer/Monat" value={euro(result.lohnsteuer_monatlich)} highlight={true} />
          <RechnerResultBox label="Netto/Monat" value={euro(result.netto_monatlich)} highlight={false} />
          <h4 className="rechner-result-section-title">Details</h4>
          <RechnerResultTable rows={[{ label: "Steuerklasse", value: result.steuerklasse_beschreibung }, { label: "Effektiver Steuersatz", value: `${result.effektiver_steuersatz}%` }]} />
        </div>
        </div>
      )}
    </div>
  );
}
