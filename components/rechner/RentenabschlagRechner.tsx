"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenabschlagParams, type RentenabschlagResult } from "@/lib/calculators/rentenabschlag";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function RentenabschlagRechner() {
  const [params, setParams] = useState<RentenabschlagParams>({
    regelaltersgrenze_monate: 780, // 65 Jahre
    vorzeitiger_beginn_monate: 744, // 62 Jahre
    rentenpunkte: 45
  });

  const [result, setResult] = useState<RentenabschlagResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof RentenabschlagParams, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenabschlag-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Regelaltersgrenze"
          name="regelaltersgrenze_monate"
          value={params.regelaltersgrenze_monate}
          onChange={(val) => handleParamChange("regelaltersgrenze_monate", Number(val))}
          einheit="Monate (z.B. 65J = 780)"
          min={600}
          max={900}
        />

        <RechnerInput
          label="Vorzeitiger Rentenbeginn"
          name="vorzeitiger_beginn_monate"
          value={params.vorzeitiger_beginn_monate}
          onChange={(val) => handleParamChange("vorzeitiger_beginn_monate", Number(val))}
          einheit="Monate (z.B. 62J = 744)"
          min={600}
          max={900}
        />

        <RechnerInput
          label="Rentenpunkte"
          name="rentenpunkte"
          value={params.rentenpunkte}
          onChange={(val) => handleParamChange("rentenpunkte", Number(val))}
          einheit="Punkte"
          min={1}
          step={0.5}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Abschlag"
              value={`${result.abschlag_prozent}%`}
              highlight={true}
            />
            <RechnerResultBox
              label="Rente mit Abschlag"
              value={euro(result.rente_mit_abschlag)}
              highlight={true}
            />
            <RechnerResultBox
              label="Rentenminderung (absolut)"
              value={euro(result.rentenminderung_absolut)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Monate vorzeitig", value: `${result.monate_vorzeitig} Monate` },
              { label: "Abschlag pro Monat", value: "0,3%" },
              { label: "Gesamtabschlag", value: `${result.abschlag_prozent}%` },
              { label: "Rente ohne Abschlag", value: euro(result.rente_basis) }
            ]}
            footer={{ label: "Rente mit Abschlag monatlich", value: euro(result.rente_mit_abschlag) }}
          />

          <RechnerHinweis>
            Der Abschlag bei vorzeitiger Rente beträgt 0,3% pro Monat vor der Regelaltersgrenze.
            Der maximale Abschlag ist auf 14,4% begrenzt (48 Monate × 0,3%). Hinzu können
            Hinzuverdienstgrenzen gelten. Quelle: § 77 SGB VI.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
