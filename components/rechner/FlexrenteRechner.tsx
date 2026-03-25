"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import {
  berechne,
  type FlexrenteParams,
  type FlexrenteResult
} from "@/lib/calculators/flexrente";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";

export default function FlexrenteRechner() {
  const [params, setParams] = useState<FlexrenteParams>({
    rentenpunkte: 45,
    monate_vorzeitig_oder_spaeter: 0
  });

  const [result, setResult] = useState<FlexrenteResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Flexrenten-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Rentenpunkte"
          name="rentenpunkte"
          value={params.rentenpunkte}
          onChange={(val) => {
            setParams((p) => ({ ...p, rentenpunkte: Number(val) }));
          }}
          einheit="Punkte"
          min={0}
          step={0.1}
        />

        <RechnerInput
          label="Monate vorzeitig (negativ) oder später (positiv)"
          name="monate"
          value={params.monate_vorzeitig_oder_spaeter}
          onChange={(val) => {
            setParams((p) => ({ ...p, monate_vorzeitig_oder_spaeter: Number(val) }));
          }}
          einheit="Monate"
          min={-48}
          max={120}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatliche Rente"
              value={euro(result.rente_monatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label={
                result.type === "vorzeitig"
                  ? "Abschlag"
                  : result.type === "spaeter"
                    ? "Zuschlag"
                    : "Zugangsfaktor"
              }
              value={`${result.factor_prozent}%`}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              {
                label: "Basis-Rente (Rentenpunkte × Rentenwert)",
                value: euro(result.rente_basis)
              },
              {
                label: `${result.type === "vorzeitig" ? "Abschlag" : result.type === "spaeter" ? "Zuschlag" : "Faktor"}`,
                value: `${result.factor_prozent}%`
              }
            ]}
            footer={{
              label: "Rente mit Zu-/Abschlag",
              value: euro(result.rente_monatlich)
            }}
          />
        </div>
      )}
    </div>
  );
}
