"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type FlexrenteParams, type FlexrenteResult } from "@/lib/calculators/flexrente";
import { euro, prozent, punkte } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";

export default function FlexrenteRechner() {
  const [params, setParams] = useState<FlexrenteParams>({
    entgeltpunkte: 40,
    monateVorher: 0,
    monateNachher: 0,
  });

  const [result, setResult] = useState<FlexrenteResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Flexrenten-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Entgeltpunkte"
          name="entgeltpunkte"
          value={params.entgeltpunkte}
          onChange={(val) => setParams((p) => ({ ...p, entgeltpunkte: val }))}
          einheit="EP"
          min={0}
          step={0.5}
        />

        <RechnerInput
          label="Monate vor Regelaltersgrenze (Abschlag)"
          name="monateVorher"
          value={params.monateVorher}
          onChange={(val) => setParams((p) => ({ ...p, monateVorher: val }))}
          einheit="Monate"
          min={0}
          max={60}
          step={1}
        />

        <RechnerInput
          label="Monate nach Regelaltersgrenze (Zuschlag)"
          name="monateNachher"
          value={params.monateNachher}
          onChange={(val) => setParams((p) => ({ ...p, monateNachher: val }))}
          einheit="Monate"
          min={0}
          max={60}
          step={1}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <div className="rechner-results">
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Monatliche Rente"
              value={euro(result.renteMonatlich)}
              highlight={true}
            />
            <RechnerResultBox
              label="Zugangsfaktor"
              value={result.zugangsfaktor.toFixed(4)}
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Entgeltpunkte", value: punkte(params.entgeltpunkte) },
              { label: "Abschlag (vorzeitig)", value: prozent(result.abschlagProzent) },
              { label: "Zuschlag (spaeter)", value: prozent(result.zuschlagProzent) },
              { label: "Zugangsfaktor", value: result.zugangsfaktor.toFixed(4) },
            ]}
            footer={{ label: "Monatliche Rente", value: euro(result.renteMonatlich) }}
          />

          <RechnerHinweis>
            Abschlag: 0,3 % pro Monat vor Regelaltersgrenze (max. 14,4 %).
            Zuschlag: 0,5 % pro Monat nach Regelaltersgrenze.
            Quelle: §§ 77, 302 SGB VI (Flexirentengesetz).
          </RechnerHinweis>
        </div>
      )}
    </div>
  );
}
