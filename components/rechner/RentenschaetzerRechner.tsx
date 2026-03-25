"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenschaetzerParams, type RentenschaetzerResult } from "@/lib/calculators/rentenschaetzer";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function RentenschaetzerRechner() {
  const [params, setParams] = useState<RentenschaetzerParams>({
    monatliches_einkommen: 2500,
    versicherungsjahre: 40,
    bundesland: "west"
  });

  const [result, setResult] = useState<RentenschaetzerResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof RentenschaetzerParams, value: number | string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenschätzer 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Durchschnittliches monatliches Einkommen"
          name="monatliches_einkommen"
          value={params.monatliches_einkommen}
          onChange={(val) => handleParamChange("monatliches_einkommen", Number(val))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Versicherungsjahre"
          name="versicherungsjahre"
          value={params.versicherungsjahre}
          onChange={(val) => handleParamChange("versicherungsjahre", Number(val))}
          einheit="Jahre"
          min={1}
          max={67}
          step={1}
        />

        <RechnerSelect
          label="Rentenwert Region"
          name="bundesland"
          value={params.bundesland}
          onChange={(val) => handleParamChange("bundesland", val as "west" | "ost")}
          options={[
            { label: "West", value: "west" },
            { label: "Ost", value: "ost" }
          ]}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Geschätzte monatliche Rente"
              value={euro(result.rente_monatlich_schaetzer)}
              highlight={true}
            />
            <RechnerResultBox
              label="Rentenpunkte"
              value={String(result.rentenpunkte_schaetzer)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Monatliches Einkommen", value: euro(result.monatliches_einkommen) },
              { label: "Versicherungsjahre", value: `${result.versicherungsjahre} Jahre` },
              { label: "Rentenpunkte (geschätzt)", value: String(result.rentenpunkte_schaetzer) }
            ]}
            footer={{ label: "Monatliche Rente (geschätzt)", value: euro(result.rente_monatlich_schaetzer) }}
          />

          <RechnerHinweis>
            ℹ️ {result.hinweis}
          </RechnerHinweis>

          <RechnerHinweis>
            Diese Schätzung basiert auf Durchschnittseinkommen und konstanten Versicherungszeiten.
            Lücken oder unterdurchschnittliche Einkommen reduzieren die Rente. Nutze die offizielle
            Rentenauskunft der Deutsche Rentenversicherung für präzise Werte.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
