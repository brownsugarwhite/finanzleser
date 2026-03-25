"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type PendlerpauschaleParams, type PendlerpauschaleResult } from "@/lib/calculators/pendlerpauschale";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function PendlerpauschaleRechner() {
  const [params, setParams] = useState<PendlerpauschaleParams>({
    entfernung_km: 50,
    arbeitstage_jahr: 220,
    oepnv_kosten_jahr: undefined
  });

  const [result, setResult] = useState<PendlerpauschaleResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof PendlerpauschaleParams, value: number | undefined) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    
    <div className="rechner-container">
      <h3 className="rechner-title">Pendlerpauschale-Rechner 2026</h3>

      
    <div className="rechner-inputs">
        <RechnerInput
          label="Entfernung Wohnung - Arbeitsplatz (einfach)"
          name="entfernung_km"
          value={params.entfernung_km}
          onChange={(val) => handleParamChange("entfernung_km", val)}
          einheit="km"
          min={0}
        />

        <RechnerInput
          label="Arbeitstage pro Jahr"
          name="arbeitstage_jahr"
          value={params.arbeitstage_jahr}
          onChange={(val) => handleParamChange("arbeitstage_jahr", val)}
          einheit="Tage"
          min={1}
          max={365}
        />

        <RechnerInput
          label="ÖPNV-Jahreskosten (optional)"
          name="oepnv_kosten_jahr"
          value={params.oepnv_kosten_jahr || 0}
          onChange={(val) => handleParamChange("oepnv_kosten_jahr", val || undefined)}
          einheit="€"
          min={0}
          
        />
      </div>

      {result && (
        
    <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Werbungskosten/Jahr"
              value={euro(result.werbungskosten)}
              highlight={true}
            />
            <RechnerResultBox
              label="Werbungskosten/Monat"
              value={euro(result.werbungskosten_monat)}
              highlight={false}
            />
          </div>

          {result.deckelt && (
            <RechnerHinweis >
              ⚠️ <strong>Obergrenze erreicht:</strong> Die Pauschale ist auf 4.500 €/Jahr gedeckelt.
            </RechnerHinweis>
          )}

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Entfernung", value: `${result.entfernung_km} km` },
              { label: "Arbeitstage/Jahr", value: `${result.arbeitstage_jahr} Tage` },
              {
                label: "Pauschale (Sätze 2026)",
                value: `bis 20km: 0,30€ | ab 21km: 0,38€`
              },
              { label: "Pauschale roh", value: euro(result.pauschale_roh) },
              { label: "Anrechenbarer Betrag", value: euro(result.werbungskosten) }
            ]}
          />

          <h4 className="rechner-result-section-title">Steuerersparnis bei verschiedenen Grenzsteuersätzen</h4>
          <RechnerResultTable
            rows={[
              { label: "Bei 20% Grenzsteuersatz", value: euro(result.steuerersparnis_20) },
              { label: "Bei 30% Grenzsteuersatz", value: euro(result.steuerersparnis_30) },
              { label: "Bei 42% Grenzsteuersatz", value: euro(result.steuerersparnis_42) }
            ]}
          />

          <RechnerHinweis>
            Der erweiter Satz von 0,38 €/km (ab 21 km) gilt noch bis 31.12.2026. Ab 2027 reduziert sich der
            Satz auf 0,36 €/km und dann bis 2026 auf 0,30 €/km.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
