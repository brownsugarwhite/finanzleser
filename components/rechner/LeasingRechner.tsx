"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type LeasingParams, type LeasingResult } from "@/lib/calculators/leasing";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function LeasingRechner() {
  const [params, setParams] = useState<LeasingParams>({
    kaufpreis: 30000,
    laufzeitMonate: 36,
    restwertProzent: 40,
    zinssatzPa: 4.0,
    anzahlung: 0,
  });

  const [result, setResult] = useState<LeasingResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Leasingrechner</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Kaufpreis"
          name="kaufpreis"
          value={params.kaufpreis}
          onChange={(val) => setParams((prev) => ({ ...prev, kaufpreis: val }))}
          einheit="€"
          step={1000}
          min={0}
        />
        <RechnerInput
          label="Laufzeit"
          name="laufzeitMonate"
          value={params.laufzeitMonate}
          onChange={(val) => setParams((prev) => ({ ...prev, laufzeitMonate: val }))}
          einheit="Monate"
          step={6}
          min={12}
          max={84}
        />
        <RechnerInput
          label="Restwert"
          name="restwertProzent"
          value={params.restwertProzent}
          onChange={(val) => setParams((prev) => ({ ...prev, restwertProzent: val }))}
          einheit="%"
          step={5}
          min={0}
          max={100}
        />
        <RechnerInput
          label="Zinssatz p.a."
          name="zinssatzPa"
          value={params.zinssatzPa}
          onChange={(val) => setParams((prev) => ({ ...prev, zinssatzPa: val }))}
          einheit="%"
          step={0.1}
          min={0}
        />
        <RechnerInput
          label="Anzahlung"
          name="anzahlung"
          value={params.anzahlung}
          onChange={(val) => setParams((prev) => ({ ...prev, anzahlung: val }))}
          einheit="€"
          step={500}
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox label="Leasingrate / Monat" value={euro(result.leasingrate)} highlight />
            <RechnerResultBox label="Gesamtkosten" value={euro(result.gesamtKosten)} />
          </div>

          <RechnerResultTable
            rows={[
              { label: "Kaufpreis", value: euro(params.kaufpreis) },
              { label: "Anzahlung", value: euro(params.anzahlung) },
              { label: "Restwert", value: euro(result.restwert) },
              { label: "Laufzeit", value: `${params.laufzeitMonate} Monate` },
              { label: "Zinssatz p.a.", value: prozent(params.zinssatzPa) },
              { label: "Leasingrate / Monat", value: euro(result.leasingrate) },
              { label: "Zinskosten", value: euro(result.zinskosten) },
              { label: "Gesamtkosten", value: euro(result.gesamtKosten) },
            ]}
          />

          <RechnerHinweis>
            Diese Berechnung basiert auf der Annuitätenmethode. Tatsächliche Leasing-Raten
            können durch Versicherung, Wartung und Kilometerkosten abweichen.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
