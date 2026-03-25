"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type KirchensteuerParams, type KirchensteuerResult } from "@/lib/calculators/kirchensteuer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen"
];

export default function KirchensteuerRechner() {
  const [params, setParams] = useState<KirchensteuerParams>({
    lohnsteuer_jahr: 3000,
    bundesland: "Nordrhein-Westfalen"
  });

  const [result, setResult] = useState<KirchensteuerResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof KirchensteuerParams, value: number | string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Kirchensteuer-Rechner 2026</h3>

      
    <div className="rechner-inputs">
        <RechnerInput
          label="Lohnsteuer pro Jahr"
          name="lohnsteuer_jahr"
          value={params.lohnsteuer_jahr}
          onChange={(val) => handleParamChange("lohnsteuer_jahr", val)}
          einheit="€/Jahr"
          min={0}
        />

        <RechnerSelect
          label="Bundesland"
          name="bundesland"
          value={params.bundesland}
          onChange={(val) => handleParamChange("bundesland", val)}
          options={BUNDESLAENDER.map((bl) => ({ label: bl, value: bl }))}
        />
      </div>

      {result && (
        
    <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Kirchensteuer monatlich"
              value={euro(result.kirchensteuer_monat)}
              highlight={true}
            />
            <RechnerResultBox
              label="Kirchensteuer jährlich"
              value={euro(result.kirchensteuer_jahr)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Lohnsteuer pro Jahr", value: euro(result.lohnsteuer_jahr) },
              { label: "Kirchensteuer-Satz", value: `${result.satz_prozent}%` },
              { label: "Kirchensteuer pro Jahr", value: euro(result.kirchensteuer_jahr) }
            ]}
            footer={{ label: "Kirchensteuer monatlich", value: euro(result.kirchensteuer_monat) }}
          />

          <RechnerHinweis>
            Bayern und Baden-Württemberg erheben 8 % Kirchensteuer, alle anderen Bundesländer 9 %.
            Die Kirchensteuer wird auf die Lohnsteuer erhoben und ist für Kirchenmitglieder bindend.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
