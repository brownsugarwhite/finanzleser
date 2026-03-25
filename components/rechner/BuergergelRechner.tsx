"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type BuergergeldelParams,
  type BuergergeldelResult
} from "@/lib/calculators/buergergeld";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function BuergergelRechner() {
  const [params, setParams] = useState<BuergergeldelParams>({
    haushaltstyp: "allein",
    kinder: {},
    warmmiete: 800,
    anrechenbares_einkommen: 0
  });

  const [result, setResult] = useState<BuergergeldelResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: string, value: any) => {
    setParams((prev) => {
      if (key === "haushaltstyp" || key === "warmmiete" || key === "anrechenbares_einkommen") {
        return { ...prev, [key]: value };
      }
      return prev;
    });
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Bürgergeld-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerSelect
          label="Haushaltstyp"
          name="haushaltstyp"
          value={params.haushaltstyp}
          onChange={(val) => handleParamChange("haushaltstyp", val)}
          options={[
            { value: "allein", label: "Alleinstehend" },
            { value: "paar", label: "Ehepaar" },
            { value: "allein_elternteil", label: "Alleinerziehend" },
            { value: "paar_eltern", label: "Ehepaar mit Kind" }
          ]}
        />

        <RechnerInput
          label="Warmmiete (Unterkunftskosten)"
          name="warmmiete"
          value={params.warmmiete}
          onChange={(val) => handleParamChange("warmmiete", val)}
          einheit="€"
          min={0}
        />

        <RechnerInput
          label="Anrechenbares Einkommen (monatlich)"
          name="anrechenbares_einkommen"
          value={params.anrechenbares_einkommen || 0}
          onChange={(val) => handleParamChange("anrechenbares_einkommen", val)}
          einheit="€"
          min={0}
          
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Bürgergeld (monatlich)"
              value={euro(result.buergergeld)}
              highlight={true}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Regelbedarf", value: euro(result.regelbedarf) },
              { label: "Kosten der Unterkunft", value: euro(result.warmmiete) },
              {
                label: "Gesamtbedarf",
                value: euro(result.gesamtBedarf)
              },
              {
                label: "Anrechenbares Einkommen",
                value: `−${euro(result.einkommenAnrechenbar)}`
              }
            ]}
            footer={{ label: "Bürgergeld", value: euro(result.buergergeld) }}
          />

          <RechnerHinweis>
            Richtwert. Die tatsächliche Bewilligung erfolgt durch das Jobcenter unter Berücksichtigung
            aller Einkommens- und Vermögensverhältnisse. Grundlage: §§ 19–23 SGB II.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
