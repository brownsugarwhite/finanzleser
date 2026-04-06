"use client";

import { useState, useCallback } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { berechne, type RentenabschlagParams, type RentenabschlagResult } from "@/lib/calculators/rentenabschlag";
import { euro, prozent } from "@/lib/calculators/utils";
import RechnerInput from "./ui/RechnerInput";
import RechnerResultBox from "./ui/RechnerResultBox";
import RechnerResultTable from "./ui/RechnerResultTable";
import RechnerHinweis from "./ui/RechnerHinweis";
import RechnerButton from "./ui/RechnerButton";
import RechnerResults from "./ui/RechnerResults";

export default function RentenabschlagRechner() {
  const [params, setParams] = useState<RentenabschlagParams>({
    monatlicheRente: 1500,
    monate_frueher: 12,
  });

  const [result, setResult] = useState<RentenabschlagResult | null>(null);
  const rates = useRates();

  const handleBerechnen = useCallback(() => {
    setResult(berechne(params, rates));
  }, [params, rates]);

  return (
    <div className="rechner-container">
      <h3 className="rechner-title">Rentenabschlag-Rechner 2026</h3>

      <div className="rechner-inputs">
        <RechnerInput
          label="Monatliche Rente (ohne Abschlag)"
          name="monatlicheRente"
          value={params.monatlicheRente}
          onChange={(val) => setParams((p) => ({ ...p, monatlicheRente: val }))}
          einheit="€/Monat"
          min={0}
          step={100}
        />

        <RechnerInput
          label="Monate frueher in Rente"
          name="monate_frueher"
          value={params.monate_frueher}
          onChange={(val) => setParams((p) => ({ ...p, monate_frueher: val }))}
          einheit="Monate"
          min={1}
          max={60}
          step={1}
        />
      </div>

      <RechnerButton onClick={handleBerechnen} />

      {result && (
        <RechnerResults>
          <div className="rechner-result-boxes">
            <RechnerResultBox
              label="Rente nach Abschlag"
              value={euro(result.renteNachAbschlag)}
              highlight={true}
            />
            <RechnerResultBox
              label="Abschlag"
              value={prozent(result.abschlagProzent)}
            />
            <RechnerResultBox
              label="Monatlicher Verlust"
              value={euro(result.abschlagBetrag)}
              variant="negative"
            />
          </div>

          <h4 className="rechner-result-section-title">Berechnung</h4>
          <RechnerResultTable
            rows={[
              { label: "Rente ohne Abschlag", value: euro(params.monatlicheRente) },
              { label: "Monate vorzeitig", value: `${params.monate_frueher} Monate` },
              { label: "Abschlag pro Monat", value: "0,30 %" },
              { label: "Gesamtabschlag", value: prozent(result.abschlagProzent) },
              { label: "Abschlag in Euro", value: euro(result.abschlagBetrag) },
              { label: "Jaehrlicher Verlust", value: euro(result.verlustJaehrlich) },
            ]}
            footer={{ label: "Rente nach Abschlag", value: euro(result.renteNachAbschlag) }}
          />

          <RechnerHinweis>
            Der Abschlag bei vorzeitiger Rente betraegt 0,3 % pro Monat vor der Regelaltersgrenze.
            Der maximale Abschlag ist auf 14,4 % begrenzt (48 Monate x 0,3 %).
            Der Abschlag gilt dauerhaft fuer die gesamte Rentenbezugszeit.
            Quelle: § 77 Abs. 2 SGB VI.
          </RechnerHinweis>
        </RechnerResults>
      )}
    </div>
  );
}
