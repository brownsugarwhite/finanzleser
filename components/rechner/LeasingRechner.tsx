"use client";

import { useState, useEffect } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type LeasingParams, type LeasingResult } from "@/lib/calculators/leasing";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";

export default function LeasingRechner() {
  const [params, setParams] = useState<LeasingParams>({
    fahrzeugpreis: 30000,
    laufzeit_monate: 36,
    zinssatz_prozent: 3.5,
    restwert_prozent: 50
  });

  const [result, setResult] = useState<LeasingResult | null>(null);
  const rates = useRates();

  useEffect(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  const handleParamChange = (key: keyof LeasingParams, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Leasing-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Fahrzeugpreis"
          name="fahrzeugpreis"
          value={params.fahrzeugpreis}
          onChange={(val) => handleParamChange("fahrzeugpreis", Number(val))}
          einheit="€"
          min={1000}
          step={1000}
        />

        <RechnerInput
          label="Laufzeit"
          name="laufzeit_monate"
          value={params.laufzeit_monate}
          onChange={(val) => handleParamChange("laufzeit_monate", Number(val))}
          einheit="Monate"
          min={12}
          max={84}
        />

        <RechnerInput
          label="Zinssatz"
          name="zinssatz_prozent"
          value={params.zinssatz_prozent}
          onChange={(val) => handleParamChange("zinssatz_prozent", Number(val))}
          einheit="%"
          min={0}
          step={0.1}
        />

        <RechnerInput
          label="Restwert (% des Fahrzeugpreises)"
          name="restwert_prozent"
          value={params.restwert_prozent}
          onChange={(val) => handleParamChange("restwert_prozent", Number(val))}
          einheit="%"
          min={0}
          max={100}
          step={5}
        />
      </div>

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Leasing-Rate monatlich"
              value={euro(result.leasingrate_monatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Gesamtkosten"
              value={euro(result.gesamtkosten)}
              highlight={false}
            />
          </div>

          <h4 className="rechner-result-section-title">Kostenübersicht</h4>
          <RechnerResultTable
            rows={[
              { label: "Fahrzeugpreis", value: euro(result.fahrzeugpreis) },
              { label: "Restwert", value: euro(result.restwert) },
              { label: "Leasingfähiger Betrag", value: euro(result.fahrzeugpreis - result.restwert) },
              { label: "Laufzeit", value: `${result.laufzeit_monate} Monate` },
              { label: "Vergleich: Kauf-Rate/Monat", value: euro(result.vergleich_kauf_rate) }
            ]}
            footer={{ label: "Leasing-Rate monatlich", value: euro(result.leasingrate_monatlich) }}
          />

          <RechnerHinweis>
            Diese Berechnung basiert auf der Annuitätenmethode mit einem vereinfachten Modell.
            Tatsächliche Leasing-Raten können abhängig von Versicherung, Wartung und Kilometerkosten höher ausfallen.
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
