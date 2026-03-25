"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type MindestlohnParams, type MindestlohnResult } from "@/lib/calculators/mindestlohn";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function MindestlohnRechner() {
  const [params, setParams] = useState<MindestlohnParams>({
    stundenlohn: 13.9,
    stunden_woche: 40
  });

  const [result, setResult] = useState<MindestlohnResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof MindestlohnParams, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Mindestlohn-Rechner 2026</h3>

      
    <div className="rechner-inputs">
        <RechnerInput
          label="Stundenlohn"
          name="stundenlohn"
          value={params.stundenlohn}
          onChange={(val) => handleParamChange("stundenlohn", val)}
          einheit="€/Std."
          min={0}
          step={0.01}
        />

        <RechnerInput
          label="Wochenstunden"
          name="stunden_woche"
          value={params.stunden_woche}
          onChange={(val) => handleParamChange("stunden_woche", val)}
          einheit="Std./Woche"
          min={0}
          max={60}
        />
      </div>

      {result && (
        
    <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatliches Einkommen"
              value={euro(result.brutto_monat)}
              highlight={false}
            />
            <RechnerResultBox
              label="Gesetzlicher Mindestlohn"
              value={euro(result.mindest_monat)}
              highlight={result.eingehalten}
            />
          </div>

          <h4 className="rechner-result-section-title">Ergebnis</h4>
          {result.eingehalten ? (
            <RechnerHinweis >
              ✅ <strong>Mindestlohn eingehalten!</strong> Der Stundenlohn liegt über dem gesetzlichen Mindestlohn.
            </RechnerHinweis>
          ) : (
            <RechnerHinweis >
              ⚠️ <strong>Mindestlohn unterschritten!</strong> Der Stundenlohn liegt unter dem gesetzlichen Mindestlohn.
            </RechnerHinweis>
          )}

          <RechnerResultTable
            rows={[
              { label: "Stundenlohn", value: `${result.stundenlohn.toFixed(2)} €/Std.` },
              { label: "Stunden pro Woche", value: `${result.stunden_woche} Std.` },
              { label: "Stunden pro Monat (Ø)", value: `${result.stunden_monat.toFixed(0)} Std.` },
              { label: "Monatliches Einkommen", value: euro(result.brutto_monat) },
              { label: "Gesetzlicher Mindestlohn (monatlich)", value: euro(result.mindest_monat) }
            ]}
            footer={{
              label: "Differenz",
              value: `${result.differenz >= 0 ? "+" : ""}${euro(result.differenz)}`
            }}
          />

          <RechnerHinweis>
            Der Mindestlohn beträgt 2026: {result.mindest_monat / (result.stunden_woche * 4.348) > 0 ? `${(result.mindest_monat / (result.stunden_woche * 4.348)).toFixed(2)}` : "?"} €/Stunde. Berechnungsgrundlage: 4,348 Wochen pro Monat.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
