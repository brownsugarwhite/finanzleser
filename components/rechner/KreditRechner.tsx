"use client";

import { useState, useCallback, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KreditParams, type KreditResult } from "@/lib/calculators/kredit";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function KreditRechner() {
  const [params, setParams] = useState<KreditParams>({
    kreditsumme: 10000,
    laufzeitMonate: 60,
    jahreszins: 5.0,
  });

  const [result, setResult] = useState<KreditResult | null>(null);

  const rates = useRates();

  // Calculate on params change
  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = useCallback((key: keyof KreditParams, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Kreditrechner</h3>

      {/* Input Section */}
      <div className="rechner-inputs">
        <RechnerInput
          label="Kreditbetrag"
          name="kreditsumme"
          value={params.kreditsumme}
          onChange={(val) => handleParamChange("kreditsumme", val)}
          einheit="€"
          step={500}
          min={100}
        />

        <RechnerInput
          label="Laufzeit"
          name="laufzeitMonate"
          value={params.laufzeitMonate}
          onChange={(val) => handleParamChange("laufzeitMonate", val)}
          einheit="Monate"
          step={6}
          min={1}
        />

        <RechnerInput
          label="Jahreszins"
          name="jahreszins"
          value={params.jahreszins}
          onChange={(val) => handleParamChange("jahreszins", val)}
          einheit="%"
          step={0.1}
          min={0}
        />
      </div>

      {/* Results Section */}
      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatsrate" value={euro(result.monatsrate)} highlight={true} />
            <RechnerResultBox
              label="Gesamtzinsen"
              value={euro(result.gesamtzinsen)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Zusammenfassung</h4>
          <RechnerResultTable
            rows={[
              { label: "Kreditbetrag", value: euro(result.kreditsumme) },
              { label: "Gesamtzinsen", value: euro(result.gesamtzinsen) },
              { label: "Zu zahlender Betrag", value: euro(result.gesamtbetrag) },
            ]}
          />

          <RechnerHinweis>
            Diese Berechnung erfolgt ohne Gewähr und stellt nur eine Näherung dar. Gebühren,
            Provisionen und weitere Kosten sind nicht enthalten.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
