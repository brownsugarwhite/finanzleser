"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type PendlerpauschaleParams, type PendlerpauschaleResult } from "@/lib/calculators/pendlerpauschale";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function PendlerpauschaleRechner() {
  const [params, setParams] = useState<PendlerpauschaleParams>({
    entfernungKm: 30,
    arbeitstage: 220,
  });

  const [result, setResult] = useState<PendlerpauschaleResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Pendlerpauschale-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Entfernung Wohnung - Arbeitsplatz (einfach)"
          name="entfernungKm"
          value={params.entfernungKm}
          onChange={(val) => setParams((p) => ({ ...p, entfernungKm: val }))}
          einheit="km"
          min={1}
          max={200}
        />
        <RechnerInput
          label="Arbeitstage pro Jahr"
          name="arbeitstage"
          value={params.arbeitstage}
          onChange={(val) => setParams((p) => ({ ...p, arbeitstage: val }))}
          einheit="Tage"
          min={1}
          max={365}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Pendlerpauschale/Jahr"
              value={euro(result.pauschale)}
              highlight={true}
            />
            <RechnerResultBox
              label="Steuererstattung (ca. 30 %)"
              value={euro(result.steuererstattungCa)}
            />
          </div>

          {result.deckelt && (
            <RechnerHinweis>
              Obergrenze erreicht: Die Pauschale ist auf 4.500 EUR/Jahr gedeckelt.
            </RechnerHinweis>
          )}

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Km 1-20 (0,30 EUR)", value: euro(result.km1Bis20) },
              { label: "Km ab 21 (0,38 EUR)", value: euro(result.km21Plus) },
              { label: "Pauschale gesamt", value: euro(result.pauschale) },
              { label: "Steuererstattung (ca.)", value: euro(result.steuererstattungCa) },
            ]}
          />

          <RechnerHinweis>
            Der erhoehte Satz von 0,38 EUR/km ab 21 km gilt bis 31.12.2026.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
