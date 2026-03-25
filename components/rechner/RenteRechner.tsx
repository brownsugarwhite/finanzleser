"use client";

import { useState, useEffect } from "react";
import { berechne, type RenteParams, type RenteResult } from "@/lib/calculators/rente";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function RenteRechner() {
  const [params, setParams] = useState<RenteParams>({
    rentenpunkte: 40,
    renteneintrittsalter: 67,
  });

  const [result, setResult] = useState<RenteResult | null>(null);

  useEffect(() => {
    setResult(berechne(params));
  }, [params]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Renten-Rechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Rentenpunkte"
          name="rentenpunkte"
          value={params.rentenpunkte}
          onChange={(val) => setParams((prev) => ({ ...prev, rentenpunkte: val }))}
          einheit="Punkte"
          step={1}
          min={0}
        />

        <RechnerInput
          label="Renteneintrittsalter"
          name="renteneintrittsalter"
          value={params.renteneintrittsalter}
          onChange={(val) => setParams((prev) => ({ ...prev, renteneintrittsalter: val }))}
          einheit="Jahre"
          step={1}
          min={50}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Monatliche Rente" value={euro(result.monatlicheRente)} highlight={true} />
            <RechnerResultBox label="Jährliche Rente" value={euro(result.jaehrlicheRente)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Rentenpunkte", value: result.rentenpunkte.toFixed(2) },
              { label: "Renteneintrittsalter", value: `${result.renteneintrittsalter} Jahre` },
              { label: "Monatliche Rente", value: euro(result.monatlicheRente) },
              { label: "Jährliche Rente", value: euro(result.jaehrlicheRente) },
            ]}
          />

          <RechnerHinweis>
            Die Deutsche Rentenversicherung berechnet die Rente nach einem komplexen Punktesystem.
            Dies ist eine vereinfachte Berechnung. Für genaue Informationen wenden Sie sich bitte
            an die Deutsche Rentenversicherung.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
