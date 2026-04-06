"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type GruendungszuschussParams, type GruendungszuschussResult } from "@/lib/calculators/gruendungszuschuss";
import { euro } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function GruendungszuschussRechner() {
  const [params, setParams] = useState<GruendungszuschussParams>({
    algMonatlich: 1200,
  });

  const [result, setResult] = useState<GruendungszuschussResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Gruendungszuschuss-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="ALG I monatlich"
          name="algMonatlich"
          value={params.algMonatlich}
          onChange={(val) => setParams({ algMonatlich: val })}
          einheit="EUR"
          min={0}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Gesamtfoerderung"
              value={euro(result.gesamtFoerderung)}
              highlight={true}
            />
            <RechnerResultBox
              label="Phase 1 / Monat"
              value={euro(result.phase1Monatlich)}
            />
          </div>

          <h4 className="rechner-result-section-title">Phase 1 (6 Monate)</h4>
          <RechnerResultTable
            rows={[
              { label: "ALG I + Pauschale (300 EUR)", value: euro(result.phase1Monatlich) },
              { label: "Phase 1 gesamt", value: euro(result.phase1Gesamt) },
            ]}
          />

          <h4 className="rechner-result-section-title">Phase 2 (9 Monate)</h4>
          <RechnerResultTable
            rows={[
              { label: "Pauschale / Monat", value: euro(result.phase2Monatlich) },
              { label: "Phase 2 gesamt", value: euro(result.phase2Gesamt) },
            ]}
          />

          <RechnerHinweis>
            Phase 1: ALG I + 300 EUR Pauschale fuer 6 Monate.
            Phase 2: 300 EUR Pauschale fuer weitere 9 Monate (Bewilligung auf Antrag).
            Grundlage: Paragraph 93 SGB III.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
