"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type Alg1Params, type Alg1Result } from "@/lib/calculators/alg1";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerSelect from "./ui/RechnerSelect";
import RechnerCheckbox from "./ui/RechnerCheckbox";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function Alg1Rechner() {
  const [params, setParams] = useState<Alg1Params>({
    brutto_monat: 2500,
    steuerklasse: 1,
    hat_kinder: false,
    versicherungsmonate: 12,
    alter: 35
  });

  const [result, setResult] = useState<Alg1Result | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof Alg1Params, value: number | boolean) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">ALG I-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Brutto-Verdienst monatlich"
          name="brutto_monat"
          value={params.brutto_monat}
          onChange={(val) => handleParamChange("brutto_monat", Number(val))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerSelect
          label="Steuerklasse"
          name="steuerklasse"
          value={String(params.steuerklasse)}
          onChange={(val) => handleParamChange("steuerklasse", Number(val) as 1 | 2 | 3 | 4 | 5 | 6)}
          options={[1, 2, 3, 4, 5, 6].map((sk) => ({
            label: `Klasse ${sk}`,
            value: String(sk)
          }))}
        />

        <RechnerCheckbox
          label="Hat Kinder"
          name="hat_kinder"
          checked={params.hat_kinder}
          onChange={(val) => handleParamChange("hat_kinder", val)}
        />

        <RechnerInput
          label="Versicherungsmonate (letzte 30 Monate)"
          name="versicherungsmonate"
          value={params.versicherungsmonate}
          onChange={(val) => handleParamChange("versicherungsmonate", Number(val))}
          einheit="Monate"
          min={0}
          max={30}
        />

        <RechnerInput
          label="Alter"
          name="alter"
          value={params.alter}
          onChange={(val) => handleParamChange("alter", Number(val))}
          einheit="Jahre"
          min={0}
          max={70}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="ALG I monatlich"
              value={euro(result.alg_monatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Anspruchsdauer"
              value={`${result.bezugsdauer_monate} Monate`}
              highlight={false}
            />
            <RechnerResultBox
              label="Gesamtbetrag"
              value={euro(result.gesamtbetrag)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Bemessungsentgelt", value: euro(result.bemessungsentgelt) },
              { label: "Leistungssatz", value: `${result.satz_prozent}%` },
              { label: "Leistungsentgelt täglich", value: euro(result.leistungsentgelt_taegig) },
              { label: "ALG täglich", value: euro(result.alg_taegig) }
            ]}
            footer={{ label: "ALG monatlich", value: euro(result.alg_monatlich) }}
          />

          {result.hinweis && (
            <RechnerHinweis>
              ⚠️ {result.hinweis}
            </RechnerHinweis>
          )}

          {!result.hinweis && (
            <RechnerHinweis>
              Die ALG I-Leistung beträgt {result.satz_prozent}% des Leistungsentgelts
              ({result.hat_kinder ? "mit Kindern" : "ohne Kinder"}). Anspruch für maximal {result.bezugsdauer_monate} Monate.
              Quelle: § 150 ff. SGB III.
            </RechnerHinweis>
          )}
        </div>
      )}
    </div>
  );
}
